using System.ComponentModel.DataAnnotations;

namespace ScanID.Api.Models
{
    /// <summary>
    /// Safe user payload returned to clients. Sensitive fields such as PasswordHash are intentionally excluded.
    /// </summary>
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public int? RoleId { get; set; }
        public int? SchoolId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime ModifiedOn { get; set; }
    }

    /// <summary>
    /// User creation contract. PasswordHash is accepted only to preserve the existing UI/API flow;
    /// it should be replaced by a proper Password field plus server-side hashing.
    /// </summary>
    public class UserCreateDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        public string? PasswordHash { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public int? RoleId { get; set; }
        public int? SchoolId { get; set; }
        public string? CreatedBy { get; set; }
    }

    /// <summary>
    /// User update contract. Only editable fields are accepted, preventing accidental entity overposting.
    /// </summary>
    public class UserUpdateDto : UserCreateDto
    {
        public string? ModifiedBy { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Safe staff payload returned to clients. Sensitive fields are intentionally excluded.
    /// </summary>
    public class StaffDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SchoolId { get; set; }
        public string EmployeeId { get; set; } = string.Empty; // Maps to employee code
        public string? Initials { get; set; }
        public string? Department { get; set; }
        public string? Qualification { get; set; }
        public string? PersonalContact { get; set; } // Personal Contact (previously ContactNumber)
        public string? EmergencyContact { get; set; } // Emergency Contact (previously Contact2)
        public string Status { get; set; } = "Active";
        public string? ProfilePhotoPath { get; set; }
        public string? Experience { get; set; }
        public string? Subject { get; set; }
        public int? StandardId { get; set; }
        public int? SectionId { get; set; }
        public bool IsClassTeacher { get; set; }

        // Legacy Staff Fields
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? BloodGroupId { get; set; }
        public DateTime? RetirementDate { get; set; }
        public int? ReligionId { get; set; }
        public int? CasteId { get; set; }
        public int? SubCasteId { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string? Address { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public string? BioId { get; set; }
        public string? Rfid { get; set; }
        public int? ShiftId { get; set; }

        // Descriptive helper strings fetched from joins
        public string? BloodGroupName { get; set; }
        public string? ReligionName { get; set; }
        public string? CasteName { get; set; }
        public string? SubCasteName { get; set; }
        public string? CategoryName { get; set; }
        public string? CityName { get; set; }
        public string? StateName { get; set; }
        public string? ShiftName { get; set; }
        public string? StandardName { get; set; }
        public string? SectionName { get; set; }

        public UserDto? User { get; set; }
    }

    /// <summary>
    /// Staff write contract. It accepts only fields editable from the staff form.
    /// </summary>
    public class StaffWriteDto
    {
        public int UserId { get; set; }
        public int SchoolId { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string? Initials { get; set; }
        public string? Department { get; set; }
        public string? Qualification { get; set; }
        public string? PersonalContact { get; set; }
        public string? EmergencyContact { get; set; }
        public string Status { get; set; } = "Active";
        public string? ProfilePhotoPath { get; set; }
        public string? Experience { get; set; }
        public string? Subject { get; set; }
        public int? StandardId { get; set; }
        public int? SectionId { get; set; }
        public bool IsClassTeacher { get; set; }

        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? BloodGroupId { get; set; }
        public DateTime? RetirementDate { get; set; }
        public int? ReligionId { get; set; }
        public int? CasteId { get; set; }
        public int? SubCasteId { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string? Address { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public string? BioId { get; set; }
        public string? Rfid { get; set; }
        public int? ShiftId { get; set; }

        public UserCreateDto? User { get; set; }
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
    }

    /// <summary>
    /// Represents a single row in a bulk staff upload operation.
    /// Perfectly maps to the required export/import excel structure.
    /// </summary>
    public class BulkStaffUploadRow
    {
        public int RowIndex { get; set; }
        public string? EmployeeId { get; set; } // "Employee ID"
        public string? Initials { get; set; } // "Initials"
        public string? Name { get; set; } // "Name"
        public string? Email { get; set; } // "Email"
        public string? Subject { get; set; } // "Core Expertise"
        public string? Qualification { get; set; } // "Credentials"
        public string? Status { get; set; } // "Status"
        public string? PersonalContact { get; set; } // "Personal Contact"
        public string? EmergencyContact { get; set; } // "Emergency Contact"
        public string? Gender { get; set; } // "Gender"
        public string? IsClassTeacher { get; set; } // "Class Teacher" (Yes/No)
        public string? State { get; set; } // "State"
        public string? City { get; set; } // "City"
        public string? Rfid { get; set; } // "RFID Tag"
    }

    /// <summary>
    /// Represents the total results of a bulk staff upload session.
    /// </summary>
    public class BulkStaffUploadResult
    {
        public int InsertedCount { get; set; }
        public int ErrorCount { get; set; }
        public List<BulkStaffUploadErrorRow> ErrorRows { get; set; } = new();
        public List<BulkStaffUploadSuccessRow> InsertedRows { get; set; } = new();
    }

    /// <summary>
    /// DTO for displaying back validation and processing failures per-row.
    /// </summary>
    public class BulkStaffUploadErrorRow
    {
        public int RowIndex { get; set; }
        public string? EmployeeId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO indicating successfully processed and saved staff accounts.
    /// </summary>
    public class BulkStaffUploadSuccessRow
    {
        public int RowIndex { get; set; }
        public string? EmployeeId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
    }

    /// <summary>
    /// Student response DTO for directory/API consumers. It preserves the existing camelCase contract
    /// while avoiding direct EF navigation serialization.
    /// </summary>
    public class StudentDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public string Status { get; set; } = "Active";
        public int RollNumber { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? GrNo { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? MotherName { get; set; }
        public string? FatherContactNo { get; set; }
        public string? MotherContactNo { get; set; }
        public string? AadharCard { get; set; }
        public string? ProfilePhotoPath { get; set; }
        public int? StandardId { get; set; }
        public int? SectionId { get; set; }
        public int? AcademicYearId { get; set; }
        public int? CategoryId { get; set; }
        public int? CasteId { get; set; }
        public int? SubCasteId { get; set; }
        public int? ReligionId { get; set; }
        public int? BloodGroupId { get; set; }
        public int? HouseId { get; set; }
        public int? AdmissionTypeId { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public int? ShiftId { get; set; }
        public int? SchoolSectionId { get; set; }
        public string? Email { get; set; }
        public DateTime? AdmissionDate { get; set; }
        public string? UniformId { get; set; }
        public string? Rfid { get; set; }
        public bool Sms { get; set; }
        public bool IsStateBoard { get; set; }
        public bool DigitalUniform { get; set; }
        public bool DigitalNotebook { get; set; }
        public bool OptedForBus { get; set; }
        public string? Standard { get; set; }
        public string? Section { get; set; }
        public string? AcademicYear { get; set; }
        public string? ShiftName { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime ModifiedOn { get; set; }
    }

    /// <summary>
    /// Student write DTO used for create/update/bulk operations. This prevents clients from posting
    /// arbitrary EF navigation graphs while keeping all existing form fields available.
    /// </summary>
    public class StudentWriteDto
    {
        public string Name { get; set; } = string.Empty;
        public int SchoolId { get; set; }
        public string Status { get; set; } = "Active";
        public int RollNumber { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? GrNo { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? MotherName { get; set; }
        public string? FatherContactNo { get; set; }
        public string? MotherContactNo { get; set; }
        public string? AadharCard { get; set; }
        public string? ProfilePhotoPath { get; set; }
        public int? StandardId { get; set; }
        public int? SectionId { get; set; }
        public int? AcademicYearId { get; set; }
        public int? CategoryId { get; set; }
        public int? CasteId { get; set; }
        public int? SubCasteId { get; set; }
        public int? ReligionId { get; set; }
        public int? BloodGroupId { get; set; }
        public int? HouseId { get; set; }
        public int? AdmissionTypeId { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public int? ShiftId { get; set; }
        public int? SchoolSectionId { get; set; }
        public string? Email { get; set; }
        public DateTime? AdmissionDate { get; set; }
        public string? UniformId { get; set; }
        public string? Rfid { get; set; }
        public bool Sms { get; set; }
        public bool IsStateBoard { get; set; }
        public bool DigitalUniform { get; set; }
        public bool DigitalNotebook { get; set; }
        public bool OptedForBus { get; set; }
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
    }

    /// <summary>
    /// School response DTO. Kept broad because the school configuration screen edits many operational settings.
    /// </summary>
    public class SchoolDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Address { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public int TotalStudents { get; set; }
        public string Status { get; set; } = "Active";
        public string? ProfilePhotoPath { get; set; }
        public string? ShortName { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public string? Pincode { get; set; }
        public int? SMSLimit { get; set; }
        public int? TotalSMSSent { get; set; }
        public int? SMSBalance { get; set; }
        public bool? EnableSMS { get; set; }
        public bool? EnablePresenteeSMS { get; set; }
        public bool? AutomaticBirthdaySMS { get; set; }
        public bool? EnableWhatsapp { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? SMSSenderID { get; set; }
        public string? BusNumbers { get; set; }
        public string? SCANiDContact { get; set; }
        public string? SCANiDEmail { get; set; }
        public string? InChargeContact { get; set; }
        public string? CityName { get; set; }
        public string? StateName { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime ModifiedOn { get; set; }
        public string? DashboardTheme { get; set; }
        public int? CmsTotalStudents { get; set; }
        public int? CmsTotalTeachers { get; set; }
        public string? CmsFeeCollection { get; set; }
        public string? CmsAttendanceRate { get; set; }
        public string? CmsAnnouncements { get; set; }
        public string? CmsEvents { get; set; }
    }

    /// <summary>
    /// School write DTO with editable configuration fields only.
    /// </summary>
    public class SchoolWriteDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Address { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Status { get; set; } = "Active";
        public string? ProfilePhotoPath { get; set; }
        public string? ShortName { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public string? Pincode { get; set; }
        public int? SMSLimit { get; set; }
        public int? TotalSMSSent { get; set; }
        public int? SMSBalance { get; set; }
        public bool? EnableSMS { get; set; }
        public bool? EnablePresenteeSMS { get; set; }
        public bool? AutomaticBirthdaySMS { get; set; }
        public bool? EnableWhatsapp { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? SMSSenderID { get; set; }
        public string? BusNumbers { get; set; }
        public string? SCANiDContact { get; set; }
        public string? SCANiDEmail { get; set; }
        public string? InChargeContact { get; set; }
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
        public string? DashboardTheme { get; set; }
        public int? CmsTotalStudents { get; set; }
        public int? CmsTotalTeachers { get; set; }
        public string? CmsFeeCollection { get; set; }
        public string? CmsAttendanceRate { get; set; }
        public string? CmsAnnouncements { get; set; }
        public string? CmsEvents { get; set; }
    }

    /// <summary>
    /// Response model for high-performance bulk student upload API.
    /// Supports partial success reporting.
    /// </summary>
    public class BulkUploadResponseDto
    {
        public int InsertedCount { get; set; }
        public int ErrorCount { get; set; }
        public List<BulkUploadErrorDetail> ErrorRows { get; set; } = new List<BulkUploadErrorDetail>();
        public List<StudentRowDto> InsertedRows { get; set; } = new List<StudentRowDto>();
    }

    /// <summary>
    /// Details for invalid student records discovered during bulk validation.
    /// </summary>
    public class BulkUploadErrorDetail
    {
        public int RowIndex { get; set; }
        public string Name { get; set; } = string.Empty;
        public string GrNo { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
    }

    /// <summary>
    /// Simplified successful student registration summary in bulk upload.
    /// </summary>
    public class StudentRowDto
    {
        public string Name { get; set; } = string.Empty;
        public string? GrNo { get; set; }
        public string? Status { get; set; }
        public int RollNumber { get; set; }
    }
}
