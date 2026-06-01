using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Background Hosted Service that automatically monitors a local directory (e.g., C:\iodata) on Windows
    /// for offline RFID scanner card punch logs, parses them, marks attendance via the stored procedure,
    /// and safely archives processed records.
    /// </summary>
    public class IodataFolderWatcherService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<IodataFolderWatcherService> _logger;
        private readonly string _watchDirectory;
        private readonly string _archiveDirectory;

        public IodataFolderWatcherService(
            IServiceProvider serviceProvider,
            ILogger<IodataFolderWatcherService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;

            // Retrieve target folder from appsettings.json or default to standard C:\iodata
            var definedPath = configuration["Iodata:WatchDirectory"];
            _watchDirectory = !string.IsNullOrWhiteSpace(definedPath) 
                ? definedPath 
                : @"C:\iodata";

            _archiveDirectory = Path.Combine(_watchDirectory, "processed");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation($"IO Data Local Folder Watcher starting. Monitoring: {_watchDirectory}");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Ensure watch folder exists safely
                    if (!Directory.Exists(_watchDirectory))
                    {
                        // In container environments or environments where C:\iodata isn't used, we skip silently to avoid spamming logs
                        await Task.Delay(10000, stoppingToken);
                        continue;
                    }

                    // Scan directory for new punch text/csv log files
                    var files = Directory.GetFiles(_watchDirectory, "*.*")
                        .Where(f => f.EndsWith(".txt", StringComparison.OrdinalIgnoreCase) || 
                                    f.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                        .OrderBy(f => f)
                        .ToList();

                    if (files.Any())
                    {
                        // Ensure processed archive directory exists
                        if (!Directory.Exists(_archiveDirectory))
                        {
                            Directory.CreateDirectory(_archiveDirectory);
                        }

                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                            var errorLogService = scope.ServiceProvider.GetRequiredService<IErrorLogService>();

                            foreach (var filePath in files)
                            {
                                if (stoppingToken.IsCancellationRequested) break;

                                _logger.LogInformation($"Found new IO Data punch file: {Path.GetFileName(filePath)}. Initiating processing...");

                                try
                                {
                                    // Make sure file is not locked by card scanner writing to it
                                    if (IsFileLocked(filePath))
                                    {
                                        _logger.LogWarning($"File {Path.GetFileName(filePath)} is currently locked. Skipping until next check.");
                                        continue;
                                    }

                                    var lines = await File.ReadAllLinesAsync(filePath, stoppingToken);
                                    int processedCount = 0;

                                    foreach (var line in lines)
                                    {
                                        if (string.IsNullOrWhiteSpace(line)) continue;

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

                                                // Execute high-speed stored procedure for upserts
                                                await context.Database.ExecuteSqlRawAsync(
                                                    "EXEC dbo.sp_ProcessIodataRecord @Rfid, @PunchDate, @PunchTime, @MachineId, @TransactionId, @CreatedDateTime",
                                                    new SqlParameter("@Rfid", rfid),
                                                    new SqlParameter("@PunchDate", punchDate),
                                                    new SqlParameter("@PunchTime", punchTime),
                                                    new SqlParameter("@MachineId", (object?)machineId ?? DBNull.Value),
                                                    new SqlParameter("@TransactionId", (object?)transactionId ?? DBNull.Value),
                                                    new SqlParameter("@CreatedDateTime", (object?)createdDateTime ?? DBNull.Value)
                                                );

                                                processedCount++;
                                            }
                                        }
                                        catch (Exception lineEx)
                                        {
                                            _logger.LogError(lineEx, $"Failed to process scan row in file {Path.GetFileName(filePath)}: {line}");
                                            await errorLogService.InsertErrorLogAsync(
                                                lineEx.Message,
                                                "Error",
                                                lineEx.ToString(),
                                                $"IodataFolderWatcherService - Failed row: {line} in file: {Path.GetFileName(filePath)}"
                                            );
                                        }
                                    }

                                    // Archive processed file to 'processed' directory with unique timestamp prefix
                                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                                    var extension = Path.GetExtension(filePath);
                                    var uniqueName = $"{fileName}_processed_{DateTime.Now:yyyyMMddHHmmss}{extension}";
                                    var destPath = Path.Combine(_archiveDirectory, uniqueName);

                                    File.Move(filePath, destPath);
                                    _logger.LogInformation($"Successfully processed {processedCount} punch rows from {Path.GetFileName(filePath)}. Archived to {uniqueName}");
                                }
                                catch (Exception fileEx)
                                {
                                    _logger.LogError(fileEx, $"Critical failure processing punch file: {filePath}");
                                    await errorLogService.InsertErrorLogAsync(
                                        fileEx.Message,
                                        "Error",
                                        fileEx.ToString(),
                                        $"IodataFolderWatcherService - Failed file: {Path.GetFileName(filePath)}"
                                    );
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Exception encountered in IO Data folder watcher loop.");
                }

                // Poll directory index every 5 seconds to minimize disk operations
                await Task.Delay(5000, stoppingToken);
            }
        }

        private bool IsFileLocked(string filePath)
        {
            try
            {
                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
                {
                    stream.Close();
                }
            }
            catch (IOException)
            {
                return true;
            }
            return false;
        }
    }
}
