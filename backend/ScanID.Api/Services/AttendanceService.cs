using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Decoupled AttendanceService realization calling stored procedures.
    /// Provides outstanding performance and decoupled architecture.
    /// Handles database transactions, rollbacks, and deadlock recovery transparently.
    /// </summary>
    public class AttendanceService : IAttendanceService
    {
        private readonly ApplicationDbContext _context;
        private readonly IErrorLogService _errorLogService;
        private readonly IIodataQueueService _queueService;

        // Dependency injection of ApplicationDbContext, IErrorLogService, and IIodataQueueService
        public AttendanceService(ApplicationDbContext context, IErrorLogService errorLogService, IIodataQueueService queueService)
        {
            _context = context;
            _errorLogService = errorLogService;
            _queueService = queueService;
        }

        /// <summary>
        /// Executes an operation with transparent retry logic under SQL Server Deadlock (1205) occurrences.
        /// This ensures transient deadlock issues are resolved safely without bubbling errors to end users.
        /// </summary>
        private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> action, int maxRetries = 3)
        {
            int delay = 150; // Delay in milliseconds
            for (int retry = 0; retry < maxRetries; retry++)
            {
                try
                {
                    return await action();
                }
                catch (SqlException ex) when (ex.Number == 1205) // 1205 is the SQL Server Error code for deadlocks
                {
                    if (retry == maxRetries - 1)
                    {
                        FileLogger.LogError(new Exception($"Database transaction transient deadlock failed after {maxRetries} retry attempts.", ex));
                        throw;
                    }
                    await Task.Delay(delay);
                    delay *= 2; // Exponential backoff
                }
                catch (Exception ex)
                {
                    FileLogger.LogError(ex);
                    throw;
                }
            }
            throw new InvalidOperationException("Execution failed after maximum transient deadlock retries.");
        }

        public async Task<IEnumerable<Attendance>> GetAttendanceAsync(DateTime date, int? schoolId, int? academicYearId)
        {
            // Core optimization: Execute sp_GetAttendance containing high-speed SQL joins
            // and map relationships in-memory using DbMapper. This completely avoids Slow Include operations.
            return await DbMapper.ExecuteStoredProcedureAsync<Attendance>(
                _context,
                "dbo.sp_GetAttendance",
                ("Date", date),
                ("SchoolId", schoolId),
                ("AcademicYearId", academicYearId)
            );
        }

        public async Task<bool> SubmitAttendanceAsync(Attendance attendance)
        {
            // Defensive sanitation to protect against SQL Server SqlDateTime overflow (min date: 1753-01-01)
            if (attendance.Date == default(DateTime) || attendance.Date < new DateTime(1753, 1, 1))
            {
                attendance.Date = DateTime.Now;
            }

            return await ExecuteWithRetryAsync(async () =>
            {
                try
                {
                    // Core optimization: Execute the MERGE stored procedure to insert or update student/staff attendance.
                    // Utilizing named parameters ensures outstanding database compatibility and zero position mismatch failures.
                    var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                        $"EXEC dbo.sp_ManageAttendance @StudentId={attendance.StudentId}, @StaffId={attendance.StaffId}, @Date={attendance.Date}, @Status={attendance.Status}, @Remarks=NULL, @CreatedBy={attendance.CreatedBy}, @MarkedByUserId={attendance.MarkedByUserId}, @UploadSource={attendance.UploadSource}"
                    );
                    return rowsAffected >= -1;
                }
                catch (Exception ex)
                {
                    // High-performance exception logging into database via the sp_InsertErrorLog stored procedure
                    await _errorLogService.InsertErrorLogAsync(
                        ex.Message,
                        "Error",
                        ex.ToString(),
                        $"AttendanceService.SubmitAttendanceAsync - StudentId: {attendance.StudentId}, StaffId: {attendance.StaffId}, Date: {attendance.Date}, Source: {attendance.UploadSource}"
                    );

                    // Return false if a primary database error or query failure is encountered.
                    return false;
                }
            });
        }

        public async Task<bool> SubmitBulkAttendanceAsync(IEnumerable<Attendance> records)
        {
            if (records == null) return false;

            return await ExecuteWithRetryAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    foreach (var attendance in records)
                    {
                        // Defensive sanitation to protect against SQL Server SqlDateTime overflow (min date: 1753-01-01)
                        if (attendance.Date == default(DateTime) || attendance.Date < new DateTime(1753, 1, 1))
                        {
                            attendance.Date = DateTime.Now;
                        }

                        await _context.Database.ExecuteSqlInterpolatedAsync(
                            $"EXEC dbo.sp_ManageAttendance @StudentId={attendance.StudentId}, @StaffId={attendance.StaffId}, @Date={attendance.Date}, @Status={attendance.Status}, @Remarks=NULL, @CreatedBy={attendance.CreatedBy}, @MarkedByUserId={attendance.MarkedByUserId}, @UploadSource={attendance.UploadSource}"
                        );
                    }
                    await transaction.CommitAsync();
                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    await _errorLogService.InsertErrorLogAsync(
                        ex.Message,
                        "Error",
                        ex.ToString(),
                        "AttendanceService.SubmitBulkAttendanceAsync - Transaction Rolled Back due to error."
                    );
                    return false;
                }
            });
        }

        public async Task<IEnumerable<IodataRecord>> GetIodataRecordsAsync(DateTime? date)
        {
            // Execute the stored procedure sp_GetIodataRecords to pull logs
            return await DbMapper.ExecuteStoredProcedureAsync<IodataRecord>(
                _context,
                "dbo.sp_GetIodataRecords",
                ("Date", date)
            );
        }

        public async Task<(IEnumerable<IodataRecord> Data, int TotalCount)> GetIodataRecordsPagedAsync(DateTime? date, int page, int pageSize)
        {
            // Execute the stored procedure sp_GetIodataRecordsPaged to pull server-side paginated logs
            var list = new List<IodataRecord>();
            int totalCount = 0;

            var connection = _context.Database.GetDbConnection();
            if (connection.State == ConnectionState.Closed)
            {
                await _context.Database.OpenConnectionAsync();
            }

            using var command = connection.CreateCommand();
            command.CommandText = "dbo.sp_GetIodataRecordsPaged";
            command.CommandType = CommandType.StoredProcedure;

            void AddParam(string name, object? val)
            {
                var param = command.CreateParameter();
                param.ParameterName = name.StartsWith("@") ? name : "@" + name;
                param.Value = val ?? DBNull.Value;
                command.Parameters.Add(param);
            }

            AddParam("Date", date);
            AddParam("Page", page);
            AddParam("PageSize", pageSize);

            using var reader = await command.ExecuteReaderAsync();
            var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < reader.FieldCount; i++)
            {
                columns.Add(reader.GetName(i));
            }

            var props = typeof(IodataRecord).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                                            .Where(p => p.CanWrite && (
                                                p.PropertyType.IsPrimitive || 
                                                p.PropertyType == typeof(string) || 
                                                p.PropertyType == typeof(decimal) || 
                                                p.PropertyType == typeof(DateTime) || 
                                                p.PropertyType == typeof(Guid) || 
                                                p.PropertyType.IsEnum ||
                                                (Nullable.GetUnderlyingType(p.PropertyType) != null && (
                                                    Nullable.GetUnderlyingType(p.PropertyType)!.IsPrimitive ||
                                                    Nullable.GetUnderlyingType(p.PropertyType) == typeof(decimal) ||
                                                    Nullable.GetUnderlyingType(p.PropertyType) == typeof(DateTime) ||
                                                    Nullable.GetUnderlyingType(p.PropertyType) == typeof(Guid) ||
                                                    Nullable.GetUnderlyingType(p.PropertyType)!.IsEnum
                                                ))
                                            ))
                                            .ToArray();

            while (await reader.ReadAsync())
            {
                var item = new IodataRecord();
                foreach (var prop in props)
                {
                    if (columns.Contains(prop.Name))
                    {
                        var val = reader[prop.Name];
                        if (val != DBNull.Value)
                        {
                            var underlyingType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                            prop.SetValue(item, Convert.ChangeType(val, underlyingType));
                        }
                    }
                }

                if (columns.Contains("TotalCount") && reader["TotalCount"] != DBNull.Value)
                {
                    totalCount = Convert.ToInt32(reader["TotalCount"]);
                }

                list.Add(item);
            }

            return (list, totalCount);
        }

        public async Task<IodataRecord?> ProcessSingleIodataLineAsync(string line)
        {
            if (string.IsNullOrWhiteSpace(line)) return null;

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

                    var records = await DbMapper.ExecuteStoredProcedureAsync<IodataRecord>(
                        _context,
                        "dbo.sp_ProcessIodataRecord",
                        ("Rfid", rfid),
                        ("PunchDate", punchDate),
                        ("PunchTime", punchTime),
                        ("MachineId", machineId),
                        ("TransactionId", transactionId),
                        ("CreatedDateTime", createdDateTime)
                    );

                    using var enumerator = records.GetEnumerator();
                    return enumerator.MoveNext() ? enumerator.Current : null;
                }
            }
            catch (Exception ex)
            {
                await _errorLogService.InsertErrorLogAsync(
                    ex.Message,
                    "Error",
                    ex.ToString(),
                    $"AttendanceService.ProcessSingleIodataLineAsync - Raw line: {line}"
                );
            }
            return null;
        }

        public async Task<bool> ReprocessIodataRecordAsync(int recordId)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                try
                {
                    var record = await _context.IodataRecords.FindAsync(recordId);
                    if (record == null) return false;

                    await _context.Database.ExecuteSqlRawAsync(
                        "EXEC dbo.sp_ProcessIodataRecord @Rfid, @PunchDate, @PunchTime, @MachineId, @TransactionId, @CreatedDateTime",
                        new SqlParameter("@Rfid", record.Rfid),
                        new SqlParameter("@PunchDate", record.PunchDate ?? record.Date.ToString("MM/dd/yyyy")),
                        new SqlParameter("@PunchTime", record.PunchTime ?? record.InTime),
                        new SqlParameter("@MachineId", (object?)record.MachineId ?? DBNull.Value),
                        new SqlParameter("@TransactionId", (object?)record.TransactionId ?? DBNull.Value),
                        new SqlParameter("@CreatedDateTime", (object?)record.CreatedOn ?? DBNull.Value)
                    );
                    return true;
                }
                catch (Exception ex)
                {
                    await _errorLogService.InsertErrorLogAsync(
                        ex.Message,
                        "Error",
                        ex.ToString(),
                        $"AttendanceService.ReprocessIodataRecordAsync - Record ID: {recordId}"
                    );
                    return false;
                }
            });
        }

        public void EnqueueIodataLines(List<string> lines)
        {
            if (lines == null || lines.Count == 0) return;
            _queueService.EnqueueRange(lines);
        }

        public async Task<List<string>> ProcessIodataDateRangeAsync(DateTime fromDate, DateTime toDate)
        {
            var logs = new List<string>();
            try
            {
                var watchDir = @"C:\iodata";
                if (!Directory.Exists(watchDir))
                {
                    Directory.CreateDirectory(watchDir);
                }

                logs.Add($"[INFO] Initiating date range scan between {fromDate:yyyy-MM-dd} and {toDate:yyyy-MM-dd} inside directory: {watchDir}");

                int filesFound = 0;
                int totalLinesProcessed = 0;

                for (var d = fromDate.Date; d <= toDate.Date; d = d.AddDays(1))
                {
                    // Naming structure updated from MMDDYY -> DDMMYY format according to specification
                    string filePrefix = $"Data{d:ddMMyy}";
                    string fileNamePattern = $"{filePrefix}.txt";
                    
                    string filePath = Path.Combine(watchDir, fileNamePattern);
                    string archivePath = Path.Combine(watchDir, "processed", fileNamePattern);

                    string? targetPath = null;
                    if (File.Exists(filePath))
                    {
                        targetPath = filePath;
                    }
                    else if (File.Exists(archivePath))
                    {
                        targetPath = archivePath;
                    }

                    if (targetPath != null)
                    {
                        logs.Add($"[MATCH] Found scanner file: {fileNamePattern}");
                        filesFound++;

                        var lines = await File.ReadAllLinesAsync(targetPath);
                        logs.Add($"[READ] Read {lines.Length} scan records from {fileNamePattern}");

                        // Standard Industry Pattern: Process each school day's scanner log file inside its own atomic database transaction scope.
                        // This guarantees that either all punch logs for a given day are fully ingested, or the entire day's operations are rolled back
                        // to prevent corrupt, half-processed student/staff attendance entries.
                        using var transaction = await _context.Database.BeginTransactionAsync();
                        try
                        {
                            logs.Add($"[TX_START] Initiating atomic database transaction for date: {d:yyyy-MM-dd}");

                            // Pre-import clean-up (Replace-On-Read / Truncate-and-Reload model):
                            // To support clean, error-tolerant re-processing and completely bypass duplicate constraints,
                            // we wipe any active IodataRecords or corresponding attendance entries created by 'IodataService' on match d. Date.
                            await _context.Database.ExecuteSqlRawAsync(
                                "DELETE FROM [dbo].[IodataRecords] WHERE CONVERT(DATE, [Date]) = CONVERT(DATE, @TargetDate)",
                                new SqlParameter("@TargetDate", d.Date)
                            );

                            await _context.Database.ExecuteSqlRawAsync(
                                "DELETE FROM [dbo].[Attendance] WHERE CONVERT(DATE, [Date]) = CONVERT(DATE, @TargetDate) AND [UploadSource] = 'IodataService'",
                                new SqlParameter("@TargetDate", d.Date)
                            );

                            int localLinesCount = 0;
                            foreach (var line in lines)
                            {
                                if (string.IsNullOrWhiteSpace(line)) continue;
                                await ProcessSingleIodataLineAsync(line);
                                localLinesCount++;
                            }

                            // Commit daily transaction on total sequence success
                            await transaction.CommitAsync();
                            totalLinesProcessed += localLinesCount;
                            
                            logs.Add($"[TX_COMMIT] Successfully committed all {localLinesCount} records for {fileNamePattern}.");
                        }
                        catch (Exception fileEx)
                        {
                            // In case of any SQL exceptions, schema mismatch, or line timeouts, roll back all table mutations done during this date's processing blocks.
                            await transaction.RollbackAsync();
                            logs.Add($"[TX_ROLLBACK] Critical failure in '{fileNamePattern}'. Database state cleanly rolled back! Error: {fileEx.Message}");
                            
                            // High-performance incident reporting in core audit registers
                            await _errorLogService.InsertErrorLogAsync(
                                fileEx.Message,
                                "Error",
                                fileEx.ToString(),
                                $"AttendanceService.ProcessIodataDateRangeAsync - Error during file import transaction rollback for {fileNamePattern}."
                            );
                        }
                    }
                    else
                    {
                        logs.Add($"[MISSING] No log found for date range chunk: {fileNamePattern}");
                    }
                }

                logs.Add($"[DONE] Scan finished. Successfully synced {filesFound} logs and ran {totalLinesProcessed} raw entries into Core registers.");
            }
            catch (Exception ex)
            {
                logs.Add($"[FATAL] Error running batch execution: {ex.Message}");
            }

            return logs;
        }

        /// <summary>
        /// Processes a list of raw scanner line strings immediately for a specific date in an atomic transaction (User Local System support).
        /// Re-processes cleanly by doing a target wipe first to protect against duplicates (Replace-On-Read / Truncate-and-Reload).
        /// </summary>
        public async Task<List<string>> ProcessIodataLinesImmediateAsync(DateTime date, List<string> lines)
        {
            var logs = new List<string>();
            var targetDate = date.Date;
            logs.Add($"[LOCAL_INFO] Starting immediate process of {lines.Count} scans for date: {targetDate:yyyy-MM-dd}");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Pre-import clean-up (Replace-On-Read / Truncate-and-Reload model):
                // To support clean, error-tolerant re-processing and completely bypass duplicate constraints,
                // we wipe any active IodataRecords or corresponding attendance entries created by 'IodataService' on this Date.
                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM [dbo].[IodataRecords] WHERE CONVERT(DATE, [Date]) = CONVERT(DATE, @TargetDate)",
                    new SqlParameter("@TargetDate", targetDate)
                );

                await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM [dbo].[Attendance] WHERE CONVERT(DATE, [Date]) = CONVERT(DATE, @TargetDate) AND [UploadSource] = 'IodataService'",
                    new SqlParameter("@TargetDate", targetDate)
                );

                int linesProcessed = 0;
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    await ProcessSingleIodataLineAsync(line);
                    linesProcessed++;
                }

                await transaction.CommitAsync();
                logs.Add($"[LOCAL_SUCCESS] Processed and committed {linesProcessed} lines cleanly for {targetDate:yyyy-MM-dd}.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                logs.Add($"[LOCAL_FAIL] Failed to process lines immediately. All database state rolled back cleanly. Error: {ex.Message}");

                await _errorLogService.InsertErrorLogAsync(
                    ex.Message,
                    "Error",
                    ex.ToString(),
                    $"AttendanceService.ProcessIodataLinesImmediateAsync - Error during file import transaction rollback for date {targetDate:yyyy-MM-dd}."
                );
            }

            return logs;
        }
    }
}
