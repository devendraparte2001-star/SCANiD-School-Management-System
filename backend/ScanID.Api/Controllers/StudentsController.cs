using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    /// <summary>
    /// Controller for managing student records.
    /// This implementation adheres to SOLID Principles and is fully decoupled utilizing DI.
    /// - High-level module (StudentsController) does not depend on low-level database schemas, but on the abstraction (IStudentService).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;
        private readonly IWebHostEnvironment _environment;

        public StudentsController(IStudentService studentService, IWebHostEnvironment environment)
        {
            _studentService = studentService;
            _environment = environment;
        }

        /// <summary>
        /// Projects student entities to DTOs so API responses do not serialize full EF navigation graphs.
        /// </summary>
        private static StudentDto ToDto(Student student) => new()
        {
            Id = student.Id,
            Name = student.Name,
            SchoolId = student.SchoolId ?? 0,
            Status = student.Status,
            RollNumber = student.RollNumber,
            FirstName = student.FirstName,
            MiddleName = student.MiddleName,
            LastName = student.LastName,
            GrNo = student.GrNo,
            Gender = student.Gender,
            DateOfBirth = student.DateOfBirth,
            Address = student.Address,
            MotherName = student.MotherName,
            FatherContactNo = student.FatherContactNo,
            MotherContactNo = student.MotherContactNo,
            AadharCard = student.AadharCard,
            ProfilePhotoPath = student.ProfilePhotoPath,
            StandardId = student.StandardId,
            SectionId = student.SectionId,
            AcademicYearId = student.AcademicYearId,
            CategoryId = student.CategoryId,
            CasteId = student.CasteId,
            SubCasteId = student.SubCasteId,
            ReligionId = student.ReligionId,
            BloodGroupId = student.BloodGroupId,
            HouseId = student.HouseId,
            AdmissionTypeId = student.AdmissionTypeId,
            CityId = student.CityId,
            StateId = student.StateId,
            ShiftId = student.ShiftId,
            SchoolSectionId = student.SchoolSectionId,
            Email = student.Email,
            AdmissionDate = student.AdmissionDate,
            UniformId = student.UniformId,
            Rfid = student.Rfid,
            Sms = student.Sms,
            IsStateBoard = student.IsStateBoard,
            DigitalUniform = student.DigitalUniform,
            DigitalNotebook = student.DigitalNotebook,
            OptedForBus = student.OptedForBus,
            Standard = student.Standard?.Name,
            Section = student.Section?.Name,
            AcademicYear = student.AcademicYear?.Name,
            ShiftName = student.Shift?.Name,
            CreatedBy = student.CreatedBy,
            CreatedOn = student.CreatedOn,
            ModifiedBy = student.ModifiedBy,
            ModifiedOn = student.ModifiedOn
        };

        /// <summary>
        /// Maps allowed write fields from the request DTO into the domain entity consumed by existing services.
        /// </summary>
        private static Student ToEntity(StudentWriteDto dto, int id = 0) => new()
        {
            Id = id,
            Name = dto.Name,
            SchoolId = dto.SchoolId,
            Status = dto.Status,
            RollNumber = dto.RollNumber,
            FirstName = dto.FirstName,
            MiddleName = dto.MiddleName,
            LastName = dto.LastName,
            GrNo = dto.GrNo,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            Address = dto.Address,
            MotherName = dto.MotherName,
            FatherContactNo = dto.FatherContactNo,
            MotherContactNo = dto.MotherContactNo,
            AadharCard = dto.AadharCard,
            ProfilePhotoPath = dto.ProfilePhotoPath,
            StandardId = dto.StandardId,
            SectionId = dto.SectionId,
            AcademicYearId = dto.AcademicYearId,
            CategoryId = dto.CategoryId,
            CasteId = dto.CasteId,
            SubCasteId = dto.SubCasteId,
            ReligionId = dto.ReligionId,
            BloodGroupId = dto.BloodGroupId,
            HouseId = dto.HouseId,
            AdmissionTypeId = dto.AdmissionTypeId,
            CityId = dto.CityId,
            StateId = dto.StateId,
            ShiftId = dto.ShiftId,
            SchoolSectionId = dto.SchoolSectionId,
            Email = dto.Email,
            AdmissionDate = dto.AdmissionDate,
            UniformId = dto.UniformId,
            Rfid = dto.Rfid,
            Sms = dto.Sms,
            IsStateBoard = dto.IsStateBoard,
            DigitalUniform = dto.DigitalUniform,
            DigitalNotebook = dto.DigitalNotebook,
            OptedForBus = dto.OptedForBus,
            CreatedBy = dto.CreatedBy,
            ModifiedBy = dto.ModifiedBy
        };

        /// <summary>
        /// Retrieves students for a specific school and optionally an academic year. Supports pagination, sorting, searching, and custom filters.
        /// </summary>
        /// <param name="schoolId">Optional school ID filter.</param>
        /// <param name="academicYearId">Optional academic year ID filter.</param>
        /// <param name="page">The page number, 1-indexed.</param>
        /// <param name="pageSize">Number of items per page.</param>
        /// <param name="sortBy">Field to sort by (e.g., name, grno, roll, standard, section).</param>
        /// <param name="sortOrder">Sort order direction: 'asc' or 'desc'.</param>
        /// <param name="search">Search query to match name, grno, standard, section, or roll number.</param>
        /// <param name="standardId">Specific standard/grade ID to filter by.</param>
        /// <param name="sectionId">Specific section/division ID to filter by.</param>
        /// <returns>A paginated envelope containing student records matching the filters.</returns>
        [HttpGet]
        public async Task<ActionResult> GetStudents(
            [FromQuery] int? schoolId, 
            [FromQuery] int? academicYearId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null,
            [FromQuery] string sortOrder = "asc",
            [FromQuery] string? search = null,
            [FromQuery] int? standardId = null,
            [FromQuery] int? sectionId = null,
            [FromQuery] int? lastId = null)
        {
            // Execute server-side pagination, searching, sorting and joins directly in SQL Server (AsNoTracking)
            var (dataList, totalCount) = await _studentService.GetStudentsPagedAsync(
                schoolId,
                academicYearId,
                page,
                pageSize,
                sortBy,
                sortOrder,
                search,
                standardId,
                sectionId,
                lastId
            );
            
            var totalPages = (int)Math.Max(1, Math.Ceiling((double)totalCount / pageSize));
            var currentPage = Math.Max(1, page);

            // Return enveloped paginated model perfectly parsed by React UI
            return Ok(new
            {
                data = dataList.Select(ToDto),
                pagination = new
                {
                    totalCount,
                    totalPages,
                    page = currentPage,
                    pageSize,
                    lastId = dataList.LastOrDefault()?.Id
                }
            });
        }

        /// <summary>
        /// Retrieves a specific student by ID.
        /// </summary>
        /// <param name="id">The student ID.</param>
        /// <returns>The requested student record.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentDto>> GetStudent(int id)
        {
            var student = await _studentService.GetStudentByIdAsync(id);

            if (student == null)
            {
                return NotFound();
            }

            return Ok(ToDto(student));
        }

        /// <summary>
        /// Registers a new student.
        /// </summary>
        /// <param name="student">The student data.</param>
        /// <returns>The created student record.</returns>
        [HttpPost]
        public async Task<ActionResult<StudentDto>> PostStudent(StudentWriteDto request)
        {
            try
            {
                var student = ToEntity(request);
                var createdStudent = await _studentService.CreateStudentAsync(student);
                return CreatedAtAction("GetStudent", new { id = createdStudent.Id }, ToDto(createdStudent));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Exports student records to a CSV file.
        /// </summary>
        /// <param name="schoolId">Filter by school filter.</param>
        /// <returns>A downloadable CSV file.</returns>
        [HttpGet("export")]
        public async Task<IActionResult> ExportStudents(int? schoolId)
        {
            var students = await _studentService.GetStudentsForExportAsync(schoolId);

            var csv = new System.Text.StringBuilder();
            // Header matching database schema column layout, ending with IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
            csv.AppendLine("Id,Name,SchoolId,Status,RollNumber,FirstName,MiddleName,LastName,GrNo,Gender,DateOfBirth,Address,MotherName,FatherContactNo,MotherContactNo,AadharCard,UniformId,Rfid,SchoolSection,AdmissionDate,Email,Standard,Section,AcademicYear,Caste,SubCaste,Religion,BloodGroup,House,AdmissionType,City,State,Shift,Category,Sms,IsStateBoard,ProfilePhotoPath,DigitalUniform,DigitalNotebook,OptedForBus,IsActive,IsDeleted,CreatedBy,CreatedOn,ModifiedBy,ModifiedOn");

            foreach (var s in students)
            {
                var row = new List<string?>
                {
                    s.Id.ToString(),
                    s.Name,
                    s.SchoolId.ToString(),
                    s.Status,
                    s.RollNumber.ToString(),
                    s.FirstName,
                    s.MiddleName,
                    s.LastName,
                    s.GrNo,
                    s.Gender,
                    s.DateOfBirth?.ToString("yyyy-MM-dd"),
                    s.Address != null ? "\"" + s.Address.Replace("\"", "\"\"") + "\"" : null,
                    s.MotherName,
                    s.FatherContactNo,
                    s.MotherContactNo,
                    s.AadharCard,
                    s.UniformId,
                    s.Rfid,
                    s.SchoolSection?.Name,
                    s.AdmissionDate?.ToString("yyyy-MM-dd"),
                    s.Email,
                    s.Standard?.Name,
                    s.Section?.Name,
                    s.AcademicYear?.Name,
                    s.Caste?.Name,
                    s.SubCaste?.Name ?? "",
                    s.Religion?.Name,
                    s.BloodGroup?.Name,
                    s.House?.Name,
                    s.AdmissionType?.Name ?? "",
                    s.City?.Name ?? "",
                    s.State?.Name ?? "",
                    s.Shift?.Name,
                    s.Category?.Name,
                    s.Sms.ToString().ToLower(),
                    s.IsStateBoard.ToString().ToLower(),
                    s.ProfilePhotoPath,
                    s.DigitalUniform.ToString().ToLower(),
                    s.DigitalNotebook.ToString().ToLower(),
                    s.OptedForBus.ToString().ToLower(),
                    s.IsActive.ToString().ToLower(),
                    s.IsDeleted.ToString().ToLower(),
                    s.CreatedBy,
                    s.CreatedOn.ToString("yyyy-MM-dd HH:mm:ss"),
                    s.ModifiedBy,
                    s.ModifiedOn.ToString("yyyy-MM-dd HH:mm:ss")
                };
                csv.AppendLine(string.Join(",", row));
            }

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"Students_Export_{DateTime.Now:yyyyMMdd}.csv");
        }

        /// <summary>
        /// Generates a comprehensive sample CSV template for bulk student upload.
        /// </summary>
        [HttpGet("sample-template")]
        public IActionResult GetSampleTemplate()
        {
            var csv = new System.Text.StringBuilder();
            // Required Header reflecting all active table fields in exact sequence ending with auditing columns
            csv.AppendLine("Name,SchoolId,Status,RollNumber,FirstName,MiddleName,LastName,GrNo,Gender,DateOfBirth,Address,MotherName,FatherContactNo,MotherContactNo,AadharCard,UniformId,Rfid,SchoolSectionName,AdmissionDate,Email,GradeName,SectionName,AcademicYear,CasteName,SubCasteName,ReligionName,BloodGroupName,HouseName,AdmissionType,CityName,StateName,ShiftName,CategoryName,Sms,IsStateBoard,ProfilePhotoPath,DigitalUniform,DigitalNotebook,OptedForBus,IsActive,IsDeleted,CreatedBy,CreatedOn,ModifiedBy,ModifiedOn");
            // Example data row with Boolean sms/IsStateBoard mappings
            csv.AppendLine("John Doe,1,Active,10,John,M.,Doe,1234,Male,2015-05-15,City Main Road,Jane Doe,9876543210,9876543211,123456789012,UniformID,RF-123,Primary,,john.doe@example.com,1,A,2024-25,General,,Hindu,B+,Red,Regular,,,Morning,General,true,false,/photos/1/example.jpg,true,false,true,true,false,Admin,2026-05-24 00:00:00,Admin,2026-05-24 00:00:00");

            return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "Student_Upload_Template.csv");
        }

        /// <summary>
        /// Updates a student's personal and academic details.
        /// </summary>
        /// <param name="id">The ID of the student to update.</param>
        /// <param name="student">The updated student data.</param>
        /// <returns>No content on success.</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStudent(int id, StudentWriteDto request)
        {
            try
            {
                var student = ToEntity(request, id);
                var success = await _studentService.UpdateStudentAsync(student);
                if (!success)
                {
                    if (!await StudentExistsAsync(id)) return NotFound();
                    return StatusCode(500, "Failed to persist student record updates.");
                }
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await StudentExistsAsync(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Bulk registers multiple students.
        /// Encapsulates validations inside Domain logic.
        /// </summary>
        /// <param name="students">List of students.</param>
        /// <returns>Count of registered students.</returns>
        [HttpPost("bulk")]
        public async Task<ActionResult<object>> PostBulkStudents(IEnumerable<StudentWriteDto> requests)
        {
            if (requests == null || !requests.Any()) return BadRequest("No student data provided.");

            try
            {
                var students = requests.Select(request => ToEntity(request)).ToList();
                var response = await _studentService.CreateBulkStudentsAsync(students);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Removes a student record (soft delete handled by service).
        /// </summary>
        /// <param name="id">The student ID to delete.</param>
        /// <returns>No content on success.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var success = await _studentService.DeleteStudentAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }

        /// <summary>
        /// Updates a student's profile picture by saving it to the server filesystem.
        /// </summary>
        /// <param name="id">The student ID.</param>
        /// <param name="file">The uploaded image file.</param>
        /// <returns>JSON object containing the saved relative path.</returns>
        [HttpPost("{id}/photo")]
        public async Task<IActionResult> UploadPhoto(int id, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                var contentType = Request.ContentType ?? "null";
                var bodyLength = Request.ContentLength ?? 0;
                return BadRequest(new { 
                    message = "No image file provided for upload.",
                    details = $"Received Content-Type: {contentType}, Body Length: {bodyLength}. Ensure form key is 'file' and boundary is set.",
                    id = id
                });
            }

            var student = await _studentService.GetStudentWithPhotoDetailsAsync(id);

            if (student == null)
            {
                return NotFound(new { message = "Student record not found." });
            }

            try
            {
                if ((student.SchoolId ?? 0) <= 0)
                {
                    var fullStudent = await _studentService.GetStudentByIdAsync(id);
                    if (fullStudent != null && (fullStudent.SchoolId ?? 0) > 0)
                    {
                        student.SchoolId = fullStudent.SchoolId;
                    }
                }
                var schoolIdVal = (student.SchoolId ?? 0) > 0 ? student.SchoolId!.Value.ToString() : (student.School?.Id > 0 ? student.School.Id.ToString() : "1");
                var schoolID = SanitizeFolderName(schoolIdVal ?? "1");
                var relativeFolder = Path.Combine("photos", schoolID);

                string webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                if (!Directory.Exists(webRootPath))
                {
                    Directory.CreateDirectory(webRootPath);
                }

                var uploadsFolder = Path.Combine(webRootPath, relativeFolder);

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension)) extension = ".png";
                
                Random res = new Random();
                string random12Digit = "";
                for (int i = 0; i < 12; i++)
                {
                    random12Digit += res.Next(0, 10).ToString();
                }

                var fileName = $"{random12Digit}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var relativePath = $"photos/{schoolID}/{fileName}";

                if (!string.IsNullOrEmpty(student.ProfilePhotoPath))
                {
                    var oldFilePath = Path.Combine(webRootPath, student.ProfilePhotoPath.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try { System.IO.File.Delete(oldFilePath); } catch { /* ignore if fail */ }
                    }
                }

                student.ProfilePhotoPath = relativePath;
                student.ModifiedOn = DateTime.Now;

                var success = await _studentService.SavePhotoPathAsync(id, relativePath);
                if (!success) return StatusCode(500, "Failed to save student photo path to database.");

                return Ok(new
                {
                    message = "Identity image updated successfully",
                    path = student.ProfilePhotoPath
                });
            }
            catch (Exception ex)
            {
                FileLogger.LogError(ex);
                return StatusCode(500, new { message = "Physical storage failed: " + ex.Message });
            }
        }

        /// <summary>
        /// Sanitizes a string for use as a folder name by removing illegal characters.
        /// </summary>
        private string SanitizeFolderName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Unassigned";

            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string(name.Select(ch => invalidChars.Contains(ch) ? '_' : ch).ToArray());

            return sanitized.Replace(" ", "_").Trim('_');
        }

        private async Task<bool> StudentExistsAsync(int id)
        {
            var std = await _studentService.GetStudentByIdAsync(id);
            return std != null;
        }
    }
}
