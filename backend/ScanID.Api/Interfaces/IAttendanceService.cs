using ScanID.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ScanID.Api.Interfaces
{
    /// <summary>
    /// Service Interface for Attendance Tracking operations.
    /// Supports Dependency Injection and decoupled system interactions.
    /// </summary>
    public interface IAttendanceService
    {
        Task<IEnumerable<Attendance>> GetAttendanceAsync(DateTime date, int? schoolId, int? academicYearId);
        Task<bool> SubmitAttendanceAsync(Attendance attendance);
        Task<bool> SubmitBulkAttendanceAsync(IEnumerable<Attendance> records);
        
        // Iodata Raw scanner logging endpoints
        Task<IEnumerable<IodataRecord>> GetIodataRecordsAsync(DateTime? date);
        Task<(IEnumerable<IodataRecord> Data, int TotalCount)> GetIodataRecordsPagedAsync(DateTime? date, int page, int pageSize);
        Task<IodataRecord?> ProcessSingleIodataLineAsync(string line);
        Task<bool> ReprocessIodataRecordAsync(int recordId);
        void EnqueueIodataLines(List<string> lines);
        Task<List<string>> ProcessIodataDateRangeAsync(DateTime fromDate, DateTime toDate);
        
        /// <summary>
        /// Processes a list of raw scanner line strings immediately for a specific date in an atomic transaction (User Local System support).
        /// Re-processes cleanly by doing a target wipe first to protect against duplicates (Replace-On-Read / Truncate-and-Reload).
        /// </summary>
        Task<List<string>> ProcessIodataLinesImmediateAsync(DateTime date, List<string> lines, bool wipeTargetDate = false);

        // Reprocess range, and manage locking, auditing, and leave systems directly according to FRS Spec
        Task<bool> ReprocessAttendanceRangeAsync(DateTime fromDate, DateTime toDate, int? studentId, int? staffId, int? schoolId);
        Task<IEnumerable<LeaveApplication>> GetLeavesAsync(int? studentId, int? staffId, int? schoolId);
        Task<bool> SubmitLeaveAsync(LeaveApplication leave);
        Task<IEnumerable<AttendanceAuditLog>> GetAuditLogsAsync();
        Task<bool> LockAttendanceMonthAsync(int year, int month, string lockedBy);
        Task<bool> IsAttendanceMonthLockedAsync(DateTime date);
    }
}
