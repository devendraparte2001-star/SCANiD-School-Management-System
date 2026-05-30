#pragma warning disable CS8604 // Disable warning for possible null reference argument for parameter 'parameters' in SqlQueryRaw
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Decoupled StaffService realization calling high-performance Stored Procedures.
    /// This keeps staff catalogs highly optimized and maintains SOLID architectures.
    /// Handles database transactions, rollbacks, and deadlock recovery transparently.
    /// </summary>
    public class StaffService : IStaffService
    {
        private readonly ApplicationDbContext _context;

        public StaffService(ApplicationDbContext context)
        {
            _context = context;
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

        public async Task<IEnumerable<Staff>> GetStaffAsync(int? schoolId)
        {
            // Core optimization: Execute sp_GetStaff containing SQL joins and handle relation mapping in-memory via DbMapper.
            return await DbMapper.ExecuteStoredProcedureAsync<Staff>(
                _context,
                "dbo.sp_GetStaff",
                ("SchoolId", schoolId)
            );
        }

        public async Task<(IEnumerable<Staff> Data, int TotalCount)> GetStaffPagedAsync(
            int? schoolId,
            int? academicYearId,
            int page,
            int pageSize,
            string? sortBy,
            string? sortOrder,
            string? search,
            string? status,
            string? subject)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var list = new List<Staff>();
                int totalCount = 0;

                var connection = _context.Database.GetDbConnection();
                if (connection.State == System.Data.ConnectionState.Closed)
                {
                    await _context.Database.OpenConnectionAsync();
                }

                using var command = connection.CreateCommand();
                command.CommandText = "dbo.sp_GetStaffPaged";
                command.CommandType = System.Data.CommandType.StoredProcedure;

                void AddParam(string name, object? val)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = name.StartsWith("@") ? name : "@" + name;
                    param.Value = val ?? DBNull.Value;
                    command.Parameters.Add(param);
                }

                AddParam("SchoolId", schoolId);
                AddParam("AcademicYearId", academicYearId);
                AddParam("Page", page);
                AddParam("PageSize", pageSize);
                AddParam("SortBy", sortBy);
                AddParam("SortOrder", sortOrder);
                AddParam("Search", search);
                AddParam("Status", status);
                AddParam("Subject", subject);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var item = new Staff
                    {
                        Id = reader["Id"] != DBNull.Value ? Convert.ToInt32(reader["Id"]) : 0,
                        UserId = reader["UserId"] != DBNull.Value ? Convert.ToInt32(reader["UserId"]) : 0,
                        SchoolId = reader["SchoolId"] != DBNull.Value ? Convert.ToInt32(reader["SchoolId"]) : 0,
                        EmployeeId = reader["EmployeeId"] != DBNull.Value ? Convert.ToString(reader["EmployeeId"]) ?? string.Empty : string.Empty,
                        Initials = reader["Initials"] != DBNull.Value ? reader["Initials"].ToString() : null,
                        Department = reader["Department"] != DBNull.Value ? reader["Department"].ToString() : null,
                        Qualification = reader["Qualification"] != DBNull.Value ? reader["Qualification"].ToString() : null,
                        ContactNumber = reader["ContactNumber"] != DBNull.Value ? reader["ContactNumber"].ToString() : null,
                        Contact2 = reader["Contact2"] != DBNull.Value ? reader["Contact2"].ToString() : null,
                        Status = reader["Status"] != DBNull.Value ? Convert.ToString(reader["Status"]) ?? "Active" : "Active",
                        ProfilePhotoPath = reader["ProfilePhotoPath"] != DBNull.Value ? reader["ProfilePhotoPath"].ToString() : null,
                        Experience = reader["Experience"] != DBNull.Value ? reader["Experience"].ToString() : null,
                        Subject = reader["Subject"] != DBNull.Value ? reader["Subject"].ToString() : null,
                        StandardId = reader["StandardId"] != DBNull.Value ? Convert.ToInt32(reader["StandardId"]) : null,
                        SectionId = reader["SectionId"] != DBNull.Value ? Convert.ToInt32(reader["SectionId"]) : null,
                        IsClassTeacher = reader["IsClassTeacher"] != DBNull.Value && Convert.ToBoolean(reader["IsClassTeacher"]),
                        Gender = reader["Gender"] != DBNull.Value ? reader["Gender"].ToString() : null,
                        DateOfBirth = reader["DateOfBirth"] != DBNull.Value ? Convert.ToDateTime(reader["DateOfBirth"]) : null,
                        BloodGroupId = reader["BloodGroupId"] != DBNull.Value ? Convert.ToInt32(reader["BloodGroupId"]) : null,
                        RetirementDate = reader["RetirementDate"] != DBNull.Value ? Convert.ToDateTime(reader["RetirementDate"]) : null,
                        ReligionId = reader["ReligionId"] != DBNull.Value ? Convert.ToInt32(reader["ReligionId"]) : null,
                        CasteId = reader["CasteId"] != DBNull.Value ? Convert.ToInt32(reader["CasteId"]) : null,
                        SubCasteId = reader["SubCasteId"] != DBNull.Value ? Convert.ToInt32(reader["SubCasteId"]) : null,
                        CategoryId = reader["CategoryId"] != DBNull.Value ? Convert.ToInt32(reader["CategoryId"]) : null,
                        DateOfJoining = reader["DateOfJoining"] != DBNull.Value ? Convert.ToDateTime(reader["DateOfJoining"]) : null,
                        Address = reader["Address"] != DBNull.Value ? reader["Address"].ToString() : null,
                        CityId = reader["CityId"] != DBNull.Value ? Convert.ToInt32(reader["CityId"]) : null,
                        StateId = reader["StateId"] != DBNull.Value ? Convert.ToInt32(reader["StateId"]) : null,
                        BioId = reader["BioId"] != DBNull.Value ? reader["BioId"].ToString() : null,
                        Rfid = reader["Rfid"] != DBNull.Value ? reader["Rfid"].ToString() : null,
                        ShiftId = reader["ShiftId"] != DBNull.Value ? Convert.ToInt32(reader["ShiftId"]) : null,
                        CreatedOn = reader["CreatedOn"] != DBNull.Value ? Convert.ToDateTime(reader["CreatedOn"]) : DateTime.UtcNow,
                        ModifiedOn = reader["ModifiedOn"] != DBNull.Value ? Convert.ToDateTime(reader["ModifiedOn"]) : DateTime.UtcNow,
                        CreatedBy = reader["CreatedBy"] != DBNull.Value ? reader["CreatedBy"].ToString() : null,
                        ModifiedBy = reader["ModifiedBy"] != DBNull.Value ? reader["ModifiedBy"].ToString() : null,
                        IsDeleted = reader["IsDeleted"] != DBNull.Value && Convert.ToBoolean(reader["IsDeleted"])
                    };

                    if (reader["UserName"] != DBNull.Value || reader["UserEmail"] != DBNull.Value)
                    {
                        item.User = new User
                        {
                            Id = item.UserId,
                            Name = reader["UserName"] != DBNull.Value ? Convert.ToString(reader["UserName"]) ?? string.Empty : string.Empty,
                            Email = reader["UserEmail"] != DBNull.Value ? Convert.ToString(reader["UserEmail"]) ?? string.Empty : string.Empty,
                            RoleId = reader["RoleId"] != DBNull.Value ? Convert.ToInt32(reader["RoleId"]) : 0,
                            Role = ""
                        };
                    }

                    // Populate joins dynamically for fast UI rendering
                    if (reader.HasColumn("BloodGroupName") && reader["BloodGroupName"] != DBNull.Value)
                    {
                        item.BloodGroup = new BloodGroup { Id = item.BloodGroupId ?? 0, Name = reader["BloodGroupName"].ToString()! };
                    }
                    if (reader.HasColumn("ReligionName") && reader["ReligionName"] != DBNull.Value)
                    {
                        item.Religion = new Religion { Id = item.ReligionId ?? 0, Name = reader["ReligionName"].ToString()! };
                    }
                    if (reader.HasColumn("CasteName") && reader["CasteName"] != DBNull.Value)
                    {
                        item.Caste = new Caste { Id = item.CasteId ?? 0, Name = reader["CasteName"].ToString()! };
                    }
                    if (reader.HasColumn("SubCasteName") && reader["SubCasteName"] != DBNull.Value)
                    {
                        item.SubCaste = new SubCaste { Id = item.SubCasteId ?? 0, Name = reader["SubCasteName"].ToString()! };
                    }
                    if (reader.HasColumn("CategoryName") && reader["CategoryName"] != DBNull.Value)
                    {
                        item.Category = new Category { Id = item.CategoryId ?? 0, Name = reader["CategoryName"].ToString()! };
                    }
                    if (reader.HasColumn("CityName") && reader["CityName"] != DBNull.Value)
                    {
                        item.City = new City { Id = item.CityId ?? 0, Name = reader["CityName"].ToString()! };
                    }
                    if (reader.HasColumn("StateName") && reader["StateName"] != DBNull.Value)
                    {
                        item.State = new State { Id = item.StateId ?? 0, Name = reader["StateName"].ToString()! };
                    }
                    if (reader.HasColumn("ShiftName") && reader["ShiftName"] != DBNull.Value)
                    {
                        item.Shift = new Shift { Id = item.ShiftId ?? 0, Name = reader["ShiftName"].ToString()! };
                    }
                    if (reader.HasColumn("StandardName") && reader["StandardName"] != DBNull.Value)
                    {
                        item.Standard = new Standard { Id = item.StandardId ?? 0, Name = reader["StandardName"].ToString()! };
                    }
                    if (reader.HasColumn("SectionName") && reader["SectionName"] != DBNull.Value)
                    {
                        item.Section = new Section { Id = item.SectionId ?? 0, Name = reader["SectionName"].ToString()! };
                    }

                    if (reader["TotalCount"] != DBNull.Value)
                    {
                        totalCount = Convert.ToInt32(reader["TotalCount"]);
                    }

                    list.Add(item);
                }

                return ((IEnumerable<Staff>)list, totalCount);
            });
        }

        public async Task<Staff?> GetStaffByIdAsync(int id)
        {
            var list = await GetStaffAsync(null);
            return list.FirstOrDefault(t => t.Id == id);
        }

        public async Task<Staff> CreateStaffAsync(Staff staff)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // If no UserId represents a valid link, and a new nested User is available, register it first
                    if (staff.UserId <= 0 && staff.User != null)
                    {
                        staff.User.PasswordHash = string.IsNullOrEmpty(staff.User.PasswordHash) ? "password123" : staff.User.PasswordHash;
                        staff.User.Id = await DbMapper.ExecuteScalarStoredProcedureAsync(
                            _context,
                            "dbo.sp_ManageUser",
                            ("Action", "INSERT"),
                            ("Id", null),
                            ("Username", staff.User.Username),
                            ("PasswordHash", staff.User.PasswordHash),
                            ("Name", staff.User.Name),
                            ("Email", staff.User.Email),
                            ("Role", staff.User.Role),
                            ("RoleId", staff.User.RoleId),
                            ("SchoolId", staff.User.SchoolId),
                            ("CreatedBy", staff.CreatedBy)
                        );
                        staff.UserId = staff.User.Id;
                    }

                    // Execute the sp_ManageStaff stored procedure safely using high-performance ADO.NET DbMapper
                    staff.Id = await DbMapper.ExecuteScalarStoredProcedureAsync(
                        _context,
                        "dbo.sp_ManageStaff",
                        ("Action", "INSERT"),
                        ("Id", null),
                        ("UserId", staff.UserId),
                        ("EmployeeId", staff.EmployeeId),
                        ("Initials", staff.Initials),
                        ("Department", staff.Department),
                        ("Qualification", staff.Qualification),
                        ("ContactNumber", staff.ContactNumber),
                        ("Contact2", staff.Contact2),
                        ("Status", staff.Status),
                        ("SchoolId", staff.SchoolId),
                        ("ProfilePhotoPath", staff.ProfilePhotoPath),
                        ("Experience", staff.Experience),
                        ("Subject", staff.Subject),
                        ("StandardId", staff.StandardId),
                        ("SectionId", staff.SectionId),
                        ("IsClassTeacher", staff.IsClassTeacher),
                        ("Gender", staff.Gender),
                        ("DateOfBirth", staff.DateOfBirth),
                        ("BloodGroupId", staff.BloodGroupId),
                        ("RetirementDate", staff.RetirementDate),
                        ("ReligionId", staff.ReligionId),
                        ("CasteId", staff.CasteId),
                        ("SubCasteId", staff.SubCasteId),
                        ("CategoryId", staff.CategoryId),
                        ("DateOfJoining", staff.DateOfJoining),
                        ("Address", staff.Address),
                        ("CityId", staff.CityId),
                        ("StateId", staff.StateId),
                        ("BioId", staff.BioId),
                        ("Rfid", staff.Rfid),
                        ("ShiftId", staff.ShiftId),
                        ("CreatedBy", staff.CreatedBy),
                        ("ModifiedBy", staff.CreatedBy)
                    );

                    await transaction.CommitAsync();
                    return staff;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    FileLogger.LogError(new Exception($"Failed to complete CreateStaffAsync transaction for Staff. Rolled back.", ex));
                    throw;
                }
            });
        }

        public async Task<bool> UpdateStaffAsync(Staff staff)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var sql = @"
                        EXEC dbo.sp_ManageStaff 
                            @Action = 'UPDATE', 
                            @Id = @pId, 
                            @UserId = @pUserId, 
                            @EmployeeId = @pEmployeeId, 
                            @Initials = @pInitials, 
                            @Department = @pDepartment, 
                            @Qualification = @pQualification, 
                            @ContactNumber = @pContactNumber, 
                            @Contact2 = @pContact2, 
                            @Status = @pStatus, 
                            @SchoolId = @pSchoolId, 
                            @ProfilePhotoPath = @pProfilePhotoPath, 
                            @Experience = @pExperience, 
                            @Subject = @pSubject, 
                            @StandardId = @pStandardId, 
                            @SectionId = @pSectionId, 
                            @IsClassTeacher = @pIsClassTeacher, 
                            @Gender = @pGender, 
                            @DateOfBirth = @pDateOfBirth, 
                            @BloodGroupId = @pBloodGroupId, 
                            @RetirementDate = @pRetirementDate, 
                            @ReligionId = @pReligionId, 
                            @CasteId = @pCasteId, 
                            @SubCasteId = @pSubCasteId, 
                            @CategoryId = @pCategoryId, 
                            @DateOfJoining = @pDateOfJoining, 
                            @Address = @pAddress, 
                            @CityId = @pCityId, 
                            @StateId = @pStateId, 
                            @BioId = @pBioId, 
                            @Rfid = @pRfid, 
                            @ShiftId = @pShiftId, 
                            @ModifiedBy = @pModifiedBy";

                    var rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                        sql,
                        new SqlParameter("@pId", staff.Id),
                        new SqlParameter("@pUserId", staff.UserId <= 0 ? (object)DBNull.Value : staff.UserId),
                        new SqlParameter("@pEmployeeId", staff.EmployeeId ?? string.Empty),
                        new SqlParameter("@pInitials", staff.Initials ?? (object)DBNull.Value),
                        new SqlParameter("@pDepartment", staff.Department ?? (object)DBNull.Value),
                        new SqlParameter("@pQualification", staff.Qualification ?? (object)DBNull.Value),
                        new SqlParameter("@pContactNumber", staff.ContactNumber ?? (object)DBNull.Value),
                        new SqlParameter("@pContact2", staff.Contact2 ?? (object)DBNull.Value),
                        new SqlParameter("@pStatus", staff.Status ?? "Active"),
                        new SqlParameter("@pSchoolId", staff.SchoolId),
                        new SqlParameter("@pProfilePhotoPath", staff.ProfilePhotoPath ?? (object)DBNull.Value),
                        new SqlParameter("@pExperience", staff.Experience ?? (object)DBNull.Value),
                        new SqlParameter("@pSubject", staff.Subject ?? (object)DBNull.Value),
                        new SqlParameter("@pStandardId", staff.StandardId ?? (object)DBNull.Value),
                        new SqlParameter("@pSectionId", staff.SectionId ?? (object)DBNull.Value),
                        new SqlParameter("@pIsClassTeacher", staff.IsClassTeacher),
                        new SqlParameter("@pGender", staff.Gender ?? (object)DBNull.Value),
                        new SqlParameter("@pDateOfBirth", staff.DateOfBirth ?? (object)DBNull.Value),
                        new SqlParameter("@pBloodGroupId", staff.BloodGroupId ?? (object)DBNull.Value),
                        new SqlParameter("@pRetirementDate", staff.RetirementDate ?? (object)DBNull.Value),
                        new SqlParameter("@pReligionId", staff.ReligionId ?? (object)DBNull.Value),
                        new SqlParameter("@pCasteId", staff.CasteId ?? (object)DBNull.Value),
                        new SqlParameter("@pSubCasteId", staff.SubCasteId ?? (object)DBNull.Value),
                        new SqlParameter("@pCategoryId", staff.CategoryId ?? (object)DBNull.Value),
                        new SqlParameter("@pDateOfJoining", staff.DateOfJoining ?? (object)DBNull.Value),
                        new SqlParameter("@pAddress", staff.Address ?? (object)DBNull.Value),
                        new SqlParameter("@pCityId", staff.CityId ?? (object)DBNull.Value),
                        new SqlParameter("@pStateId", staff.StateId ?? (object)DBNull.Value),
                        new SqlParameter("@pBioId", staff.BioId ?? (object)DBNull.Value),
                        new SqlParameter("@pRfid", staff.Rfid ?? (object)DBNull.Value),
                        new SqlParameter("@pShiftId", staff.ShiftId ?? (object)DBNull.Value),
                        new SqlParameter("@pModifiedBy", staff.ModifiedBy ?? (object)DBNull.Value)
                    );

                    // Also update the linked user account details if they were modified
                    if (staff.User != null && staff.UserId > 0)
                    {
                        var user = await _context.Users.FindAsync(staff.UserId);
                        if (user != null)
                        {
                            user.Name = staff.User.Name;
                            user.Email = staff.User.Email;
                            user.RoleId = staff.User.RoleId > 0 ? staff.User.RoleId : user.RoleId;
                            user.ModifiedOn = DateTime.Now;
                            await _context.SaveChangesAsync();
                        }
                    }

                    await transaction.CommitAsync();
                    return rowsAffected >= 0 || rowsAffected == -1;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    FileLogger.LogError(new Exception($"Failed to complete UpdateStaffAsync transaction for StaffId: {staff.Id}. Rolled back.", ex));
                    throw;
                }
            });
        }

        public async Task<bool> DeleteStaffAsync(int id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"EXEC dbo.sp_ManageStaff 'DELETE', {id}"
                );
                return rowsAffected >= 0 || rowsAffected == -1;
            });
        }

        public async Task<bool> SavePhotoPathAsync(int id, string path)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE [dbo].[Staff] SET [ProfilePhotoPath] = {path}, [ModifiedOn] = GETUTCDATE() WHERE [Id] = {id}"
                );
                return rowsAffected > 0;
            });
        }
    }

    /// <summary>
    /// Helper extension to safely read headers.
    /// </summary>
    public static class ReaderExtensions
    {
        public static bool HasColumn(this System.Data.Common.DbDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (reader.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }
    }
}
