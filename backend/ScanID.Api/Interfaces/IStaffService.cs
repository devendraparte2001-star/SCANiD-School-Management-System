using ScanID.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ScanID.Api.Interfaces
{
    /// <summary>
    /// Service Interface for Staff Management operations.
    /// Supports Dependency Injection and decoupled system interactions.
    /// </summary>
    public interface IStaffService
    {
        Task<IEnumerable<Staff>> GetStaffAsync(int? schoolId);
        Task<(IEnumerable<Staff> Data, int TotalCount)> GetStaffPagedAsync(
            int? schoolId,
            int? academicYearId,
            int page,
            int pageSize,
            string? sortBy,
            string? sortOrder,
            string? search,
            string? status,
            string? subject);
        Task<Staff?> GetStaffByIdAsync(int id);
        Task<Staff> CreateStaffAsync(Staff staff);
        Task<bool> UpdateStaffAsync(Staff staff);
        Task<bool> DeleteStaffAsync(int id);
        Task<bool> SavePhotoPathAsync(int id, string path);
        Task<BulkStaffUploadResult> BulkUploadStaffAsync(IEnumerable<BulkStaffUploadRow> rows, int schoolId, int academicYearId, string createdBy);
    }
}
