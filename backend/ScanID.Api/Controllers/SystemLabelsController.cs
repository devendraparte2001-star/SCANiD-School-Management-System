using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using ScanID.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    /// <summary>
    /// Custom System Labeling White-labeling Configuration Controller.
    /// Manages custom naming and terminologies (e.g., standard, section, employeeId, student/learner etc.).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class SystemLabelsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SystemLabelsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all custom system labels. Auto-seeds defaults if the table is empty.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SystemLabel>>> GetLabels()
        {
            var labels = await _context.SystemLabels.ToListAsync();

            if (labels.Count == 0)
            {
                // Core taxonomy definitions list to provide industry-grade custom layouts
                var defaultLabels = new List<SystemLabel>
                {
                    new SystemLabel { Key = "student", DefaultValue = "Student", CustomizedValue = "Student", Category = "Student Records" },
                    new SystemLabel { Key = "students", DefaultValue = "Students", CustomizedValue = "Students", Category = "Student Records" },
                    new SystemLabel { Key = "staff", DefaultValue = "Staff/Faculty", CustomizedValue = "Staff/Faculty", Category = "Staff Records" },
                    new SystemLabel { Key = "staffs", DefaultValue = "Staff & Faculty", CustomizedValue = "Staff & Faculty", Category = "Staff Records" },
                    new SystemLabel { Key = "standard", DefaultValue = "Class/Standard", CustomizedValue = "Class/Standard", Category = "Academic Structure" },
                    new SystemLabel { Key = "section", DefaultValue = "Section/Division", CustomizedValue = "Section/Division", Category = "Academic Structure" },
                    new SystemLabel { Key = "grNo", DefaultValue = "GR No", CustomizedValue = "GR No", Category = "Identifiers" },
                    new SystemLabel { Key = "rollNo", DefaultValue = "Roll No", CustomizedValue = "Roll No", Category = "Identifiers" },
                    new SystemLabel { Key = "employeeId", DefaultValue = "Employee Code", CustomizedValue = "Employee Code", Category = "Identifiers" },
                    new SystemLabel { Key = "academicYear", DefaultValue = "Academic Year", CustomizedValue = "Academic Year", Category = "Academic Structure" }
                };

                _context.SystemLabels.AddRange(defaultLabels);
                await _context.SaveChangesAsync();
                labels = await _context.SystemLabels.ToListAsync();
            }

            return Ok(labels);
        }

        /// <summary>
        /// Bulk updates customizable labeling profiles.
        /// </summary>
        [HttpPost("bulk")]
        public async Task<IActionResult> UpdateBulkLabels([FromBody] List<SystemLabel> updatedLabels)
        {
            if (updatedLabels == null || !updatedLabels.Any())
            {
                return BadRequest("No label updates provided.");
            }

            foreach (var label in updatedLabels)
            {
                var existing = await _context.SystemLabels.FirstOrDefaultAsync(l => l.Key == label.Key);
                if (existing != null)
                {
                    existing.CustomizedValue = label.CustomizedValue;
                    existing.ModifiedOn = System.DateTime.Now;
                    _context.Entry(existing).State = EntityState.Modified;
                }
                else
                {
                    _context.SystemLabels.Add(label);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "All system taxonomy labels updated successfully across DB tables." });
        }

        /// <summary>
        /// Resets all system configurations back to default templates.
        /// </summary>
        [HttpPost("reset")]
        public async Task<IActionResult> ResetToDefaults()
        {
            var existingItems = await _context.SystemLabels.ToListAsync();
            _context.SystemLabels.RemoveRange(existingItems);
            await _context.SaveChangesAsync();

            return await GetLabels();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SystemLabel>> GetLabel(int id)
        {
            var item = await _context.SystemLabels.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        [HttpPost]
        public async Task<ActionResult<SystemLabel>> CreateLabel(SystemLabel item)
        {
            _context.SystemLabels.Add(item);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLabel), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLabel(int id, SystemLabel item)
        {
            if (id != item.Id) return BadRequest();
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.SystemLabels.AnyAsync(e => e.Id == id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLabel(int id)
        {
            var item = await _context.SystemLabels.FindAsync(id);
            if (item == null) return NotFound();
            _context.SystemLabels.Remove(item);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
