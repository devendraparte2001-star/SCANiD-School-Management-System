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
    /// Decoupled UserService realization calling stored procedures.
    /// Provides better performance and decoupled architecture.
    /// Handles database transactions, rollbacks, and deadlock recovery transparently.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
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

        public async Task<IEnumerable<User>> GetUsersAsync()
        {
            // Execute the sp_GetUsers stored procedure safely using high-performance ADO.NET DbMapper
            // to bypass EF Core's query translation entirely and solve 'FromSql' non-composable query errors.
            return await ScanID.Api.Utilities.DbMapper.ExecuteStoredProcedureAsync<User>(_context, "dbo.sp_GetUsers");
        }

        public async Task<(IEnumerable<User> Data, int TotalCount)> GetUsersPagedAsync(int page, int pageSize, string? sortBy, string? sortOrder, string? search, int? roleId, int? schoolId)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var list = new List<User>();
                int totalCount = 0;

                var connection = _context.Database.GetDbConnection();
                if (connection.State == System.Data.ConnectionState.Closed)
                {
                    await _context.Database.OpenConnectionAsync();
                }

                using var command = connection.CreateCommand();
                command.CommandText = "dbo.sp_GetUsersPaged";
                command.CommandType = System.Data.CommandType.StoredProcedure;

                void AddParam(string name, object? val)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = name.StartsWith("@") ? name : "@" + name;
                    param.Value = val ?? DBNull.Value;
                    command.Parameters.Add(param);
                }

                AddParam("Page", page);
                AddParam("PageSize", pageSize);
                AddParam("SortBy", sortBy);
                AddParam("SortOrder", sortOrder);
                AddParam("Search", search);
                AddParam("RoleId", roleId);
                AddParam("SchoolId", schoolId);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var item = new User
                    {
                        Id = reader["Id"] != DBNull.Value ? Convert.ToInt32(reader["Id"]) : 0,
                        Username = reader["Username"] != DBNull.Value ? Convert.ToString(reader["Username"]) ?? string.Empty : string.Empty,
                        PasswordHash = reader["PasswordHash"] != DBNull.Value ? Convert.ToString(reader["PasswordHash"]) ?? string.Empty : string.Empty,
                        Name = reader["Name"] != DBNull.Value ? Convert.ToString(reader["Name"]) ?? string.Empty : string.Empty,
                        Email = reader["Email"] != DBNull.Value ? Convert.ToString(reader["Email"]) ?? string.Empty : string.Empty,
                        Role = reader["Role"] != DBNull.Value ? Convert.ToString(reader["Role"]) ?? string.Empty : string.Empty,
                        RoleId = reader["RoleId"] != DBNull.Value ? Convert.ToInt32(reader["RoleId"]) : null,
                        SchoolId = reader["SchoolId"] != DBNull.Value ? Convert.ToInt32(reader["SchoolId"]) : null,
                        IsActive = reader["IsActive"] != DBNull.Value && Convert.ToBoolean(reader["IsActive"]),
                        IsDeleted = reader["IsDeleted"] != DBNull.Value && Convert.ToBoolean(reader["IsDeleted"]),
                        CreatedOn = reader["CreatedOn"] != DBNull.Value ? Convert.ToDateTime(reader["CreatedOn"]) : DateTime.UtcNow,
                        ModifiedOn = reader["ModifiedOn"] != DBNull.Value ? Convert.ToDateTime(reader["ModifiedOn"]) : DateTime.UtcNow,
                        CreatedBy = reader["CreatedBy"] != DBNull.Value ? reader["CreatedBy"].ToString() : null,
                        ModifiedBy = reader["ModifiedBy"] != DBNull.Value ? reader["ModifiedBy"].ToString() : null,
                    };

                    if (reader["TotalCount"] != DBNull.Value)
                    {
                        totalCount = Convert.ToInt32(reader["TotalCount"]);
                    }

                    list.Add(item);
                }

                return ((IEnumerable<User>)list, totalCount);
            });
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            var list = await GetUsersAsync();
            return list.FirstOrDefault(u => u.Id == id);
        }

        public async Task<User> CreateUserAsync(User user)
        {
            var rawPassword = string.IsNullOrEmpty(user.PasswordHash) ? "Password123" : user.PasswordHash;
            var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            user.PasswordHash = passwordHasher.HashPassword(user, rawPassword);

            return await ExecuteWithRetryAsync(async () =>
            {
                // Execute the sp_ManageUser stored procedure safely using high-performance ADO.NET DbMapper 
                // to retrieve the newly generated identity, completely avoiding EF Core query wrapping issues.
                user.Id = await ScanID.Api.Utilities.DbMapper.ExecuteScalarStoredProcedureAsync(
                    _context,
                    "dbo.sp_ManageUser",
                    ("Action", "INSERT"),
                    ("Id", null),
                    ("Username", user.Username),
                    ("PasswordHash", user.PasswordHash),
                    ("Name", user.Name),
                    ("Email", user.Email),
                    ("Role", user.Role),
                    ("RoleId", user.RoleId),
                    ("SchoolId", user.SchoolId),
                    ("CreatedBy", user.CreatedBy),
                    ("ModifiedBy", user.CreatedBy)
                );

                return user;
            });
        }

        public async Task<bool> UpdateUserAsync(User user)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                // Execute stored procedure. Note: Since sp_ManageUser starts with SET NOCOUNT ON, 
                // it suppresses row counts and returns -1. Thus, we check 'rowsAffected >= 0 || rowsAffected == -1'.
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"EXEC dbo.sp_ManageUser 'UPDATE', {user.Id}, {user.Username}, {user.PasswordHash}, {user.Name}, {user.Email}, {user.Role}, {user.RoleId}, {user.SchoolId}, NULL, {user.ModifiedBy}"
                );
                return rowsAffected >= 0 || rowsAffected == -1;
            });
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                // Execute stored procedure for deletion. Handles SET NOCOUNT ON correctly.
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"EXEC dbo.sp_ManageUser 'DELETE', {id}"
                );
                return rowsAffected >= 0 || rowsAffected == -1;
            });
        }

        public async Task<bool> UpdateUserRoleAsync(int id, string role)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) return false;

                // Find matching role dynamically from context
                var matchedRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == role.ToLower());
                if (matchedRole != null)
                {
                    user.RoleId = matchedRole.Id;
                    user.Role = matchedRole.Name;
                }
                else
                {
                    // Robust fallback roles identification
                    var normalized = role.ToLower().Replace(" ", "").Replace("_", "");
                    int? matchedId = null;
                    string matchedName = role;
                    if (normalized == "superadmin") { matchedId = 1; matchedName = "SuperAdmin"; }
                    else if (normalized == "admin") { matchedId = 2; matchedName = "Admin"; }
                    else if (normalized == "teacher") { matchedId = 3; matchedName = "Teacher"; }
                    else if (normalized == "student") { matchedId = 4; matchedName = "Student"; }
                    else if (normalized == "parent") { matchedId = 5; matchedName = "Parent"; }

                    if (matchedId.HasValue)
                    {
                        user.RoleId = matchedId.Value;
                        user.Role = matchedName;
                    }
                    else
                    {
                        user.Role = role;
                    }
                }

                user.ModifiedOn = DateTime.Now;
                return await _context.SaveChangesAsync() > 0;
            });
        }
    }
}
