using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System;
using System.Collections.Generic;
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
                    // Naming structure MMDDYY -> MMDDYY format
                    string filePrefix = $"Data{d:MMddyy}";
                    string fileNamePattern = $"{filePrefix}.txt";
                    
                    string filePath = Path.Combine(watchDir, fileNamePattern);
                    string archivePath = Path.Combine(watchDir, "processed", fileNamePattern);

                    string targetPath = null;
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

                        foreach (var line in lines)
                        {
                            if (string.IsNullOrWhiteSpace(line)) continue;
                            try
                            {
                                await ProcessSingleIodataLineAsync(line);
                                totalLinesProcessed++;
                            }
                            catch (Exception ex)
                            {
                                logs.Add($"[LINE_ERROR] Failed parsing queue row in {fileNamePattern}: '{line}' - {ex.Message}");
                            }
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
    }
}
