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
        /// Retrieves attendance records for a specific date, optional school, and optional academic year.
        /// </summary>
        /// <param name="date">The date of attendance.</param>
        /// <param name="schoolId">Optional school filter.</param>
        /// <param name="academicYearId">Optional academic year filter.</param>
        /// <returns>A list of attendance records.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendance(DateTime date, int? schoolId, int? academicYearId)
        {
            var records = await _attendanceService.GetAttendanceAsync(date, schoolId, academicYearId);
            return Ok(records);
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
    }
}
