using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using ScanID.Api.Models;

namespace ScanID.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications(
            [FromQuery] int? userId = null,
            [FromQuery] int? roleId = null,
            [FromQuery] int? schoolId = null)
        {
            var query = _context.Notifications
                .Where(n => !n.IsDeleted);

            if (userId.HasValue)
            {
                query = query.Where(n => n.UserId == userId.Value || n.UserId == null);
            }

            if (roleId.HasValue)
            {
                query = query.Where(n => n.RoleId == roleId.Value || n.RoleId == null);
            }

            if (schoolId.HasValue)
            {
                query = query.Where(n => n.SchoolId == schoolId.Value || n.SchoolId == null);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // PUT: api/Notifications/read-all
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead(
            [FromQuery] int? userId = null,
            [FromQuery] int? roleId = null,
            [FromQuery] int? schoolId = null)
        {
            var query = _context.Notifications
                .Where(n => !n.IsDeleted && !n.IsRead);

            if (userId.HasValue)
            {
                query = query.Where(n => n.UserId == userId.Value || n.UserId == null);
            }

            if (roleId.HasValue)
            {
                query = query.Where(n => n.RoleId == roleId.Value || n.RoleId == null);
            }

            if (schoolId.HasValue)
            {
                query = query.Where(n => n.SchoolId == schoolId.Value || n.SchoolId == null);
            }

            var unread = await query.ToListAsync();
            foreach (var n in unread)
            {
                n.IsRead = true;
                _context.Entry(n).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/Notifications/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Notification>> GetNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);

            if (notification == null)
            {
                return NotFound();
            }

            return notification;
        }

        // PUT: api/Notifications/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            notification.IsRead = true;
            _context.Entry(notification).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!NotificationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Notifications
        [HttpPost]
        public async Task<ActionResult<Notification>> PostNotification(Notification notification)
        {
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetNotification", new { id = notification.Id }, notification);
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            notification.IsDeleted = true;
            _context.Entry(notification).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool NotificationExists(int id)
        {
            return _context.Notifications.Any(e => e.Id == id);
        }
    }
}
