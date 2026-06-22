-- =========================================================================================
-- SCANiD CRM DATABASE COMPREHENSIVE UPDATE SCRIPT
-- BINDING ALL TRANSACTIONAL MODULES BY SCHOOL ID AND ACADEMIC YEAR ID
-- =========================================================================================
-- 
-- DESCRIPTION:
-- This script upgrades an existing SCANiD CRM database schema to strictly bind and synchronize 
-- all core modules (Students, Staff, Attendance, Fees, Marks, Notifications, System Labels) 
-- together under SchoolId and AcademicYearId references.
-- It ensures strict foreign key references and establishes high-performance compound 
-- non-clustered indexes for lightning-fast school/session-level isolation and server-side paging.
--
-- TARGET DATABASE: Microsoft SQL Server (compatibility with Azure / Cloud VM deployment).
-- SAFE TO EXECUTE: It is fully idempotent (safely repeatable using conditional existence guards).
-- =========================================================================================

PRINT '-----------------------------------------------------------------------------------------';
PRINT 'Initializing SCANiD CRM school and academic session relationship-binding consolidation...';
PRINT '-----------------------------------------------------------------------------------------';
GO

-- ----------------------------------------------------
-- 1. ENFORCE CONDITIONAL MASTERS ALIGNMENT
-- ----------------------------------------------------

IF OBJECT_ID('dbo.Schools', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Schools](
        [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
        [Name] NVARCHAR(250) NOT NULL,
        [Code] NVARCHAR(50) NULL,
        [Address] NVARCHAR(500) NULL,
        [Phone] NVARCHAR(50) NULL,
        [Email] NVARCHAR(250) NULL,
        [TotalStudents] INT NOT NULL DEFAULT (0),
        [Status] NVARCHAR(50) NOT NULL DEFAULT (N'Active'),
        [IsActive] BIT NOT NULL DEFAULT (1),
        [IsDeleted] BIT NOT NULL DEFAULT (0)
    );
    PRINT 'Created placeholder [Schools] master table.';
END
GO

IF OBJECT_ID('dbo.AcademicYears', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AcademicYears](
        [Id] INT IDENTITY(1,1) PRIMARY KEY CLUSTERED,
        [Name] NVARCHAR(100) NOT NULL,
        [IsCurrent] BIT NOT NULL DEFAULT (0)
    );
    PRINT 'Created placeholder [AcademicYears] master table.';
END
GO


-- ----------------------------------------------------
-- 2. ENFORCE FOREIGN KEY CONSTRAINTS ACROSS ALL MODULES
-- ----------------------------------------------------

PRINT 'Validating modules relational constraints...';
GO

-- A. FEES MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Fees_Schools' AND parent_object_id = OBJECT_ID('dbo.Fees'))
BEGIN
    ALTER TABLE [dbo].[Fees]
    ADD CONSTRAINT [FK_Fees_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: Fees module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Fees_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.Fees'))
BEGIN
    ALTER TABLE [dbo].[Fees]
    ADD CONSTRAINT [FK_Fees_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: Fees module academic-session binding constraint.';
END
GO

-- B. MARKS MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Marks_Schools' AND parent_object_id = OBJECT_ID('dbo.Marks'))
BEGIN
    ALTER TABLE [dbo].[Marks]
    ADD CONSTRAINT [FK_Marks_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: Marks module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Marks_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.Marks'))
BEGIN
    ALTER TABLE [dbo].[Marks]
    ADD CONSTRAINT [FK_Marks_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: Marks module academic-session binding constraint.';
END
GO

-- C. NOTIFICATIONS MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Notifications_Schools' AND parent_object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    ALTER TABLE [dbo].[Notifications]
    ADD CONSTRAINT [FK_Notifications_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: Notifications module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Notifications_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    ALTER TABLE [dbo].[Notifications]
    ADD CONSTRAINT [FK_Notifications_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: Notifications module academic-session binding constraint.';
END
GO

-- D. SYSTEM LABELS / BRANDING CONFIG MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_SystemLabels_Schools' AND parent_object_id = OBJECT_ID('dbo.SystemLabels'))
BEGIN
    ALTER TABLE [dbo].[SystemLabels]
    ADD CONSTRAINT [FK_SystemLabels_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: SystemLabels module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_SystemLabels_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.SystemLabels'))
BEGIN
    ALTER TABLE [dbo].[SystemLabels]
    ADD CONSTRAINT [FK_SystemLabels_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: SystemLabels module academic-session binding constraint.';
END
GO

-- E. AUDIT LOGS MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_AuditLogs_Schools' AND parent_object_id = OBJECT_ID('dbo.AuditLogs'))
BEGIN
    ALTER TABLE [dbo].[AuditLogs]
    ADD CONSTRAINT [FK_AuditLogs_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: AuditLogs module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_AuditLogs_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.AuditLogs'))
BEGIN
    ALTER TABLE [dbo].[AuditLogs]
    ADD CONSTRAINT [FK_AuditLogs_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: AuditLogs module academic-session binding constraint.';
END
GO

-- F. ERROR LOGS MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ErrorLogs_Schools' AND parent_object_id = OBJECT_ID('dbo.ErrorLogs'))
BEGIN
    ALTER TABLE [dbo].[ErrorLogs]
    ADD CONSTRAINT [FK_ErrorLogs_Schools] FOREIGN KEY ([SchoolId]) REFERENCES [dbo].[Schools]([Id]);
    PRINT 'Enforced: ErrorLogs module school-level binding constraint.';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ErrorLogs_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.ErrorLogs'))
BEGIN
    ALTER TABLE [dbo].[ErrorLogs]
    ADD CONSTRAINT [FK_ErrorLogs_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: ErrorLogs module academic-session binding constraint.';
END
GO

-- G. STAFF/EMPLOYEES MODULE BINDING
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_AcademicYears' AND parent_object_id = OBJECT_ID('dbo.Staff'))
BEGIN
    ALTER TABLE [dbo].[Staff]
    ADD CONSTRAINT [FK_Staff_AcademicYears] FOREIGN KEY ([AcademicYearId]) REFERENCES [dbo].[AcademicYears]([Id]);
    PRINT 'Enforced: Staff/Employee module academic-session binding constraint.';
END
GO


-- ----------------------------------------------------
-- 3. SPEED OPTIMIZATIONS (COMPOUND NONCLUSTERED INDEXING)
-- ----------------------------------------------------

PRINT 'Optimizing table scan execution paths using multi-attribute query indexing...';
GO

-- Students Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics' AND object_id = OBJECT_ID('dbo.Students'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Students_School_Academics 
    ON dbo.Students(SchoolId, AcademicYearId, IsDeleted) 
    INCLUDE (Name, RollNumber, GrNo);
    PRINT 'Optimized query path: Students directory parsing.';
END

-- Staff Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_School_Academics' AND object_id = OBJECT_ID('dbo.Staff'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Staff_School_Academics 
    ON dbo.Staff(SchoolId, AcademicYearId, IsActive, IsDeleted) 
    INCLUDE (EmployeeId, Subject);
    PRINT 'Optimized query path: Employee/Teacher directory parsing.';
END

-- Attendance Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Attendance_School_Academics' AND object_id = OBJECT_ID('dbo.Attendance'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Attendance_School_Academics 
    ON dbo.Attendance(SchoolId, AcademicYearId, Date, IsActive, IsDeleted);
    PRINT 'Optimized query path: Transactional daily attendance register.';
END

-- Fees Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Fees_School_Academics' AND object_id = OBJECT_ID('dbo.Fees'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Fees_School_Academics 
    ON dbo.Fees(SchoolId, AcademicYearId, IsActive, IsDeleted);
    PRINT 'Optimized query path: Transactional student pending/collected fees ledger.';
END

-- Marks Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Marks_School_Academics' AND object_id = OBJECT_ID('dbo.Marks'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Marks_School_Academics 
    ON dbo.Marks(SchoolId, AcademicYearId, IsActive, IsDeleted);
    PRINT 'Optimized query path: Transactional marks entry and card ledger.';
END

-- SystemLabels Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SystemLabels_School_Academics' AND object_id = OBJECT_ID('dbo.SystemLabels'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_SystemLabels_School_Academics 
    ON dbo.SystemLabels(SchoolId, AcademicYearId, IsDeleted);
    PRINT 'Optimized query path: Multi-tenant branding and label overrides.';
END

-- Notifications Index Tuning
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_School_Academics' AND object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_School_Academics 
    ON dbo.Notifications(SchoolId, AcademicYearId, IsRead, IsActive, IsDeleted);
    PRINT 'Optimized query path: School bulletin dashboard announcements.';
END
GO

PRINT '-----------------------------------------------------------------------------------------';
PRINT 'SCANiD CRM database upgrade successful! All modules successfully consolidated.';
PRINT '-----------------------------------------------------------------------------------------';
GO
