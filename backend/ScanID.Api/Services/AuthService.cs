using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System.Linq;
using System.Threading.Tasks;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Decoupled AuthService realization calling high-performance stored procedures / joins.
    /// Provides outstanding performance and keeps domain schemas isolated.
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IErrorLogService _errorLogService;

        public AuthService(ApplicationDbContext context, IErrorLogService errorLogService)
        {
            _context = context;
            _errorLogService = errorLogService;
        }

        public async Task<User?> LogInAsync(string username, string password)
        {
            // Fetch user by username including school join relation
            var user = await _context.Users
                .Include(u => u.School)
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                await _errorLogService.InsertErrorLogAsync(
                    $"Login failed: Username '{username}' not found in database.",
                    "Warning",
                    "UserNotFoundException",
                    $"AuthService.LogInAsync({username})"
                );
                return null;
            }

            // Verify the password using both plain-text and ASP.NET Core Identity PasswordHasher
            bool isPasswordValid = false;

            // 1. Try plain-text match first (for backwards compatibility/mock inputs)
            if (user.PasswordHash == password)
            {
                isPasswordValid = true;
            }

            // 2. Try ASP.NET Core Identity PasswordHasher verification if not already matched
            if (!isPasswordValid && !string.IsNullOrEmpty(user.PasswordHash) && user.PasswordHash.Length >= 44 && IsBase64Encoded(user.PasswordHash))
            {
                try
                {
                    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
                    var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
                    if (result != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed)
                    {
                        isPasswordValid = true;
                    }
                    else
                    {
                        await _errorLogService.InsertErrorLogAsync(
                            $"Password verification failed for user '{username}'. Invalid credentials.",
                            "Warning",
                            "InvalidCredentialsException",
                            $"AuthService.VerifyHashedPassword({username})"
                        );
                    }
                }
                catch (System.Exception ex)
                {
                    await _errorLogService.InsertErrorLogAsync(
                        $"Cryptographic password hash verification failed for user '{username}': {ex.Message}",
                        "Error",
                        ex.ToString(),
                        $"AuthService.LogInAsync; Hash: {user.PasswordHash}"
                    );
                }
            }
            else if (!isPasswordValid)
            {
                await _errorLogService.InsertErrorLogAsync(
                    $"Login failed for user '{username}': Password mismatch or malformed hash.",
                    "Warning",
                    "PasswordMismatch",
                    $"AuthService.LogInAsync({username})"
                );
            }

            return isPasswordValid ? user : null;
        }

        private static bool IsBase64Encoded(string s)
        {
            if (string.IsNullOrWhiteSpace(s))
                return false;

            // Check if length is multiple of 4
            if (s.Length % 4 != 0)
                return false;

            // Check for valid base-64 characters
            foreach (char c in s)
            {
                if (!(char.IsLetterOrDigit(c) || c == '+' || c == '/' || c == '='))
                    return false;
            }

            try
            {
                System.Convert.FromBase64String(s);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<User?> FindUserByUsernameAsync(string username)
        {
            // Optimized query using pre-cached database mapping to bypass unneeded metadata retrieval loops
            var users = await DbMapper.ExecuteStoredProcedureAsync<User>(_context, "dbo.sp_GetUsers");
            return users.FirstOrDefault(u => u.Username == username);
        }
    }
}
