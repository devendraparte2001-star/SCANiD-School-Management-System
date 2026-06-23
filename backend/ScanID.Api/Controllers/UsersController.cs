using Microsoft.AspNetCore.Mvc;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Converts the domain entity to a client-safe DTO so password hashes and navigation internals never leave the API.
        /// </summary>
        private static UserDto ToDto(User user) => new()
        {
            Id = user.Id,
            Username = user.Username,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            RoleId = user.RoleId,
            SchoolId = user.SchoolId,
            AcademicYearId = user.AcademicYearId,
            IsActive = user.IsActive,
            CreatedOn = user.CreatedOn,
            ModifiedOn = user.ModifiedOn
        };

        /// <summary>
        /// Maps validated write DTO fields into the existing domain model used by the service layer.
        /// </summary>
        private static User ToEntity(UserCreateDto dto, int id = 0) => new()
        {
            Id = id,
            Username = dto.Username,
            PasswordHash = dto.PasswordHash ?? string.Empty,
            Name = dto.Name,
            Email = dto.Email,
            Role = dto.Role,
            RoleId = dto.RoleId,
            SchoolId = dto.SchoolId,
            AcademicYearId = dto.AcademicYearId,
            CreatedBy = dto.CreatedBy,
            ModifiedBy = dto is UserUpdateDto updateDto ? updateDto.ModifiedBy : dto.CreatedBy,
            IsActive = dto is UserUpdateDto update ? update.IsActive : true
        };

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = null,
            [FromQuery] string? search = null,
            [FromQuery] int? roleId = null,
            [FromQuery] int? schoolId = null)
        {
            var (paginatedUsers, totalCount) = await _userService.GetUsersPagedAsync(
                page,
                pageSize,
                sortBy,
                sortOrder,
                search,
                roleId,
                schoolId
            );

            var totalPages = (int)Math.Max(1, Math.Ceiling((double)totalCount / pageSize));
            var currentPage = Math.Max(1, page);

            return Ok(new
            {
                data = paginatedUsers.Select(ToDto),
                pagination = new
                {
                    totalCount,
                    totalPages,
                    page = currentPage,
                    pageSize
                }
            });
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return Ok(ToDto(user));
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, UserUpdateDto request)
        {
            var existingUser = await _userService.GetUserByIdAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }

            // Fallback to preserve password hash if none supplied in client request
            var user = ToEntity(request, id);
            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                user.PasswordHash = existingUser.PasswordHash;
            }
            else if (user.PasswordHash != existingUser.PasswordHash)
            {
                bool isAlreadyHashed = user.PasswordHash.StartsWith("AQAAAAEAACcQAAAA") && user.PasswordHash.Length >= 44;
                if (!isAlreadyHashed)
                {
                    var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
                    user.PasswordHash = passwordHasher.HashPassword(user, user.PasswordHash);
                }
            }

            var success = await _userService.UpdateUserAsync(user);
            if (!success)
            {
                return StatusCode(500, "Failed to persist user updates.");
            }

            return NoContent();
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser(UserCreateDto request)
        {
            var user = ToEntity(request);
            var createdUser = await _userService.CreateUserAsync(user);
            return CreatedAtAction("GetUser", new { id = createdUser.Id }, ToDto(createdUser));
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                return StatusCode(500, "Failed to delete user.");
            }

            return NoContent();
        }

        // PUT: api/Users/5/role
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] RoleUpdateRequest request)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            var success = await _userService.UpdateUserRoleAsync(id, request.Role);
            if (!success)
            {
                return StatusCode(500, "Failed to save user role updates.");
            }

            return NoContent();
        }
    }

    public class RoleUpdateRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}
