using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ScanID.Api.Data;
using ScanID.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NavigationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "System_NavigationItems";

        public NavigationController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        private void ClearNavigationCache()
        {
            _cache.Remove(CacheKey);
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetNavigations([FromQuery] int? roleId)
        {
            try
            {
                if (!_cache.TryGetValue(CacheKey, out List<NavigationItem>? items))
                {
                    items = await _context.NavigationItems
                        .Include(n => n.NavigationRoles)
                        .Where(n => n.IsActive)
                        .AsNoTracking()
                        .ToListAsync();
                    _cache.Set(CacheKey, items, TimeSpan.FromMinutes(30));
                }

                // If the NavigationItems table is empty, return a default set
                if (items!.Count == 0)
                {
                    return Ok(new { data = GetDefaultNavigationItems() });
                }

                // Map to a format the frontend expects (using RoleId)
                var result = items.Select(i => {
                    var roleIdList = i.NavigationRoles?
                        .Select(nr => nr.RoleId)
                        .ToArray() ?? new int[0];
                        
                    return new {
                        i.Id,
                        i.Title,
                        i.Icon,
                        i.Path,
                        i.ParentId,
                        i.SortOrder,
                        roleIds = roleIdList.Length > 0 ? roleIdList : new int[] { 0 } // 0 for 'all'
                    };
                }).OrderBy(i => i.SortOrder).ToList();

                // Filter by roleId if provided
                if (roleId.HasValue && roleId.Value != 0)
                {
                    // SuperAdmin (1) gets everything
                    if (roleId.Value == 1)
                    {
                        return Ok(new { data = result });
                    }

                    // For other roles, filter based on roleIds array
                    var filtered = result.Where(i => 
                        i.roleIds.Contains(roleId.Value) || i.roleIds.Contains(0)
                    ).ToList();

                    // Ensure parent items are included if their children are visible
                    if (filtered.Count > 0)
                    {
                        var parentIds = filtered.Select(f => f.ParentId).Where(p => p != null).Distinct().ToList();
                        foreach (var pId in parentIds)
                        {
                            if (!filtered.Any(f => f.Id == pId))
                            {
                                var parentItem = result.FirstOrDefault(x => x.Id == pId);
                                if (parentItem != null) filtered.Add(parentItem);
                            }
                        }
                        filtered = filtered.OrderBy(f => f.SortOrder).ToList();
                    }

                    // If filtered results are empty, fallback to default mock items for that role
                    if (filtered.Count == 0)
                    {
                        var defaults = GetDefaultNavigationItems()
                            .Cast<dynamic>()
                            .Where(x => ((int[])x.roleIds).Contains(roleId.Value) || ((int[])x.roleIds).Contains(0))
                            .ToList();
                        
                        if (defaults.Count > 0)
                        {
                            return Ok(new { data = defaults });
                        }
                    }

                    return Ok(new { data = filtered });
                }

                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                return Ok(new { data = GetDefaultNavigationItems(), error = ex.Message });
            }
        }

        private List<object> GetDefaultNavigationItems()
        {
            // Role IDs: SuperAdmin=1, Admin=2, Teacher=3, Student=4, Parent=5
            var all = new[] { 1, 2, 3, 4, 5 };
            var staff = new[] { 1, 2, 3 };
            var adminOnly = new[] { 1, 2 };

            return new List<object>
            {
                new { id = 1, title = "Dashboard", icon = "LayoutDashboard", path = "/", parentId = (int?)null, sortOrder = 1, roleIds = all },
                
                // Academic Operations Group
                new { id = 2, title = "Academic Operations", icon = "BookOpen", path = (string?)null, parentId = (int?)null, sortOrder = 2, roleIds = all },
                new { id = 3, title = "Student Registry", icon = "GraduationCap", path = "/students", parentId = 2, sortOrder = 1, roleIds = new[] { 1, 2, 3, 5 } },
                new { id = 4, title = "Attendance Tracking", icon = "CalendarCheck", path = "/attendance", parentId = 2, sortOrder = 2, roleIds = all },
                new { id = 5, title = "Examination & Marks", icon = "BarChart3", path = "/marks", parentId = 2, sortOrder = 3, roleIds = all },
                
                // Staff & HR Group
                new { id = 6, title = "Staff & HR", icon = "Users", path = (string?)null, parentId = (int?)null, sortOrder = 3, roleIds = adminOnly },
                new { id = 7, title = "Staff Directory", icon = "UserCheck", path = "/staff", parentId = 6, sortOrder = 1, roleIds = adminOnly },
                
                // Administrative Group
                new { id = 8, title = "Administrative", icon = "ShieldCheck", path = (string?)null, parentId = (int?)null, sortOrder = 4, roleIds = all },
                new { id = 9, title = "Fee Management", icon = "CreditCard", path = "/fees", parentId = 8, sortOrder = 1, roleIds = new[] { 1, 2, 5 } },
                new { id = 10, title = "Communication Hub", icon = "MessageSquare", path = "/messages", parentId = 8, sortOrder = 2, roleIds = all },
                
                // Masters & Config Group
                new { id = 11, title = "Masters & Config", icon = "Database", path = "/configuration", parentId = (int?)null, sortOrder = 5, roleIds = adminOnly },
                new { id = 12, title = "Global Schools", icon = "School", path = "/configuration/schools", parentId = 11, sortOrder = 1, roleIds = adminOnly },
                
                // RBAC Sub-group
                new { id = 13, title = "Access Control (RBAC)", icon = "Key", path = (string?)null, parentId = 11, sortOrder = 2, roleIds = adminOnly },
                new { id = 14, title = "Role Master", icon = "Shield", path = "/configuration/role-master", parentId = 13, sortOrder = 1, roleIds = adminOnly },
                new { id = 15, title = "User Accounts", icon = "UserCheck", path = "/configuration/role-assignment", parentId = 13, sortOrder = 2, roleIds = adminOnly },
                
                // Menu Designer Sub-group
                new { id = 16, title = "Menu Designer", icon = "Layout", path = (string?)null, parentId = 11, sortOrder = 3, roleIds = adminOnly },
                new { id = 17, title = "Navigation Builder", icon = "LayoutGrid", path = "/configuration/navigation", parentId = 16, sortOrder = 1, roleIds = adminOnly },
                
                // Academic Masters Sub-group
                new { id = 18, title = "Academic Masters", icon = "BookOpen", path = (string?)null, parentId = 11, sortOrder = 4, roleIds = adminOnly },
                new { id = 19, title = "Standards & Grades", icon = "Layers", path = "/configuration/standards", parentId = 18, sortOrder = 1, roleIds = adminOnly },
                new { id = 20, title = "Divisions/Sections", icon = "Hash", path = "/configuration/sections", parentId = 18, sortOrder = 2, roleIds = adminOnly },
                new { id = 21, title = "Academic Years", icon = "Calendar", path = "/configuration/academic-years", parentId = 18, sortOrder = 3, roleIds = adminOnly },
                new { id = 22, title = "Subject Registry", icon = "BookOpen", path = "/configuration/subjects", parentId = 18, sortOrder = 4, roleIds = adminOnly },
                
                // System Audit
                new { id = 23, title = "System Audit", icon = "Terminal", path = "/system-logs", parentId = (int?)null, sortOrder = 6, roleIds = new[] { 1 } }
            };
        }

        [HttpPost]
        public async Task<ActionResult<NavigationItem>> CreateNavigation(NavigationItem item)
        {
            _context.NavigationItems.Add(item);
            await _context.SaveChangesAsync();
            ClearNavigationCache();
            return CreatedAtAction(nameof(GetNavigations), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNavigation(int id, NavigationItem item)
        {
            if (id != item.Id) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            ClearNavigationCache();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNavigation(int id)
        {
            var item = await _context.NavigationItems.FindAsync(id);
            if (item == null) return NotFound();
            _context.NavigationItems.Remove(item);
            await _context.SaveChangesAsync();
            ClearNavigationCache();
            return NoContent();
        }
    }
}
