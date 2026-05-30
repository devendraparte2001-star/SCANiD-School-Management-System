using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;

namespace ScanID.Api.Controllers
{
    /// <summary>
    /// Controller for retrieving dashboard statistics and analytical data.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class StatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gathers high-level statistics for the dashboard.
        /// </summary>
        /// <param name="schoolId">Optional school ID to filter stats.</param>
        /// <param name="academicYearId">Optional academic year ID to filter stats.</param>
        /// <returns>A summary of students, teachers, and performance metrics.</returns>
        [HttpGet]
        public async Task<IActionResult> GetDashboardStats(int? schoolId, int? academicYearId)
        {
            var studentQuery = _context.Students.AsNoTracking().AsQueryable();
            var teacherQuery = _context.Staff.AsNoTracking().AsQueryable();
            var attendanceQuery = _context.Attendance.AsNoTracking().AsQueryable();

            if (schoolId.HasValue)
            {
                studentQuery = studentQuery.Where(s => s.SchoolId == schoolId.Value);
                teacherQuery = teacherQuery.Where(t => t.SchoolId == schoolId.Value);
                attendanceQuery = attendanceQuery.Where(a => a.Student!.SchoolId == schoolId.Value);
            }

            if (academicYearId.HasValue)
            {
                studentQuery = studentQuery.Where(s => s.AcademicYearId == academicYearId.Value);
                // Teachers might not be linked directly to academic year in this schema, but students are.
                attendanceQuery = attendanceQuery.Where(a => a.Student!.AcademicYearId == academicYearId.Value);
            }

            var totalStudents = await studentQuery.CountAsync();
            var totalTeachers = await teacherQuery.CountAsync();
            
            // Simplified stats for demo
            return Ok(new
            {
                totalStudents,
                totalTeachers,
                feeCollection = "₹45,200", // Example static for now or join with Fees
                attendanceRate = "92%",
                performanceTrend = "+2.4%"
            });
        }
    }

}
