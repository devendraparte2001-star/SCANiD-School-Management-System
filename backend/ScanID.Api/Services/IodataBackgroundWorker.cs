using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Background Hosted Service that processes card punch records from the IIodataQueueService
    /// using the database sp_ProcessIodataRecord stored procedure.
    /// </summary>
    public class IodataBackgroundWorker : BackgroundService
    {
        private readonly IIodataQueueService _queueService;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IodataBackgroundWorker> _logger;

        public IodataBackgroundWorker(
            IIodataQueueService queueService,
            IServiceProvider serviceProvider,
            ILogger<IodataBackgroundWorker> logger)
        {
            _queueService = queueService;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("IodataBackgroundWorker is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (_queueService.Count > 0)
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                            var errorLogService = scope.ServiceProvider.GetRequiredService<IErrorLogService>();

                            while (_queueService.TryDequeue(out var line))
                            {
                                if (string.IsNullOrWhiteSpace(line)) continue;

                                _logger.LogInformation($"Processing iodata line: {line}");

                                try
                                {
                                    var parts = line.Split(',');
                                    if (parts.Length >= 3)
                                    {
                                        var rfid = parts[0].Trim();
                                        var punchDate = parts[1].Trim();
                                        var punchTime = parts[2].Trim();
                                        var machineId = parts.Length > 3 ? parts[3].Trim() : null;
                                        var transactionId = parts.Length > 4 ? parts[4].Trim() : null;
                                        var createdDateTime = parts.Length > 5 ? parts[5].Trim() : null;

                                        // Execute database stored procedure for high-speed analysis and upsert
                                        await context.Database.ExecuteSqlRawAsync(
                                            "EXEC dbo.sp_ProcessIodataRecord @Rfid, @PunchDate, @PunchTime, @MachineId, @TransactionId, @CreatedDateTime",
                                            new SqlParameter("@Rfid", rfid),
                                            new SqlParameter("@PunchDate", punchDate),
                                            new SqlParameter("@PunchTime", punchTime),
                                            new SqlParameter("@MachineId", (object?)machineId ?? DBNull.Value),
                                            new SqlParameter("@TransactionId", (object?)transactionId ?? DBNull.Value),
                                            new SqlParameter("@CreatedDateTime", (object?)createdDateTime ?? DBNull.Value)
                                        );
                                    }
                                    else
                                    {
                                        _logger.LogWarning($"Skipped invalid iodata format: {line}");
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Failed to process raw iodata line: {line}");
                                    
                                    // Log failure to core ErrorLogs using error log service
                                    try
                                    {
                                        await errorLogService.InsertErrorLogAsync(
                                            ex.Message,
                                            "Error",
                                            ex.ToString(),
                                            $"IodataBackgroundWorker.ExecuteAsync - Failed line: {line}"
                                        );
                                    }
                                    catch (Exception logEx)
                                    {
                                        _logger.LogError(logEx, "Error log service write failed inside background worker.");
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected exception in background iodata processor loop.");
                }

                // Smooth delay to optimize container CPU usage
                await Task.Delay(1000, stoppingToken);
            }

            _logger.LogInformation("IodataBackgroundWorker is stopping.");
        }
    }
}
