using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScanID.Api.Models
{
    /// <summary>
    /// Base class for all entities with audit fields.
    /// </summary>
    public abstract class BaseEntity
    {
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public string? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public string? ModifiedBy { get; set; }
        public DateTime ModifiedOn { get; set; } = DateTime.Now;
        public int? SchoolId { get; set; }
        public int? AcademicYearId { get; set; }
    }

    /// <summary>
    /// Model for tracking data changes.
    /// </summary>
    public class AuditLog
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public string? Type { get; set; }
        public string? TableName { get; set; }
        public DateTime DateTime { get; set; }
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? AffectedColumns { get; set; }
        public string? PrimaryKey { get; set; }
        public int? SchoolId { get; set; }
        public int? AcademicYearId { get; set; }
    }

    /// <summary>
    /// Model for structured error logging in the database.
    /// </summary>
    public class ErrorLog
    {
        public int Id { get; set; }
        public string? Message { get; set; }
        public string? Level { get; set; }
        public DateTime Timestamp { get; set; }
        public string? Exception { get; set; }
        public string? Properties { get; set; }
        public int? SchoolId { get; set; }
        public int? AcademicYearId { get; set; }
    }

    /// <summary>
    /// Represents a school registration.
    /// </summary>
    public class School
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
        
        // --- Legacy School Information form - New Fields ---
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

        // Navigation labels for representation
        public string? CityName { get; set; }
        public string? StateName { get; set; }

        // Audit/status properties at the end of the class for complete UI/DB consistency
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public string? CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime ModifiedOn { get; set; } = DateTime.UtcNow;
        public string? DashboardTheme { get; set; }
        public int? CmsTotalStudents { get; set; }
        public int? CmsTotalTeachers { get; set; }
        public string? CmsFeeCollection { get; set; }
        public string? CmsAttendanceRate { get; set; }
        public string? CmsAnnouncements { get; set; }
        public string? CmsEvents { get; set; }
    }

    /// <summary>
    /// Represents a system user.
    /// </summary>
    public class User : BaseEntity
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; } = "student";
        public int? RoleId { get; set; }
        [ForeignKey("RoleId")]
        public Role? RoleEntity { get; set; }
        [ForeignKey("SchoolId")]
        public School? School { get; set; }
    }

    /// <summary>
    /// Represents a dynamic navigation menu item.
    /// </summary>
    public class NavigationItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Path { get; set; }
        public int? ParentId { get; set; }
        public int SortOrder { get; set; }
        public int? SchoolId { get; set; }
        public int? AcademicYearId { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
        public ICollection<NavigationRole> NavigationRoles { get; set; } = new List<NavigationRole>();
    }

    /// <summary>
    /// Junction table for role-based navigation access.
    /// </summary>
    public class NavigationRole
    {
        public int NavigationItemId { get; set; }
        public NavigationItem? NavigationItem { get; set; }
        public int RoleId { get; set; }
        public Role? Role { get; set; }
    }

    /// <summary>
    /// Represents a student record based on the studentmaster schema.
    /// </summary>
    public class Student : BaseEntity
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string Status { get; set; } = "Active";
        public int RollNumber { get; set; }

        // --- Cleaned columns used by the application ---
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        
        // General Registration Number (GrNo) made nullable to match the [dbo].[Students] column schema [GrNo] [nvarchar](100) NULL
        public string? GrNo { get; set; }
        
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? MotherName { get; set; }
        public string? FatherContactNo { get; set; }
        public string? ProfilePhotoPath { get; set; }
        public bool Sms { get; set; }
        public string? AadharCard { get; set; }
        public string? UniformId { get; set; }
        public string? MotherContactNo { get; set; }
        public string? Rfid { get; set; }
        public int? SchoolSectionId { get; set; }
        public DateTime? AdmissionDate { get; set; }
        public string? Email { get; set; }
        public bool IsStateBoard { get; set; }
        public bool DigitalUniform { get; set; }
        public bool DigitalNotebook { get; set; }
        public bool OptedForBus { get; set; }

        [ForeignKey("SchoolSectionId")]
        public SchoolSection? SchoolSection { get; set; }

        // --- ID Mapping properties for master data ---
        public int? StandardId { get; set; }
        public int? SectionId { get; set; }
        public int? CategoryId { get; set; }
        
        [ForeignKey("AcademicYearId")]
        public AcademicYear? AcademicYear { get; set; }

        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }
        
        public int? CasteId { get; set; }
        public int? SubCasteId { get; set; }
        public int? ReligionId { get; set; }
        public int? BloodGroupId { get; set; }
        public int? HouseId { get; set; }
        public int? AdmissionTypeId { get; set; }
        public int? CityId { get; set; }
        public int? StateId { get; set; }
        public int? ShiftId { get; set; }

        [ForeignKey("SchoolId")]
        public School? School { get; set; }

        [ForeignKey("StandardId")]
        public Standard? Standard { get; set; }

        [ForeignKey("SectionId")]
        public Section? Section { get; set; }

        [ForeignKey("ShiftId")]
        public Shift? Shift { get; set; }

        [ForeignKey("CasteId")]
        public Caste? Caste { get; set; }

        [ForeignKey("SubCasteId")]
        public SubCaste? SubCaste { get; set; }

        [ForeignKey("ReligionId")]
        public Religion? Religion { get; set; }

        [ForeignKey("BloodGroupId")]
        public BloodGroup? BloodGroup { get; set; }

        [ForeignKey("HouseId")]
        public House? House { get; set; }

        [ForeignKey("AdmissionTypeId")]
        public AdmissionType? AdmissionType { get; set; }

        [ForeignKey("CityId")]
        public City? City { get; set; }

        [ForeignKey("StateId")]
        public State? State { get; set; }
    }


    /// <summary>
    /// Tracks student and staff attendance.
    /// </summary>
    public class Attendance : BaseEntity
    {
        public int Id { get; set; }
        public int? StudentId { get; set; }
        public int? StaffId { get; set; }
        public DateTime Date { get; set; }
        public string Status { get; set; } = "Present";
        public int MarkedByUserId { get; set; } = 1;
        public string UploadSource { get; set; } = "Manual";
        public string? Remarks { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }

        [ForeignKey("StaffId")]
        public Staff? Staff { get; set; }
    }

    /// <summary>
    /// Manages student fees.
    /// </summary>
    public class Fee : BaseEntity
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Type { get; set; } = "Tuition";
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? PaidDate { get; set; }
        public string Status { get; set; } = "Pending";
        public string? PaymentMethod { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }
    }

    /// <summary>
    /// Tracks student academic marks.
    /// </summary>
    public class Mark : BaseEntity
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string ExamName { get; set; } = "Mid-Term";
        public decimal MarksObtained { get; set; }
        public decimal TotalMarks { get; set; }
        public string? Grade { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }
    }

    /// <summary>
    /// Represents a staff record.
    /// </summary>
    [Table("Staff")]
    public class Staff : BaseEntity
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string EmployeeId { get; set; } = string.Empty; // Employee Code
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
        public bool IsClassTeacher { get; set; } = false;

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

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("SchoolId")]
        public School? School { get; set; }

        [ForeignKey("StandardId")]
        public Standard? Standard { get; set; }

        [ForeignKey("SectionId")]
        public Section? Section { get; set; }

        [ForeignKey("BloodGroupId")]
        public BloodGroup? BloodGroup { get; set; }

        [ForeignKey("ReligionId")]
        public Religion? Religion { get; set; }

        [ForeignKey("CasteId")]
        public Caste? Caste { get; set; }

        [ForeignKey("SubCasteId")]
        public SubCaste? SubCaste { get; set; }

        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }

        [ForeignKey("CityId")]
        public City? City { get; set; }

        [ForeignKey("StateId")]
        public State? State { get; set; }

        [ForeignKey("ShiftId")]
        public Shift? Shift { get; set; }
    }

    /// <summary>
    /// Manages system messages and alerts.
    /// </summary>
    public class Message : BaseEntity
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int? ReceiverId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public string Type { get; set; } = "Alert";
    }

    /// <summary>
    /// Represnets a system notification for a specific user or role.
    /// </summary>
    public class Notification : BaseEntity
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public int? RoleId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "info"; // info, success, warning, error
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    // --- Master Data Models ---
    /// <summary> Master data representing school standards (e.g., 10th Standard). </summary>
    public class Standard : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    /// <summary> Master data representing class sections (e.g., Section A). </summary>
    public class Section : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    /// <summary> Master data for academic years (e.g., 2024-25). </summary>
    public class AcademicYear : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public bool IsCurrent { get; set; }
    }

    /// <summary> Master data for social categories/castes. </summary>
    public class Caste : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for sub-categories/sub-castes related to a parent Caste. </summary>
    public class SubCaste : BaseEntity
    {
        public int Id { get; set; }
        public int CasteId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [ForeignKey("CasteId")]
        public Caste? Caste { get; set; }
    }

    /// <summary> Master data for religious affiliations. </summary>
    public class Religion : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for geographic states. </summary>
    public class State : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for geographic cities related to a parent State. </summary>
    public class City : BaseEntity
    {
        public int Id { get; set; }
        public int StateId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [ForeignKey("StateId")]
        public State? State { get; set; }
    }

    /// <summary> Master data for human blood groups. </summary>
    public class BloodGroup : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for school houses (colored organizational units). </summary>
    public class House : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
    }

    /// <summary> List of valid admission types (Regular, Transfer, etc.). </summary>
    public class AdmissionType : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Social category classifications (General, OBC, SC, ST, EWS). </summary>
    public class Category : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for school sessions (Morning, Evening, etc.). </summary>
    public class Session : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for student batches. </summary>
    public class Batch : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for school shifts. </summary>
    public class Shift : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? GraceInTime { get; set; }
        public string? SpanInTime { get; set; }
        public string? LunchStart { get; set; }
        public string? LunchEnd { get; set; }
        public string? Weekdays { get; set; }
        public bool IsSpecialShift { get; set; } = false;
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    /// <summary> Master data for weekdays. </summary>
    public class Weekday : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for school holidays. </summary>
    public class Holiday : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string? Description { get; set; }
    }

    /// <summary> Master data for academic subjects. </summary>
    public class Subject : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Associated Standard/Grade for subject mapping
        public int? StandardId { get; set; }
        [ForeignKey("StandardId")]
        public Standard? Standard { get; set; }
    }

    /// <summary> Master data for examination types. </summary>
    public class ExamType : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for staff roles/designations. </summary>
    public class Designation : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for parent/guardian occupations. </summary>
    public class Occupation : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> System roles for user permissions mapping. </summary>
    public class Role : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    /// <summary> System alert types for severity classification in communication and notifications. </summary>
    public class AlertType : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Code { get; set; } = string.Empty;
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Customizable system labels for custom localization/white-labeling as configured by Superadmins. </summary>
    public class SystemLabel : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Key { get; set; } = string.Empty;
        [Required]
        public string DefaultValue { get; set; } = string.Empty;
        [Required]
        public string CustomizedValue { get; set; } = string.Empty;
        public string Category { get; set; } = "General";
    }

    /// <summary> Master data for school sections (Primary, Secondary, Higher Secondary, etc). </summary>
    public class SchoolSection : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents a parsed card log entry imported from an iodata text file.
    /// </summary>
    public class IodataRecord : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Rfid { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string InTime { get; set; } = string.Empty;
        public bool IsPresent { get; set; } = true;
        public bool IsStudent { get; set; } = false;
        public int? ShiftId { get; set; }
        public string? GrNo { get; set; }
        public string? MatchedName { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public string? PunchDate { get; set; }
        public string? PunchTime { get; set; }
        public string? MachineId { get; set; }
        public string? TransactionId { get; set; }
    }

    /// <summary> Master data for staff initials. </summary>
    public class StaffInitial : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Master data for official Attendance Statuses. </summary>
    public class AttendanceStatus : BaseEntity
    {
        public int Id { get; set; }
        [Required]
        public string Code { get; set; } = string.Empty;
        [Required]
        public string Name { get; set; } = string.Empty;
    }

    /// <summary> Manages Student and Staff Leave Applications. </summary>
    public class LeaveApplication : BaseEntity
    {
        public int Id { get; set; }
        public int? StudentId { get; set; }
        public int? StaffId { get; set; }
        [Required]
        public DateTime FromDate { get; set; }
        [Required]
        public DateTime ToDate { get; set; }
        [Required]
        public string Status { get; set; } = "Approved"; // Approved, Pending, Rejected
        public string? LeaveType { get; set; } = "L";
        public string? Remarks { get; set; }

        [ForeignKey("StudentId")]
        public Student? Student { get; set; }

        [ForeignKey("StaffId")]
        public Staff? Staff { get; set; }
    }

    /// <summary> Audit logs for manual modifications of attendance status. </summary>
    public class AttendanceAuditLog
    {
        public int Id { get; set; }
        public int AttendanceId { get; set; }
        [Required]
        public string OldStatus { get; set; } = string.Empty;
        [Required]
        public string NewStatus { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public int ChangedBy { get; set; }
        public DateTime ChangedOn { get; set; } = DateTime.UtcNow;

        [ForeignKey("AttendanceId")]
        public Attendance? Attendance { get; set; }
    }

    /// <summary> Records monthly attendance locking states to secure data post-payroll. </summary>
    public class AttendanceLock
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public bool IsLocked { get; set; } = true;
        public string? LockedBy { get; set; }
        public DateTime LockedOn { get; set; } = DateTime.UtcNow;
    }
}

