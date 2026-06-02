using Microsoft.AspNetCore.Mvc;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    /// <summary>
    /// Controller for managing student attendance.
    /// Supports Dependency Injection and decoupled operations.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public AttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        /// <summary>
        /// Retrieves attendance records with full server-side pagination, sorting, and role filtering.
        /// Supports both flat legacy and paginated enveloped client handlers seamlessly.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetAttendance(
            [FromQuery] DateTime date, 
            [FromQuery] int? schoolId, 
            [FromQuery] int? academicYearId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 15,
            [FromQuery] string? search = null,
            [FromQuery] string? role = null)
        {
            var records = await _attendanceService.GetAttendanceAsync(date, schoolId, academicYearId);
            
            // Filter by attendee type (Student or Staff)
            var filtered = records;
            
            if (!string.IsNullOrEmpty(role))
            {
                if (role.Equals("student", StringComparison.OrdinalIgnoreCase))
                {
                    filtered = filtered.Where(x => x.StudentId != null);
                }
                else if (role.Equals("staff", StringComparison.OrdinalIgnoreCase) || role.Equals("teacher", StringComparison.OrdinalIgnoreCase))
                {
                    filtered = filtered.Where(x => x.StaffId != null);
                }
            }
            
            // Search criteria matching Status or UploadSource
            if (!string.IsNullOrEmpty(search))
            {
                filtered = filtered.Where(x => 
                    (x.Status != null && x.Status.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                    (x.UploadSource != null && x.UploadSource.Contains(search, StringComparison.OrdinalIgnoreCase))
                );
            }
            
            int totalCount = filtered.Count();
            var paginated = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
                
            int totalPages = (int)Math.Max(1, Math.Ceiling((double)totalCount / pageSize));
            
            return Ok(new {
                data = paginated,
                pagination = new {
                    totalCount,
                    totalPages,
                    page,
                    pageSize
                }
            });
        }

        /// <summary>
        /// Submits a single attendance record.
        /// </summary>
        /// <param name="attendance">The attendance data.</param>
        /// <returns>The created record.</returns>
        [HttpPost]
        public async Task<ActionResult<Attendance>> PostAttendance(Attendance attendance)
        {
            var success = await _attendanceService.SubmitAttendanceAsync(attendance);
            if (!success) return StatusCode(500, "Failed to submit attendance record.");
            return Ok(attendance);
        }

        /// <summary>
        /// Submits multiple attendance records in a single request.
        /// </summary>
        /// <param name="records">List of attendance records.</param>
        /// <returns>Success response.</returns>
        [HttpPost("bulk")]
        public async Task<IActionResult> PostBulkAttendance(List<Attendance> records)
        {
            var success = await _attendanceService.SubmitBulkAttendanceAsync(records);
            if (!success) return StatusCode(500, "Failed to submit bulk attendance records.");
            return Ok();
        }

        /// <summary>
        /// Retrieves iodata parsed logs.
        /// </summary>
        [HttpGet("iodata")]
        public async Task<ActionResult<IEnumerable<IodataRecord>>> GetIodataRecords(DateTime? date)
        {
            var records = await _attendanceService.GetIodataRecordsAsync(date);
            return Ok(records);
        }

        /// <summary>
        /// Enqueues multiple iodata raw string scans into the background queue.
        /// </summary>
        [HttpPost("iodata/enqueue")]
        public IActionResult EnqueueIodataLines(List<string> lines)
        {
            if (lines == null || lines.Count == 0) return BadRequest("No lines provided.");
            _attendanceService.EnqueueIodataLines(lines);
            return Ok(new { Message = $"{lines.Count} lines enqueued successfully for background processing." });
        }

        /// <summary>
        /// Reprocesses a single Iodata record manually using the exact same stored procedure.
        /// </summary>
        [HttpPost("iodata/reprocess/{id}")]
        public async Task<IActionResult> ReprocessIodata(int id)
        {
            var success = await _attendanceService.ReprocessIodataRecordAsync(id);
            if (!success) return StatusCode(500, "Reprocessing failed.");
            return Ok(new { Message = "Record processed/re-uploaded successfully." });
        }

        /// <summary>
        /// Processes a single raw scanner line string immediately.
        /// </summary>
        [HttpPost("iodata/process-single")]
        public async Task<ActionResult<IodataRecord>> ProcessSingleLine([FromBody] string line)
        {
            var record = await _attendanceService.ProcessSingleIodataLineAsync(line);
            if (record == null) return BadRequest("Failed to process line.");
            return Ok(record);
        }

        /// <summary>
        /// Triggers batch local folder processing for raw files by selected from-date and to-date period.
        /// </summary>
        [HttpPost("iodata/process-range")]
        public async Task<IActionResult> ProcessIodataDateRange([FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
        {
            if (fromDate > toDate)
            {
                return BadRequest("The 'From Date' can not be later than the 'To Date'. Please adjust parameters.");
            }
            if (fromDate > DateTime.UtcNow.AddDays(1))
            {
                return BadRequest("The date parameters cannot be in the future.");
            }
            if ((toDate - fromDate).TotalDays > 31)
            {
                return BadRequest("Folder Scan range cannot exceed 31 days to prevent server bottlenecks.");
            }
            var logs = await _attendanceService.ProcessIodataDateRangeAsync(fromDate, toDate);
            return Ok(new { logs });
        }
    }
}
