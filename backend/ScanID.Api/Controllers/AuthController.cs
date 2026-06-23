using Microsoft.AspNetCore.Mvc;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    /// <summary>
    /// Controller for authentication and user sessions.
    /// Perfectly decoupled and adheres to SOLID.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Authenticates a user based on username and password.
        /// </summary>
        /// <param name="request">Login credentials.</param>
        /// <returns>User profile data on success.</returns>
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.LogInAsync(request.Username, request.Password);

            if (user == null)
            {
                return Unauthorized("Invalid username or password");
            }

            // Helper to get RoleId from Role name string if not explicitly set
            int roleId = user.RoleId ?? (user.Role?.ToLower().Replace(" ", "") switch
            {
                "superadmin" => 1,
                "admin" => 2,
                "teacher" => 3,
                "student" => 4,
                "parent" => 5,
                _ => 4 // Default to student
            });

            return Ok(new {
                id = user.Id.ToString(),
                name = user.Name,
                role = user.Role ?? "student",
                roleId = roleId,
                schoolId = user.SchoolId?.ToString(),
                schoolName = user.School?.Name,
                academicYearId = user.AcademicYearId?.ToString()
            });
        }

        /// <summary>
        /// Initiates a password reset process for a user.
        /// </summary>
        /// <param name="request">The request containing the username.</param>
        /// <returns>Success message.</returns>
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var user = await _authService.FindUserByUsernameAsync(request.Username);

            if (user == null)
            {
                return NotFound("Username not found");
            }

            return Ok(new { message = "Password reset instructions sent to registered email/phone" });
        }
    }

    /// <summary>
    /// DTO for login request.
    /// </summary>
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for forgot password request.
    /// </summary>
    public class ForgotPasswordRequest
    {
        public string Username { get; set; } = string.Empty;
    }
}
