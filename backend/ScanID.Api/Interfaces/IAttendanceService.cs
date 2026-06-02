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
    }
}
