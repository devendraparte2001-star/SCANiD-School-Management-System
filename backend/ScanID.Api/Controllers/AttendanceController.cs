using Microsoft.AspNetCore.Mvc;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Data;
using System;
using System.Linq;
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
        private readonly ApplicationDbContext _context;

        public AttendanceController(IAttendanceService attendanceService, ApplicationDbContext context)
        {
            _attendanceService = attendanceService;
            _context = context;
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
        /// Retrieves iodata parsed logs with optional server-side pagination.
        /// </summary>
        [HttpGet("iodata")]
        public async Task<IActionResult> GetIodataRecords(
            [FromQuery] DateTime? date,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool paged = false)
        {
            if (paged)
            {
                var (dataList, totalCount) = await _attendanceService.GetIodataRecordsPagedAsync(date, page, pageSize);
                var totalPages = (int)Math.Max(1, Math.Ceiling((double)totalCount / pageSize));
                var currentPage = Math.Max(1, page);

                return Ok(new
                {
                    data = dataList,
                    pagination = new
                    {
                        totalCount,
                        totalPages,
                        page = currentPage,
                        pageSize
                    }
                });
            }
            else
            {
                var records = await _attendanceService.GetIodataRecordsAsync(date);
                return Ok(records);
            }
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

        /// <summary>
        /// Request body schema for direct immediate batch lines processing.
        /// </summary>
        public class ProcessImmediateLinesRequest
        {
            public DateTime Date { get; set; }
            public List<string> Lines { get; set; } = new();
            public bool WipeTargetDate { get; set; } = false;
        }

        /// <summary>
        /// Immediately processes multiple raw punch scanner lines for a selected date within a secure atomic transaction.
        /// Useful for client-side user local system scanner parsing.
        /// </summary>
        [HttpPost("iodata/process-immediate-lines")]
        public async Task<IActionResult> ProcessImmediateLines([FromBody] ProcessImmediateLinesRequest request)
        {
            if (request == null) return BadRequest("Missing request model.");
            
            // Allow empty lines array when only wiping
            var linesToProcess = request.Lines ?? new List<string>();
            
            var logs = await _attendanceService.ProcessIodataLinesImmediateAsync(request.Date, linesToProcess, request.WipeTargetDate);
            return Ok(new { logs });
        }

        /// <summary>
        /// Reads a file from the server's watch folder and returns its raw lines.
        /// Helps the client process files progressively chunk by chunk rather than in single block HTTP executions.
        /// </summary>
        [HttpGet("iodata/read-server-file")]
        public async Task<IActionResult> ReadServerFile([FromQuery] DateTime date)
        {
            var watchDir = @"C:\iodata";
            string filePrefix = $"Data{date:ddMMyy}";
            string fileNamePattern = $"{filePrefix}.txt";
            string filePath = Path.Combine(watchDir, fileNamePattern);
            string archivePath = Path.Combine(watchDir, "processed", fileNamePattern);

            string? targetPath = null;
            if (System.IO.File.Exists(filePath))
            {
                targetPath = filePath;
            }
            else if (System.IO.File.Exists(archivePath))
            {
                targetPath = archivePath;
            }

            if (targetPath == null)
            {
                return NotFound($"No local file {fileNamePattern} exists in C:\\iodata directory.");
            }

            try
            {
                var lines = await System.IO.File.ReadAllLinesAsync(targetPath);
                return Ok(new { FileName = fileNamePattern, Lines = lines });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error reading database folder scans: {ex.Message}");
            }
        }

        // --- Enterprise: Monthly Payroll Locks ---
        [HttpGet("locked-status")]
        public async Task<IActionResult> GetLockStatus([FromQuery] DateTime date)
        {
            var isLocked = await _attendanceService.IsAttendanceMonthLockedAsync(date);
            return Ok(new { isLocked, year = date.Year, month = date.Month });
        }

        [HttpPost("lock")]
        public async Task<IActionResult> LockMonth([FromQuery] int year, [FromQuery] int month, [FromQuery] string lockedBy = "Admin")
        {
            var success = await _attendanceService.LockAttendanceMonthAsync(year, month, lockedBy);
            if (!success) return BadRequest("Failed to lock/unlock month.");
            return Ok(new { Message = $"Attendance for {year}-{month:D2} locked successfully post-payroll computation." });
        }

        // --- Enterprise: Leave applications integration ---
        [HttpGet("leaves")]
        public async Task<IActionResult> GetLeaves([FromQuery] int? studentId, [FromQuery] int? staffId, [FromQuery] int? schoolId)
        {
            var leaves = await _attendanceService.GetLeavesAsync(studentId, staffId, schoolId);
            return Ok(leaves);
        }

        [HttpPost("leaves")]
        public async Task<IActionResult> PostLeave([FromBody] LeaveApplication leave)
        {
            if (leave == null) return BadRequest("Invalid leave payload.");
            var success = await _attendanceService.SubmitLeaveAsync(leave);
            if (!success) return StatusCode(500, "Failed to submit leave application.");
            return Ok(leave);
        }

        // --- Enterprise: Audit Trail logs ---
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _attendanceService.GetAuditLogsAsync();
            return Ok(logs);
        }

        // --- Enterprise: Bulk calculation and reprocessing range ---
        public class ReprocessRangeRequest
        {
            public DateTime FromDate { get; set; }
            public DateTime ToDate { get; set; }
            public int? StudentId { get; set; }
            public int? StaffId { get; set; }
            public int? SchoolId { get; set; }
        }

        [HttpPost("reprocess-range")]
        public async Task<IActionResult> ReprocessRange([FromBody] ReprocessRangeRequest req)
        {
            if (req == null) return BadRequest("Missing request model.");
            if (req.FromDate > req.ToDate) return BadRequest("FromDate cannot be later than ToDate.");

            var success = await _attendanceService.ReprocessAttendanceRangeAsync(req.FromDate, req.ToDate, req.StudentId, req.StaffId, req.SchoolId);
            if (!success) return StatusCode(500, "Reprocessing failed.");
            return Ok(new { Message = "Calculation completed and attendance tables repopulated." });
        }

        public class ManualCorrectionRequest
        {
            public int AttendanceId { get; set; }
            public string NewStatus { get; set; } = string.Empty;
            public string Remarks { get; set; } = string.Empty;
            public int ChangedByUserId { get; set; } = 1;
        }

        /// <summary>
        /// Manual Attendance Correction: Saves and audits manually marked statuses.
        /// </summary>
        [HttpPost("manual-correction")]
        public async Task<IActionResult> ManualCorrection([FromBody] ManualCorrectionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.NewStatus)) return BadRequest("Invalid request.");

            var attendance = await _context.Attendance.FindAsync(request.AttendanceId);
            if (attendance == null) return NotFound("Attendance record not found.");

            // Check if month is locked
            if (await _attendanceService.IsAttendanceMonthLockedAsync(attendance.Date))
            {
                return BadRequest("This month's attendance is locked post-payroll and cannot be modified.");
            }

            var oldStatus = attendance.Status;
            attendance.Status = request.NewStatus;
            attendance.Remarks = request.Remarks;
            attendance.ModifiedOn = DateTime.UtcNow;

            // Log detailed auditable trace to AttendanceAuditLogs table
            var auditLog = new AttendanceAuditLog
            {
                AttendanceId = attendance.Id,
                OldStatus = oldStatus ?? "None",
                NewStatus = request.NewStatus,
                Remarks = request.Remarks,
                ChangedBy = request.ChangedByUserId,
                ChangedOn = DateTime.UtcNow
            };

            _context.AttendanceAuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Attendance corrected and audit log recorded.", Record = attendance });
        }
    }
}
