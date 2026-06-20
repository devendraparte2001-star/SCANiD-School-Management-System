using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
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
    /// Controller for managing school records.
    /// This implementation adheres to SOLID Principles and is fully decoupled utilizing DI.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class SchoolsController : ControllerBase
    {
        private readonly ISchoolService _schoolService;
        private readonly IWebHostEnvironment _environment;

        public SchoolsController(ISchoolService schoolService, IWebHostEnvironment environment)
        {
            _schoolService = schoolService;
            _environment = environment;
        }

        /// <summary>
        /// Maps the domain school entity to the stable API response contract used by the UI.
        /// </summary>
        private static SchoolDto ToDto(School school) => new()
        {
            Id = school.Id,
            Name = school.Name,
            Code = school.Code,
            Address = school.Address,
            Email = school.Email,
            Phone = school.Phone,
            TotalStudents = school.TotalStudents,
            Status = school.Status,
            ProfilePhotoPath = school.ProfilePhotoPath,
            ShortName = school.ShortName,
            CityId = school.CityId,
            StateId = school.StateId,
            Pincode = school.Pincode,
            SMSLimit = school.SMSLimit,
            TotalSMSSent = school.TotalSMSSent,
            SMSBalance = school.SMSBalance,
            EnableSMS = school.EnableSMS,
            EnablePresenteeSMS = school.EnablePresenteeSMS,
            AutomaticBirthdaySMS = school.AutomaticBirthdaySMS,
            EnableWhatsapp = school.EnableWhatsapp,
            WebsiteUrl = school.WebsiteUrl,
            SMSSenderID = school.SMSSenderID,
            BusNumbers = school.BusNumbers,
            SCANiDContact = school.SCANiDContact,
            SCANiDEmail = school.SCANiDEmail,
            InChargeContact = school.InChargeContact,
            CityName = school.CityName,
            StateName = school.StateName,
            IsActive = school.IsActive,
            IsDeleted = school.IsDeleted,
            CreatedBy = school.CreatedBy,
            CreatedOn = school.CreatedOn,
            ModifiedBy = school.ModifiedBy,
            ModifiedOn = school.ModifiedOn,
            DashboardTheme = school.DashboardTheme,
            CmsTotalStudents = school.CmsTotalStudents,
            CmsTotalTeachers = school.CmsTotalTeachers,
            CmsFeeCollection = school.CmsFeeCollection,
            CmsAttendanceRate = school.CmsAttendanceRate,
            CmsAnnouncements = school.CmsAnnouncements,
            CmsEvents = school.CmsEvents
        };

        /// <summary>
        /// Converts the write DTO into the existing school entity expected by service/stored-procedure logic.
        /// </summary>
        private static School ToEntity(SchoolWriteDto dto, int id = 0) => new()
        {
            Id = id,
            Name = dto.Name,
            Code = dto.Code,
            Address = dto.Address,
            Email = dto.Email,
            Phone = dto.Phone,
            Status = dto.Status,
            ProfilePhotoPath = dto.ProfilePhotoPath,
            ShortName = dto.ShortName,
            CityId = dto.CityId,
            StateId = dto.StateId,
            Pincode = dto.Pincode,
            SMSLimit = dto.SMSLimit,
            TotalSMSSent = dto.TotalSMSSent,
            SMSBalance = dto.SMSBalance,
            EnableSMS = dto.EnableSMS,
            EnablePresenteeSMS = dto.EnablePresenteeSMS,
            AutomaticBirthdaySMS = dto.AutomaticBirthdaySMS,
            EnableWhatsapp = dto.EnableWhatsapp,
            WebsiteUrl = dto.WebsiteUrl,
            SMSSenderID = dto.SMSSenderID,
            BusNumbers = dto.BusNumbers,
            SCANiDContact = dto.SCANiDContact,
            SCANiDEmail = dto.SCANiDEmail,
            InChargeContact = dto.InChargeContact,
            CreatedBy = dto.CreatedBy,
            ModifiedBy = dto.ModifiedBy,
            DashboardTheme = dto.DashboardTheme,
            CmsTotalStudents = dto.CmsTotalStudents,
            CmsTotalTeachers = dto.CmsTotalTeachers,
            CmsFeeCollection = dto.CmsFeeCollection,
            CmsAttendanceRate = dto.CmsAttendanceRate,
            CmsAnnouncements = dto.CmsAnnouncements,
            CmsEvents = dto.CmsEvents
        };

        /// <summary>
        /// Retrieves all active schools.
        /// </summary>
        /// <returns>A list of schools.</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SchoolDto>>> GetSchools()
        {
            var schools = await _schoolService.GetSchoolsAsync();
            return Ok(schools.Select(ToDto));
        }

        /// <summary>
        /// Retrieves a specific school by its ID.
        /// </summary>
        /// <param name="id">The school ID.</param>
        /// <returns>The requested school record.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<SchoolDto>> GetSchool(int id)
        {
            var school = await _schoolService.GetSchoolByIdAsync(id);
            if (school == null) return NotFound();
            return Ok(ToDto(school));
        }

        /// <summary>
        /// Creates a new school record.
        /// </summary>
        /// <param name="school">The school object.</param>
        /// <returns>The created school record.</returns>
        [HttpPost]
        public async Task<ActionResult<SchoolDto>> PostSchool(SchoolWriteDto request)
        {
            var school = ToEntity(request);
            var createdSchool = await _schoolService.CreateSchoolAsync(school);
            return CreatedAtAction("GetSchool", new { id = createdSchool.Id }, ToDto(createdSchool));
        }

        /// <summary>
        /// Updates an existing school record.
        /// </summary>
        /// <param name="id">The ID of the school to update.</param>
        /// <param name="school">The updated school object.</param>
        /// <returns>No content on success.</returns>
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSchool(int id, SchoolWriteDto request)
        {
            var existingSchool = await _schoolService.GetSchoolByIdAsync(id);
            if (existingSchool == null) return NotFound();

            var school = ToEntity(request, id);
            var success = await _schoolService.UpdateSchoolAsync(school);
            if (!success) return StatusCode(500, "Failed to persist school record updates.");

            return NoContent();
        }

        /// <summary>
        /// Removes a school record (soft delete handled by service).
        /// </summary>
        /// <param name="id">The school ID to delete.</param>
        /// <returns>No content on success.</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchool(int id)
        {
            var success = await _schoolService.DeleteSchoolAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }

        /// <summary>
        /// Updates a school's identity image (logo) by saving it to the server filesystem.
        /// </summary>
        /// <param name="id">The school ID.</param>
        /// <param name="file">The uploaded image file.</param>
        /// <returns>JSON object containing the saved relative path.</returns>
        [HttpPost("{id}/photo")]
        public async Task<IActionResult> UploadPhoto(int id, [FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0) 
            {
                return BadRequest(new { message = "No image file provided for upload." });
            }

            var school = await _schoolService.GetSchoolByIdAsync(id);
            if (school == null) 
            {
                return NotFound(new { message = "School record not found." });
            }

            try 
            {
                var schoolSnapshotName = SanitizeFolderName(school.Name);
                
                string webRootPath = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRootPath))
                {
                    webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }
                
                if (!Directory.Exists(webRootPath))
                {
                    Directory.CreateDirectory(webRootPath);
                }

                var relativeFolder = Path.Combine("photos", id.ToString());
                var uploadsFolder = Path.Combine(webRootPath, relativeFolder);
                
                if (!Directory.Exists(uploadsFolder)) 
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate a 12-digit random number as requested by the user
                var extension = Path.GetExtension(file.FileName);
                if (string.IsNullOrEmpty(extension)) extension = ".png";
                var random = new Random();
                var random12Digit = string.Concat(Enumerable.Range(0, 12).Select(_ => random.Next(10).ToString()));
                var fileName = $"{random12Digit}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                var relativePath = $"{relativeFolder.Replace("\\", "/")}/{fileName}";

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                if (!string.IsNullOrEmpty(school.ProfilePhotoPath))
                {
                    var oldFilePath = Path.Combine(webRootPath, school.ProfilePhotoPath.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try { System.IO.File.Delete(oldFilePath); } catch { /* ignore */ }
                    }
                }

                var success = await _schoolService.SavePhotoPathAsync(id, relativePath);
                if (!success) return StatusCode(500, "Failed to persist updated logo path to the database.");

                return Ok(new { 
                    message = "School identity image updated successfully", 
                    path = relativePath 
                });
            }
            catch (Exception ex)
            {
                FileLogger.LogError(ex);
                return StatusCode(500, new { message = "Physical storage failed: " + ex.Message });
            }
        }

        private string SanitizeFolderName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "Unassigned";
            var invalidChars = Path.GetInvalidFileNameChars();
            var sanitized = new string(name.Select(ch => invalidChars.Contains(ch) ? '_' : ch).ToArray());
            return sanitized.Replace(" ", "_").Trim('_');
        }
    }
}
