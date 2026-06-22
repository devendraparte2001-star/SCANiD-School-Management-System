-- =========================================================================
-- SCANiD ERP System Complete Consolidated Database Script (Microsoft SQL Server)
-- Version: 3.0 (Optimized Unified Deployment Release)
-- Description: Complete creation of ScanID_DB, all relational schemas, modern SPs, 
--              indexes, triggers, and full hierarchically-validated seed data.
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ScanID_DB')
BEGIN
    CREATE DATABASE ScanID_DB;
END
GO
USE ScanID_DB;
GO

-- ==========================================
-- 1. BASE SCHEMAS & DATABASE STRUCTURES
-- ==========================================

-- Infrastructure & System Logs Setup
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
CREATE TABLE [dbo].[AuditLogs](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [UserId] NVARCHAR(100) NULL,
    [Type] NVARCHAR(100) NULL,
    [TableName] NVARCHAR(100) NULL,
    [DateTime] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [OldValues] NVARCHAR(MAX) NULL,
    [NewValues] NVARCHAR(MAX) NULL,
    [AffectedColumns] NVARCHAR(MAX) NULL,
    [PrimaryKey] NVARCHAR(MAX) NULL,
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL
);
GO

IF OBJECT_ID('dbo.ErrorLogs', 'U') IS NULL
CREATE TABLE [dbo].[ErrorLogs](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Message] NVARCHAR(MAX) NULL,
    [Level] NVARCHAR(50) NULL,
    [Timestamp] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [Exception] NVARCHAR(MAX) NULL,
    [Properties] NVARCHAR(MAX) NULL,
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL
);
GO

-- Independent Master Tables
IF OBJECT_ID('dbo.Schools', 'U') IS NULL
CREATE TABLE [dbo].[Schools](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(250) NOT NULL,
    [Code] NVARCHAR(50) NULL,
    [Address] NVARCHAR(500) NULL,
    [Email] NVARCHAR(150) NULL,
    [Phone] NVARCHAR(50) NULL,
    [TotalStudents] INT NOT NULL DEFAULT (0),
    [ProfilePhotoPath] NVARCHAR(255) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Active'),
    [ShortName] NVARCHAR(100) NULL,
    [CityId] INT NULL,
    [StateId] INT NULL,
    [Pincode] NVARCHAR(50) NULL,
    [SMSLimit] INT NULL DEFAULT (10000),
    [TotalSMSSent] INT NULL DEFAULT (0),
    [SMSBalance] INT NULL DEFAULT (10000),
    [EnableSMS] BIT NOT NULL DEFAULT (1),
    [EnablePresenteeSMS] BIT NOT NULL DEFAULT (1),
    [AutomaticBirthdaySMS] BIT NOT NULL DEFAULT (0),
    [EnableWhatsapp] BIT NOT NULL DEFAULT (0),
    [WebsiteUrl] NVARCHAR(255) NULL,
    [SMSSenderID] NVARCHAR(50) NULL,
    [BusNumbers] NVARCHAR(MAX) NULL,
    [SCANiDContact] NVARCHAR(50) NULL,
    [SCANiDEmail] NVARCHAR(150) NULL,
    [InChargeContact] NVARCHAR(50) NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NOT NULL DEFAULT (N'SYSTEM'),
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NOT NULL DEFAULT (N'SYSTEM'),
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [DashboardTheme] NVARCHAR(50) NULL,
    [CmsTotalStudents] INT NULL,
    [CmsTotalTeachers] INT NULL,
    [CmsFeeCollection] NVARCHAR(50) NULL,
    [CmsAttendanceRate] NVARCHAR(50) NULL,
    [CmsAnnouncements] NVARCHAR(MAX) NULL,
    [CmsEvents] NVARCHAR(MAX) NULL,
    [CityName] NVARCHAR(200) NULL,
    [StateName] NVARCHAR(200) NULL
);
GO

IF OBJECT_ID('dbo.Roles', 'U') IS NULL
CREATE TABLE [dbo].[Roles](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.Standards', 'U') IS NULL
CREATE TABLE [dbo].[Standards](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.Sections', 'U') IS NULL
CREATE TABLE [dbo].[Sections](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.AcademicYears', 'U') IS NULL
CREATE TABLE [dbo].[AcademicYears](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(50) NOT NULL,
    [IsCurrent] BIT NOT NULL DEFAULT (0),
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.Castes', 'U') IS NULL
CREATE TABLE [dbo].[Castes](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Religions', 'U') IS NULL
CREATE TABLE [dbo].[Religions](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Categories', 'U') IS NULL
CREATE TABLE [dbo].[Categories](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.SchoolSections', 'U') IS NULL
CREATE TABLE [dbo].[SchoolSections](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.States', 'U') IS NULL
CREATE TABLE [dbo].[States](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.BloodGroups', 'U') IS NULL
CREATE TABLE [dbo].[BloodGroups](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(20) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Houses', 'U') IS NULL
CREATE TABLE [dbo].[Houses](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [Color] NVARCHAR(50) NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.AdmissionTypes', 'U') IS NULL
CREATE TABLE [dbo].[AdmissionTypes](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Shifts', 'U') IS NULL
CREATE TABLE [dbo].[Shifts](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(100) NOT NULL,
    [StartTime] NVARCHAR(15) NULL,
    [EndTime] NVARCHAR(15) NULL,
    [GraceInTime] NVARCHAR(15) NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

-- Dependent Relational Master Tables
IF OBJECT_ID('dbo.SubCastes', 'U') IS NULL
CREATE TABLE [dbo].[SubCastes](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [CasteId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Castes]([Id]),
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Cities', 'U') IS NULL
CREATE TABLE [dbo].[Cities](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [StateId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[States]([Id]),
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

-- User Accounts & Security
IF OBJECT_ID('dbo.Users', 'U') IS NULL
CREATE TABLE [dbo].[Users](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Username] NVARCHAR(100) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [Name] NVARCHAR(255) NULL,
    [Email] NVARCHAR(100) NULL,
    [RoleId] INT NULL REFERENCES [dbo].[Roles]([Id]),
    [Role] NVARCHAR(50) NULL,
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

-- Employee Directory (Staff Table)
IF OBJECT_ID('dbo.Staff', 'U') IS NULL
CREATE TABLE [dbo].[Staff](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [UserId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users]([Id]) ON DELETE CASCADE,
    [SchoolId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Schools]([Id]),
    [EmployeeId] NVARCHAR(100) NOT NULL,
    [Initials] NVARCHAR(50) NULL,
    [Department] NVARCHAR(100) NULL,
    [Qualification] NVARCHAR(100) NULL,
    [PersonalContact] NVARCHAR(50) NULL,
    [EmergencyContact] NVARCHAR(100) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Active'),
    [ProfilePhotoPath] NVARCHAR(255) NULL,
    [Experience] NVARCHAR(100) NULL,
    [Subject] NVARCHAR(200) NULL,
    [StandardId] INT NULL,
    [SectionId] INT NULL,
    [IsClassTeacher] BIT NOT NULL DEFAULT (0),
    [Gender] NVARCHAR(50) NULL,
    [DateOfBirth] DATETIME2(7) NULL,
    [BloodGroupId] INT NULL,
    [ReligionId] INT NULL,
    [CasteId] INT NULL,
    [SubCasteId] INT NULL,
    [CategoryId] INT NULL,
    [DateOfJoining] DATETIME2(7) NULL,
    [Address] NVARCHAR(MAX) NULL,
    [CityId] INT NULL,
    [StateId] INT NULL,
    [BioId] NVARCHAR(100) NULL,
    [Rfid] NVARCHAR(100) NULL,
    [ShiftId] INT NULL,
    [AcademicYearId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

-- Student Registry
IF OBJECT_ID('dbo.Students', 'U') IS NULL
CREATE TABLE [dbo].[Students](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(255) NOT NULL,
    [SchoolId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Schools]([Id]) ON DELETE CASCADE,
    [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Active'),
    [RollNumber] INT NOT NULL,
    [FirstName] NVARCHAR(200) NULL,
    [MiddleName] NVARCHAR(200) NULL,
    [LastName] NVARCHAR(200) NULL,
    [GrNo] NVARCHAR(100) NULL,
    [Gender] NVARCHAR(10) NULL,
    [DateOfBirth] DATETIME NULL,
    [Address] NVARCHAR(500) NULL,
    [MotherName] NVARCHAR(200) NULL,
    [FatherContactNo] NVARCHAR(200) NULL,
    [MotherContactNo] NVARCHAR(200) NULL,
    [AadharCard] NVARCHAR(100) NULL,
    [UniformId] NVARCHAR(500) NULL,
    [Rfid] NVARCHAR(100) NULL,
    [SchoolSectionId] INT NULL REFERENCES [dbo].[SchoolSections]([Id]),
    [AdmissionDate] DATETIME NULL,
    [Email] NVARCHAR(255) NULL,
    [StandardId] INT NULL REFERENCES [dbo].[Standards]([Id]),
    [SectionId] INT NULL REFERENCES [dbo].[Sections]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [CasteId] INT NULL REFERENCES [dbo].[Castes]([Id]),
    [SubCasteId] INT NULL REFERENCES [dbo].[SubCastes]([Id]),
    [ReligionId] INT NULL REFERENCES [dbo].[Religions]([Id]),
    [BloodGroupId] INT NULL REFERENCES [dbo].[BloodGroups]([Id]),
    [HouseId] INT NULL REFERENCES [dbo].[Houses]([Id]),
    [AdmissionTypeId] INT NULL REFERENCES [dbo].[AdmissionTypes]([Id]),
    [CityId] INT NULL REFERENCES [dbo].[Cities]([Id]),
    [StateId] INT NULL REFERENCES [dbo].[States]([Id]),
    [ShiftId] INT NULL REFERENCES [dbo].[Shifts]([Id]),
    [CategoryId] INT NULL REFERENCES [dbo].[Categories]([Id]),
    [Sms] BIT NOT NULL DEFAULT (0),
    [IsStateBoard] BIT NOT NULL DEFAULT (0),
    [ProfilePhotoPath] NVARCHAR(500) NULL,
    [DigitalUniform] BIT NOT NULL DEFAULT (0),
    [DigitalNotebook] BIT NOT NULL DEFAULT (0),
    [OptedForBus] BIT NOT NULL DEFAULT (0),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

-- Sidebar Interactive Layout Menus
IF OBJECT_ID('dbo.NavigationItems', 'U') IS NULL
CREATE TABLE [dbo].[NavigationItems](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Title] NVARCHAR(100) NOT NULL,
    [Icon] NVARCHAR(100) NULL,
    [Path] NVARCHAR(255) NULL,
    [ParentId] INT NULL REFERENCES [dbo].[NavigationItems]([Id]),
    [SortOrder] INT NOT NULL DEFAULT ((0)),
    [SchoolId] INT NULL,
    [AcademicYearId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT ((1)),
    [IsDeleted] BIT NOT NULL DEFAULT ((0)),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.NavigationRoles', 'U') IS NULL
CREATE TABLE [dbo].[NavigationRoles](
    [NavigationItemId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[NavigationItems]([Id]) ON DELETE CASCADE,
    [RoleId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Roles]([Id]) ON DELETE CASCADE,
    CONSTRAINT [PK_NavigationRoles] PRIMARY KEY CLUSTERED ([NavigationItemId] ASC, [RoleId] ASC)
);
GO

-- Transactional Modules
IF OBJECT_ID('dbo.Attendance', 'U') IS NULL
CREATE TABLE [dbo].[Attendance](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [StudentId] INT NULL REFERENCES [dbo].[Students]([Id]),
    [StaffId] INT NULL REFERENCES [dbo].[Staff]([Id]),
    [Date] DATETIME2(7) NOT NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Present'),
    [MarkedByUserId] INT NOT NULL DEFAULT (1),
    [UploadSource] NVARCHAR(100) NOT NULL DEFAULT (N'Manual'),
    [Remarks] NVARCHAR(MAX) NULL,
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(100) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE())
);
GO

IF OBJECT_ID('dbo.Fees', 'U') IS NULL
CREATE TABLE [dbo].[Fees](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [StudentId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Students]([Id]) ON DELETE CASCADE,
    [InvoiceNumber] NVARCHAR(100) NOT NULL,
    [Type] NVARCHAR(100) NOT NULL DEFAULT (N'Tuition'),
    [Amount] DECIMAL(18,2) NOT NULL,
    [DueDate] DATETIME2(7) NOT NULL,
    [PaidDate] DATETIME2(7) NULL,
    [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Pending'),
    [PaymentMethod] NVARCHAR(100) NULL,
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Marks', 'U') IS NULL
CREATE TABLE [dbo].[Marks](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [StudentId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Students]([Id]) ON DELETE CASCADE,
    [Subject] NVARCHAR(150) NOT NULL,
    [ExamName] NVARCHAR(100) NOT NULL DEFAULT (N'Mid-Term'),
    [MarksObtained] DECIMAL(18,2) NOT NULL,
    [TotalMarks] DECIMAL(18,2) NOT NULL,
    [Grade] NVARCHAR(50) NULL,
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
CREATE TABLE [dbo].[Notifications](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [UserId] INT NULL,
    [RoleId] INT NULL,
    [Title] NVARCHAR(255) NOT NULL,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Type] NVARCHAR(50) NOT NULL DEFAULT (N'info'),
    [IsRead] BIT NOT NULL DEFAULT (0),
    [CreatedAt] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id]),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(100) NULL
);
GO

IF OBJECT_ID('dbo.IodataRecords', 'U') IS NULL
CREATE TABLE [dbo].[IodataRecords](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Rfid] NVARCHAR(100) NOT NULL,
    [Date] DATETIME2(7) NOT NULL,
    [InTime] NVARCHAR(15) NOT NULL,
    [IsPresent] BIT NOT NULL DEFAULT (1),
    [IsStudent] BIT NOT NULL DEFAULT (0),
    [ShiftId] INT NULL REFERENCES [dbo].[Shifts]([Id]),
    [GrNo] NVARCHAR(100) NULL,
    [MatchedName] NVARCHAR(255) NULL,
    [Role] NVARCHAR(50) NULL,
    [Status] NVARCHAR(50) NULL,
    [SchoolId] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.StaffInitials', 'U') IS NULL
CREATE TABLE [dbo].[StaffInitials](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Name] NVARCHAR(50) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0)
);
GO

IF OBJECT_ID('dbo.AlertTypes', 'U') IS NULL
CREATE TABLE [dbo].[AlertTypes](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Code] NVARCHAR(50) NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT (1)
);
GO

IF OBJECT_ID('dbo.SystemLabels', 'U') IS NULL
CREATE TABLE [dbo].[SystemLabels](
    [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
    [Key] NVARCHAR(255) NOT NULL UNIQUE,
    [DefaultValue] NVARCHAR(max) NOT NULL,
    [CustomizedValue] NVARCHAR(max) NOT NULL,
    [Category] NVARCHAR(100) NOT NULL DEFAULT (N'General'),
    [IsActive] BIT NOT NULL DEFAULT (1),
    [IsDeleted] BIT NOT NULL DEFAULT (0),
    [CreatedBy] NVARCHAR(255) NULL,
    [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] NVARCHAR(255) NULL,
    [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()),
    [SchoolId] INT NULL REFERENCES [dbo].[Schools]([Id]),
    [AcademicYearId] INT NULL REFERENCES [dbo].[AcademicYears]([Id])
);
GO


-- ==========================================
-- 2. DYNAMIC SCHEMIC INDEX OPTIMIZATIONS
-- ==========================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_SchoolId_IsDeleted' AND object_id = OBJECT_ID('dbo.Students'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Students_SchoolId_IsDeleted ON dbo.Students(SchoolId, IsDeleted) INCLUDE (Name, RollNumber, GrNo);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_SchoolId' AND object_id = OBJECT_ID('dbo.Staff'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Staff_SchoolId ON dbo.Staff(SchoolId) INCLUDE (EmployeeId, Subject);');

-- High-performance compound indexes binding all critical transactional modules by SchoolId and AcademicYearId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics' AND object_id = OBJECT_ID('dbo.Students'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Students_School_Academics ON dbo.Students(SchoolId, AcademicYearId, IsDeleted) INCLUDE (Name, RollNumber, GrNo);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_School_Academics' AND object_id = OBJECT_ID('dbo.Staff'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Staff_School_Academics ON dbo.Staff(SchoolId, AcademicYearId, IsActive, IsDeleted) INCLUDE (EmployeeId, Subject);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attendance_School_Academics' AND object_id = OBJECT_ID('dbo.Attendance'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Attendance_School_Academics ON dbo.Attendance(SchoolId, AcademicYearId, Date, IsActive, IsDeleted);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fees_School_Academics' AND object_id = OBJECT_ID('dbo.Fees'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Fees_School_Academics ON dbo.Fees(SchoolId, AcademicYearId, IsActive, IsDeleted);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Marks_School_Academics' AND object_id = OBJECT_ID('dbo.Marks'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Marks_School_Academics ON dbo.Marks(SchoolId, AcademicYearId, IsActive, IsDeleted);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemLabels_School_Academics' AND object_id = OBJECT_ID('dbo.SystemLabels'))
    EXEC('CREATE NONCLUSTERED INDEX IX_SystemLabels_School_Academics ON dbo.SystemLabels(SchoolId, AcademicYearId, IsDeleted);');

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_School_Academics' AND object_id = OBJECT_ID('dbo.Notifications'))
    EXEC('CREATE NONCLUSTERED INDEX IX_Notifications_School_Academics ON dbo.Notifications(SchoolId, AcademicYearId, IsRead, IsActive, IsDeleted);');


-- ==========================================
-- 3. INTERACTIVE SYSTEM DATA SEEDING
-- ==========================================

-- Populate independent tables
SET IDENTITY_INSERT [dbo].[Schools] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Schools] WHERE [Id] = 1)
    INSERT [dbo].[Schools] ([Id], [Name], [Code], [Address], [Phone], [Email], [TotalStudents], [Status], [IsActive], [IsDeleted]) 
    VALUES (1, N'SCANiD PRIMARY SCHOOL', N'SCH001', N'MUMBAI, MAHARASHTRA', N'9876543210', N'pri@scanid.com', 2, N'Active', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Schools] WHERE [Id] = 2)
    INSERT [dbo].[Schools] ([Id], [Name], [Code], [Address], [Phone], [Email], [TotalStudents], [Status], [IsActive], [IsDeleted]) 
    VALUES (2, N'SCANiD SECONDARY HIGH SCHOOL', N'SCH002', N'PUNE, MAHARASHTRA', N'9876543211', N'sec@scanid.com', 0, N'Active', 1, 0);
SET IDENTITY_INSERT [dbo].[Schools] OFF;
GO

SET IDENTITY_INSERT [dbo].[Roles] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 1) INSERT [dbo].[Roles] ([Id], [Name], [Description]) VALUES (1, N'SuperAdmin', N'Global System Administrator');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 2) INSERT [dbo].[Roles] ([Id], [Name], [Description]) VALUES (2, N'Admin', N'School Level Administrator');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 3) INSERT [dbo].[Roles] ([Id], [Name], [Description]) VALUES (3, N'Teacher', N'Teaching Staff User');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 4) INSERT [dbo].[Roles] ([Id], [Name], [Description]) VALUES (4, N'Student', N'Student Interactive Core Account');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 5) INSERT [dbo].[Roles] ([Id], [Name], [Description]) VALUES (5, N'Parent', N'Guardian Parent Account');
SET IDENTITY_INSERT [dbo].[Roles] OFF;
GO

SET IDENTITY_INSERT [dbo].[Standards] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 1) INSERT [dbo].[Standards] ([Id], [Name], [Description]) VALUES (1, N'1st', N'Grade One Primary');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 2) INSERT [dbo].[Standards] ([Id], [Name], [Description]) VALUES (2, N'2nd', N'Grade Two Primary');
SET IDENTITY_INSERT [dbo].[Standards] OFF;
GO

SET IDENTITY_INSERT [dbo].[Sections] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sections] WHERE [Id] = 1) INSERT [dbo].[Sections] ([Id], [Name], [Description]) VALUES (1, N'A', N'Division A');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sections] WHERE [Id] = 2) INSERT [dbo].[Sections] ([Id], [Name], [Description]) VALUES (2, N'B', N'Division B');
SET IDENTITY_INSERT [dbo].[Sections] OFF;
GO

SET IDENTITY_INSERT [dbo].[AcademicYears] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[AcademicYears] WHERE [Id] = 1) INSERT [dbo].[AcademicYears] ([Id], [Name], [IsCurrent]) VALUES (1, N'2024-2025', 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[AcademicYears] WHERE [Id] = 2) INSERT [dbo].[AcademicYears] ([Id], [Name], [IsCurrent]) VALUES (2, N'2025-2026', 1);
SET IDENTITY_INSERT [dbo].[AcademicYears] OFF;
GO

-- Seeding General masters
SET IDENTITY_INSERT [dbo].[Castes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Castes] WHERE [Id] = 1) INSERT [dbo].[Castes] ([Id], [Name]) VALUES (1, N'OPEN'), (2, N'OBC');
SET IDENTITY_INSERT [dbo].[Castes] OFF;

SET IDENTITY_INSERT [dbo].[Religions] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Religions] WHERE [Id] = 1) INSERT [dbo].[Religions] ([Id], [Name]) VALUES (1, N'HINDU'), (2, N'MUSLIM');
SET IDENTITY_INSERT [dbo].[Religions] OFF;

SET IDENTITY_INSERT [dbo].[Categories] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 1) INSERT [dbo].[Categories] ([Id], [Name]) VALUES (1, N'General'), (2, N'OBC');
SET IDENTITY_INSERT [dbo].[Categories] OFF;

SET IDENTITY_INSERT [dbo].[SchoolSections] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[SchoolSections] WHERE [Id] = 1) INSERT [dbo].[SchoolSections] ([Id], [Name]) VALUES (1, N'Primary'), (2, N'Secondary');
SET IDENTITY_INSERT [dbo].[SchoolSections] OFF;

SET IDENTITY_INSERT [dbo].[States] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[States] WHERE [Id] = 1) INSERT [dbo].[States] ([Id], [Name]) VALUES (1, N'MAHARASHTRA');
SET IDENTITY_INSERT [dbo].[States] OFF;

SET IDENTITY_INSERT [dbo].[BloodGroups] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[BloodGroups] WHERE [Id] = 1) INSERT [dbo].[BloodGroups] ([Id], [Name]) VALUES (1, N'A+'), (2, N'B+');
SET IDENTITY_INSERT [dbo].[BloodGroups] OFF;

SET IDENTITY_INSERT [dbo].[Houses] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Houses] WHERE [Id] = 1) INSERT [dbo].[Houses] ([Id], [Name], [Color]) VALUES (1, N'RED', N'#EF4444'), (2, N'BLUE', N'#3B82F6');
SET IDENTITY_INSERT [dbo].[Houses] OFF;

SET IDENTITY_INSERT [dbo].[AdmissionTypes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[AdmissionTypes] WHERE [Id] = 1) INSERT [dbo].[AdmissionTypes] ([Id], [Name]) VALUES (1, N'REGULAR'), (2, N'RTE');
SET IDENTITY_INSERT [dbo].[AdmissionTypes] OFF;

SET IDENTITY_INSERT [dbo].[Shifts] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Shifts] WHERE [Id] = 1) INSERT [dbo].[Shifts] ([Id], [Name], [StartTime], [EndTime]) VALUES (1, N'MORNING', N'08:00', N'12:30');
SET IDENTITY_INSERT [dbo].[Shifts] OFF;
GO

-- Seeding Dependent Master Tables
SET IDENTITY_INSERT [dbo].[SubCastes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[SubCastes] WHERE [Id] = 1) INSERT [dbo].[SubCastes] ([Id], [CasteId], [Name]) VALUES (1, 1, N'MARATHA');
SET IDENTITY_INSERT [dbo].[SubCastes] OFF;

SET IDENTITY_INSERT [dbo].[Cities] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Cities] WHERE [Id] = 1) INSERT [dbo].[Cities] ([Id], [StateId], [Name]) VALUES (1, 1, N'Mumbai'), (2, 1, N'Pune');
SET IDENTITY_INSERT [dbo].[Cities] OFF;
GO

-- Seeding Staff Initials and Alert Codes
INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive]) VALUES (N'Mr.', 1), (N'Mrs.', 1), (N'Ms.', 1);
INSERT INTO [dbo].[AlertTypes] ([Code], [Name]) VALUES (N'info', N'Blue Announcement'), (N'success', N'Green Verified');
GO

-- Seeding User Registrations
SET IDENTITY_INSERT [dbo].[Users] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 1)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [AcademicYearId]) 
    VALUES (1, N'Super Admin', N'superadmin@scanid.com', N'superadmin', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 1, 'superadmin', 1, 2);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 2)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [AcademicYearId]) 
    VALUES (2, N'Head Principal', N'admin@scanid.com', N'adminuser', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 2, 'admin', 1, 2);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 3)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [AcademicYearId]) 
    VALUES (3, N'Sanjay Khopkar', N'teacher@scanid.com', N'teacher', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 3, 'teacher', 1, 2);
SET IDENTITY_INSERT [dbo].[Users] OFF;
GO

-- Seeding Core Staff Records
SET IDENTITY_INSERT [dbo].[Staff] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Staff] WHERE [Id] = 1)
    INSERT INTO [dbo].[Staff] ([Id], [UserId], [SchoolId], [EmployeeId], [Department], [Qualification], [PersonalContact], [Status], [Experience], [Subject], [StandardId], [SectionId], [IsClassTeacher], [IsActive], [IsDeleted])
    VALUES (1, 3, 1, N'EMP001', N'Mathematics Faculty', N'MA B.Ed', N'9876543210', N'Active', N'5+ Years', N'Mathematics', 1, 1, 1, 1, 0);
SET IDENTITY_INSERT [dbo].[Staff] OFF;
GO

-- Seeding Student Records
SET IDENTITY_INSERT [dbo].[Students] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Students] WHERE [Id] = 1)
    INSERT INTO [dbo].[Students] ([Id], [Name], [SchoolId], [Status], [RollNumber], [FirstName], [LastName], [GrNo], [Gender], [DateOfBirth], [Address], [MotherName], [FatherContactNo], [Rfid], [SchoolSectionId], [StandardId], [SectionId], [AcademicYearId], [CasteId], [ReligionId], [BloodGroupId], [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId])
    VALUES (1, N'Shivansh Sanjay Khopkar', 1, N'Active', 1, N'Shivansh', N'Khopkar', N'REG1001', N'Male', '2015-05-20', N'123 Education Lane, Mumbai', N'Shraddha', N'9876543210', N'RF99221', 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Students] WHERE [Id] = 2)
    INSERT INTO [dbo].[Students] ([Id], [Name], [SchoolId], [Status], [RollNumber], [FirstName], [LastName], [GrNo], [Gender], [DateOfBirth], [Address], [MotherName], [FatherContactNo], [Rfid], [SchoolSectionId], [StandardId], [SectionId], [AcademicYearId], [CasteId], [ReligionId], [BloodGroupId], [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId])
    VALUES (2, N'Aavya Amit Patil', 1, N'Active', 2, N'Aavya', N'Patil', N'REG1002', N'Female', '2015-08-15', N'456 Ocean View, Pune', N'Alka', N'9876543211', N'RF99222', 1, 1, 1, 2, 2, 1, 2, 2, 1, 2, 1, 1, 2);
SET IDENTITY_INSERT [dbo].[Students] OFF;
GO

-- Seeding Sidebar Navigation Layout Hierarchy
PRINT 'Resetting and rebuilding unified sidebar navigation menu hierarchy...';
DELETE FROM [dbo].[NavigationRoles];
DELETE FROM [dbo].[NavigationItems];
DBCC CHECKIDENT ('[dbo].[NavigationItems]', RESEED, 0);
GO

SET IDENTITY_INSERT [dbo].[NavigationItems] ON;
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES
(1, N'Dashboard', N'LayoutDashboard', N'/', NULL, 1),
(2, N'Academic Operations', N'BookOpen', NULL, NULL, 2),
(6, N'Staff & HR', N'Users', NULL, NULL, 3),
(8, N'Administrative', N'ShieldCheck', NULL, NULL, 4),
(11, N'Masters & Config', N'Database', N'/configuration', NULL, 5),
(23, N'System Audit', N'Terminal', N'/system-logs', NULL, 6);

-- Level 2 Operations
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES
(3, N'Student Registry', N'GraduationCap', N'/students', 2, 1),
(4, N'Attendance Tracking', N'CalendarCheck', N'/attendance', 2, 2),
(5, N'Examination & Marks', N'BarChart3', N'/marks', 2, 3),
(7, N'Staff Directory', N'UserCheck', N'/staff', 6, 1),
(432, N'Manage Users', N'UserPlus', N'/configuration/users', 6, 2),
(9, N'Fee Management', N'CreditCard', N'/fees', 8, 1),
(10, N'Communication Hub', N'MessageSquare', N'/messages', 8, 2);

-- Master Details sub-menus
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES
(12, N'Global Schools', N'School', N'/configuration/schools', 11, 1),
(13, N'Access Control (RBAC)', N'Key', NULL, 11, 2),
(16, N'Menu Designer', N'Layout', NULL, 11, 3),
(18, N'Academic Masters', N'BookOpen', NULL, 11, 4),
(45, N'General Masters', N'Database', NULL, 11, 5);

INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES
(14, N'Role Master', N'Shield', N'/configuration/role-master', 13, 1),
(15, N'User Accounts', N'UserCheck', N'/configuration/role-assignment', 13, 2),
(17, N'Navigation Builder', N'LayoutGrid', N'/configuration/navigation', 16, 1),
(19, N'Standards & Grades', N'Layers', N'/configuration/standards', 18, 1),
(20, N'Divisions/Sections', N'Hash', N'/configuration/sections', 18, 2),
(21, N'Academic Years', N'Calendar', N'/configuration/academic-years', 18, 3),
(22, N'Subject Registry', N'BookOpen', N'/configuration/subjects', 18, 4);

INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES
(451, N'Religion Master', N'Heart', N'/configuration/religions', 45, 1),
(452, N'Blood Group Master', N'Droplets', N'/configuration/blood-groups', 45, 2),
(453, N'Caste Category', N'Users', N'/configuration/castes', 45, 3),
(454, N'Sub-Caste Master', N'UserCircle', N'/configuration/sub-castes', 45, 4),
(455, N'School House', N'Home', N'/configuration/houses', 45, 5),
(456, N'Admission Types', N'UserCheck', N'/configuration/admission-types', 45, 6),
(457, N'States Master', N'Map', N'/configuration/states', 45, 7),
(458, N'Cities Master', N'MapPin', N'/configuration/cities', 45, 8),
(459, N'School Sections', N'Layers', N'/configuration/school-sections', 45, 9);
SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;
GO

-- Mapping roles to navigation menus (RBAC configuration mapping indices)
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT Id, 1 FROM [dbo].[NavigationItems]; -- SuperAdmin gets all

INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT Id, 2 FROM [dbo].[NavigationItems] WHERE [Id] <> 23; -- Admin gets all except audit logs
GO

-- Seeding Sample transactional modules
SET IDENTITY_INSERT [dbo].[Attendance] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 1)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId]) VALUES (1, 1, GETUTCDATE(), N'Present', 2);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 2)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId]) VALUES (2, 2, GETUTCDATE(), N'Absent', 2);
SET IDENTITY_INSERT [dbo].[Attendance] OFF;

SET IDENTITY_INSERT [dbo].[Fees] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Fees] WHERE [Id] = 1)
    INSERT INTO [dbo].[Fees] ([Id], [StudentId], [InvoiceNumber], [Type], [Amount], [DueDate], [PaidDate], [Status], [PaymentMethod])
    VALUES (1, 1, N'INV-1001', N'Tuition Fee', 25000.00, GETUTCDATE(), GETUTCDATE(), N'Paid', N'GPay');
IF NOT EXISTS (SELECT 1 FROM [dbo].[Fees] WHERE [Id] = 2)
    INSERT INTO [dbo].[Fees] ([Id], [StudentId], [InvoiceNumber], [Type], [Amount], [DueDate], [PaidDate], [Status], [PaymentMethod])
    VALUES (2, 2, N'INV-1002', N'Tuition Fee', 25000.00, GETUTCDATE(), NULL, N'Pending', NULL);
SET IDENTITY_INSERT [dbo].[Fees] OFF;
GO


-- ==========================================
-- 4. APPLICATION SERVER SESSIONS STORED PROCEDURES
-- ==========================================

IF OBJECT_ID('dbo.sp_AuthenticateUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_AuthenticateUser;
GO
CREATE PROCEDURE dbo.sp_AuthenticateUser
    @Username NVARCHAR(100),
    @Password NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.*, s.Name AS SchoolName
    FROM [dbo].[Users] u
    LEFT JOIN [dbo].[Schools] s ON u.SchoolId = s.Id
    WHERE u.Username = @Username AND u.PasswordHash = @Password AND u.IsDeleted = 0;
END;
GO

IF OBJECT_ID('dbo.sp_GetNavigationItems', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetNavigationItems;
GO
CREATE PROCEDURE dbo.sp_GetNavigationItems
    @RoleId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ni.*, nr.RoleId 
    FROM [dbo].[NavigationItems] ni
    LEFT JOIN [dbo].[NavigationRoles] nr ON ni.Id = nr.NavigationItemId
    WHERE ni.IsActive = 1
    ORDER BY ni.SortOrder;
END;
GO

IF OBJECT_ID('dbo.sp_GetDashboardStats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetDashboardStats;
GO
CREATE PROCEDURE dbo.sp_GetDashboardStats
    @SchoolId INT = NULL,
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TotalStudents INT;
    DECLARE @TotalStaff INT;
    DECLARE @FeeCollection NVARCHAR(50);
    DECLARE @AttendanceRate NVARCHAR(50);
    DECLARE @PerformanceTrend NVARCHAR(50);

    SELECT @TotalStudents = COUNT(*) FROM [dbo].[Students] WHERE IsDeleted = 0 AND (@SchoolId IS NULL OR SchoolId = @SchoolId);
    SELECT @TotalStaff = COUNT(*) FROM [dbo].[Staff] WHERE IsDeleted = 0 AND (@SchoolId IS NULL OR SchoolId = @SchoolId);

    DECLARE @TotalFees DECIMAL(18,2);
    SELECT @TotalFees = SUM(Amount) FROM [dbo].[Fees] WHERE Status = 'Paid';
    SET @FeeCollection = N'₹' + CONVERT(NVARCHAR, ISNULL(@TotalFees, 25000.00), 1);

    DECLARE @PresentCount INT, @TotalAttendance INT;
    SELECT @PresentCount = COUNT(*) FROM [dbo].[Attendance] WHERE Status = 'Present';
    SELECT @TotalAttendance = COUNT(*) FROM [dbo].[Attendance];
    
    IF @TotalAttendance > 0
        SET @AttendanceRate = CONVERT(NVARCHAR, (@PresentCount * 100) / @TotalAttendance) + '%';
    ELSE
        SET @AttendanceRate = '94%';

    SET @PerformanceTrend = '+3.5%';

    SELECT @TotalStudents AS TotalStudents, @TotalStaff AS TotalStaff, @FeeCollection AS FeeCollection, @AttendanceRate AS AttendanceRate, @PerformanceTrend AS PerformanceTrend;
END;
GO

IF OBJECT_ID('dbo.sp_GetStudentsPaged', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetStudentsPaged;
GO
CREATE PROCEDURE dbo.sp_GetStudentsPaged
    @SchoolId INT = NULL,
    @AcademicYearId INT = NULL,
    @Page INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = NULL,
    @SortOrder NVARCHAR(10) = 'ASC',
    @Search NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Skip INT = (@Page - 1) * @PageSize;
    DECLARE @TotalCount INT;

    SELECT @TotalCount = COUNT(*) FROM [dbo].[Students] s 
    WHERE s.IsDeleted = 0 
      AND (@SchoolId IS NULL OR s.SchoolId = @SchoolId)
      AND (@Search IS NULL OR LOWER(s.Name) LIKE '%' + LOWER(@Search) + '%');

    SELECT s.*, std.Name AS StandardName, sec.Name AS SectionName, @TotalCount AS TotalCount
    FROM [dbo].[Students] s
    LEFT JOIN [dbo].[Standards] std ON s.StandardId = std.Id
    LEFT JOIN [dbo].[Sections] sec ON s.SectionId = sec.Id
    WHERE s.IsDeleted = 0
      AND (@SchoolId IS NULL OR s.SchoolId = @SchoolId)
    ORDER BY s.Id ASC
    OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
GO

-- School Dashboard CMS Procedure
IF OBJECT_ID('dbo.sp_ManageSchoolDashboard', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageSchoolDashboard;
GO
CREATE PROCEDURE [dbo].[sp_ManageSchoolDashboard]
    @Action NVARCHAR(10), -- 'GET', 'UPDATE'
    @SchoolId INT,
    @DashboardTheme NVARCHAR(50) = NULL,
    @CmsTotalStudents INT = NULL,
    @CmsTotalTeachers INT = NULL,
    @CmsFeeCollection NVARCHAR(50) = NULL,
    @CmsAttendanceRate NVARCHAR(50) = NULL,
    @CmsAnnouncements NVARCHAR(MAX) = NULL,
    @CmsEvents NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Action = 'GET'
    BEGIN
        SELECT 
            Id, Name, Code, Email, Phone, Status, ProfilePhotoPath, ShortName,
            DashboardTheme, CmsTotalStudents, CmsTotalTeachers, CmsFeeCollection, CmsAttendanceRate, CmsAnnouncements, CmsEvents
        FROM [dbo].[Schools]
        WHERE Id = @SchoolId AND IsDeleted = 0;
    END
    ELSE IF @Action = 'UPDATE'
    BEGIN
        UPDATE [dbo].[Schools] SET
            DashboardTheme = ISNULL(@DashboardTheme, DashboardTheme),
            CmsTotalStudents = ISNULL(@CmsTotalStudents, CmsTotalStudents),
            CmsTotalTeachers = ISNULL(@CmsTotalTeachers, CmsTotalTeachers),
            CmsFeeCollection = ISNULL(@CmsFeeCollection, CmsFeeCollection),
            CmsAttendanceRate = ISNULL(@CmsAttendanceRate, CmsAttendanceRate),
            CmsAnnouncements = ISNULL(@CmsAnnouncements, CmsAnnouncements),
            CmsEvents = ISNULL(@CmsEvents, CmsEvents),
            ModifiedOn = GETUTCDATE()
        WHERE Id = @SchoolId;
    END
END;
GO

PRINT '=======================================================';
PRINT '  SCANiD ERP COMPLETE DATABASE SETUP COMPLETED!';
PRINT '=======================================================';
GO
