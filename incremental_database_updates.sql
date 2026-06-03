-- =========================================================================
-- SYSTEM INCREMENTAL UPDATE SCRIPT
-- Purpose: Ensures the presence of SchoolSections, States, and Cities master tables
-- Date: May 23, 2026
-- =========================================================================

-- 1. States table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[States]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[States](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [nvarchar](100) NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_States_IsActive] DEFAULT (1),
    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_States_IsDeleted] DEFAULT (0),
    [CreatedBy] [nvarchar](max) NULL,
    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_States_CreatedOn] DEFAULT (GETUTCDATE()),
    [ModifiedBy] [nvarchar](max) NULL,
    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_States_ModifiedOn] DEFAULT (GETUTCDATE()),
 CONSTRAINT [PK_States] PRIMARY KEY CLUSTERED ([Id] ASC)
);

-- Seed Initial States
INSERT INTO [dbo].[States] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn])
VALUES 
(N'MAHARASHTRA', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(N'DELHI', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(N'KARNATAKA', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
END;
GO

-- 2. Cities table (includes FK safety checks)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Cities]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Cities](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [StateId] [int] NOT NULL,
    [Name] [nvarchar](100) NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_Cities_IsActive] DEFAULT (1),
    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Cities_IsDeleted] DEFAULT (0),
    [CreatedBy] [nvarchar](max) NULL,
    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Cities_CreatedOn] DEFAULT (GETUTCDATE()),
    [ModifiedBy] [nvarchar](max) NULL,
    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Cities_ModifiedOn] DEFAULT (GETUTCDATE()),
 CONSTRAINT [PK_Cities] PRIMARY KEY CLUSTERED ([Id] ASC),
 CONSTRAINT [FK_Cities_States] FOREIGN KEY([StateId]) REFERENCES [dbo].[States] ([Id])
);

-- Seed Initial Cities
INSERT INTO [dbo].[Cities] ([StateId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn])
VALUES 
(1, N'Mumbai', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(1, N'Pune', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(2, N'New Delhi', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
END;
GO

-- 3. SchoolSections table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SchoolSections]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[SchoolSections](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [nvarchar](100) NOT NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DF_SchoolSections_IsActive] DEFAULT (1),
    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_SchoolSections_IsDeleted] DEFAULT (0),
    [CreatedBy] [nvarchar](max) NULL,
    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_SchoolSections_CreatedOn] DEFAULT (GETUTCDATE()),
    [ModifiedBy] [nvarchar](max) NULL,
    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_SchoolSections_ModifiedOn] DEFAULT (GETUTCDATE()),
 CONSTRAINT [PK_SchoolSections] PRIMARY KEY CLUSTERED ([Id] ASC)
);

-- Seed Initial School Sections
INSERT INTO [dbo].[SchoolSections] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn])
VALUES 
(N'Primary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(N'Secondary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(N'Higher Secondary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
END;
GO

-- 4. Add DigitalUniform and DigitalNotebook fields to Students table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'DigitalUniform')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [DigitalUniform] [bit] NOT NULL CONSTRAINT [DF_Students_DigitalUniform] DEFAULT (0);
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'DigitalNotebook')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [DigitalNotebook] [bit] NOT NULL CONSTRAINT [DF_Students_DigitalNotebook] DEFAULT (0);
    END;

    -- Self-Healing: Safe recovery check for all standard columns if they were dropped in a prior interrupted run
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'IsActive')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [IsActive] [bit] NOT NULL CONSTRAINT [DF_Students_IsActive] DEFAULT (1);
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'IsDeleted')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Students_IsDeleted] DEFAULT (0);
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'CreatedBy')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [CreatedBy] [nvarchar](max) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'CreatedOn')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Students_CreatedOn] DEFAULT (GETUTCDATE());
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'ModifiedBy')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [ModifiedBy] [nvarchar](max) NULL;
    END;

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'ModifiedOn')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Students_ModifiedOn] DEFAULT (GETUTCDATE());
    END;
END;
GO

-- 5. Recreate execution wrapper to support Digital features in sp_ManageStudent
IF OBJECT_ID('dbo.sp_ManageStudent', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageStudent;
GO
CREATE PROCEDURE dbo.sp_ManageStudent
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE', 'PHOTO'
    @Id INT = NULL,
    @RegistrationNumber NVARCHAR(100) = NULL,
    @Name NVARCHAR(100) = NULL,
    @SchoolId INT = NULL,
    @StandardId INT = NULL,
    @SectionId INT = NULL,
    @AcademicYearId INT = NULL,
    @RollNumber INT = NULL,
    @GrNo NVARCHAR(100) = NULL,
    @Gender NVARCHAR(50) = NULL,
    @DateOfBirth NVARCHAR(50) = NULL,
    @CategoryId INT = NULL,
    @ReligionId INT = NULL,
    @CasteId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @FatherContactNo NVARCHAR(200) = NULL,
    @Address NVARCHAR(500) = NULL,
    @MotherName NVARCHAR(100) = NULL,
    @AadharCard NVARCHAR(100) = NULL,
    @Rfid NVARCHAR(100) = NULL,
    @ShiftId INT = NULL,
    @BloodGroupId INT = NULL,
    @HouseId INT = NULL,
    @Sms BIT = 0,
    @UniformId NVARCHAR(500) = NULL,
    @MotherContactNo NVARCHAR(200) = NULL,
    @ProfilePhotoPath NVARCHAR(255) = NULL,
    @SchoolSectionId INT = NULL,
    @AdmissionDate NVARCHAR(200) = NULL,
    @Email NVARCHAR(255) = NULL,
    @CityId INT = NULL,
    @StateId INT = NULL,
    @IsStateBoard BIT = 0,
    @DigitalUniform BIT = 0,
    @DigitalNotebook BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            IF @RegistrationNumber IS NULL
            BEGIN
                SET @RegistrationNumber = 'REG-' + UPPER(LEFT(REPLACE(CAST(NEWID() as NVARCHAR(36)), '-', ''), 8));
            END

            INSERT INTO [dbo].[Students] (
                RegistrationNumber, Name, SchoolId, StandardId, SectionId, AcademicYearId, RollNumber, 
                GrNo, Gender, DateOfBirth, CategoryId, ReligionId, CasteId, Status, FatherContactNo, Address, 
                MotherName, AadharCard, Rfid, ShiftId, BloodGroupId, HouseId, Sms, UniformId,
                MotherContactNo, ProfilePhotoPath, SchoolSectionId, AdmissionDate, Email, CityId, StateId, IsStateBoard, DigitalUniform, DigitalNotebook, IsActive, IsDeleted, CreatedOn, ModifiedOn
            ) VALUES (
                @RegistrationNumber, @Name, @SchoolId, @StandardId, @SectionId, @AcademicYearId, @RollNumber,
                @GrNo, @Gender, @DateOfBirth, @CategoryId, @ReligionId, @CasteId, @Status, @FatherContactNo, @Address,
                @MotherName, @AadharCard, @Rfid, @ShiftId, @BloodGroupId, @HouseId, @Sms, @UniformId,
                @MotherContactNo, @ProfilePhotoPath, @SchoolSectionId, @AdmissionDate, @Email, @CityId, @StateId, @IsStateBoard, @DigitalUniform, @DigitalNotebook, 1, 0, GETUTCDATE(), GETUTCDATE()
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Students] SET
                RegistrationNumber = ISNULL(@RegistrationNumber, RegistrationNumber),
                Name = ISNULL(@Name, Name),
                SchoolId = ISNULL(@SchoolId, SchoolId),
                StandardId = ISNULL(@StandardId, StandardId),
                SectionId = ISNULL(@SectionId, SectionId),
                AcademicYearId = ISNULL(@AcademicYearId, AcademicYearId),
                RollNumber = ISNULL(@RollNumber, RollNumber),
                GrNo = ISNULL(@GrNo, GrNo),
                Gender = ISNULL(@Gender, Gender),
                DateOfBirth = ISNULL(@DateOfBirth, DateOfBirth),
                CategoryId = ISNULL(@CategoryId, CategoryId),
                ReligionId = ISNULL(@ReligionId, ReligionId),
                CasteId = ISNULL(@CasteId, CasteId),
                Status = ISNULL(@Status, Status),
                FatherContactNo = ISNULL(@FatherContactNo, FatherContactNo),
                Address = ISNULL(@Address, Address),
                MotherName = ISNULL(@MotherName, MotherName),
                AadharCard = ISNULL(@AadharCard, AadharCard),
                Rfid = ISNULL(@Rfid, Rfid),
                ShiftId = ISNULL(@ShiftId, ShiftId),
                BloodGroupId = ISNULL(@BloodGroupId, BloodGroupId),
                HouseId = ISNULL(@HouseId, HouseId),
                Sms = ISNULL(@Sms, Sms),
                UniformId = ISNULL(@UniformId, UniformId),
                MotherContactNo = ISNULL(@MotherContactNo, MotherContactNo),
                ProfilePhotoPath = ISNULL(@ProfilePhotoPath, ProfilePhotoPath),
                SchoolSectionId = ISNULL(@SchoolSectionId, SchoolSectionId),
                AdmissionDate = ISNULL(@AdmissionDate, AdmissionDate),
                Email = ISNULL(@Email, Email),
                CityId = ISNULL(@CityId, CityId),
                StateId = ISNULL(@StateId, StateId),
                IsStateBoard = ISNULL(@IsStateBoard, IsStateBoard),
                DigitalUniform = ISNULL(@DigitalUniform, DigitalUniform),
                DigitalNotebook = ISNULL(@DigitalNotebook, DigitalNotebook),
                ModifiedOn = GETUTCDATE()
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            UPDATE [dbo].[Students] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
        END
        ELSE IF @Action = 'PHOTO'
        BEGIN
            UPDATE [dbo].[Students] SET ProfilePhotoPath = @ProfilePhotoPath, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 6. Move IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn to the end of the Students table (Consistency Standard)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    -- Drop dependent search/filter indexes if they already exist, to avoid preventing table/column modifications
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics_Filters' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        DROP INDEX [IX_Students_School_Academics_Filters] ON [dbo].[Students];
    END;

    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_Name_Search' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        DROP INDEX [IX_Students_Name_Search] ON [dbo].[Students];
    END;

    -- Only run relocation if IsActive exists and is not already near the last columns
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'IsActive')
    BEGIN
        -- 1. Create temp columns to temporarily hold values safely preserving database registry integrity
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'Temp_IsActive')
        BEGIN
            ALTER TABLE [dbo].[Students] ADD [Temp_IsActive] [bit] NULL;
            ALTER TABLE [dbo].[Students] ADD [Temp_IsDeleted] [bit] NULL;
            ALTER TABLE [dbo].[Students] ADD [Temp_CreatedBy] [nvarchar](max) NULL;
            ALTER TABLE [dbo].[Students] ADD [Temp_CreatedOn] [datetime2](7) NULL;
            ALTER TABLE [dbo].[Students] ADD [Temp_ModifiedBy] [nvarchar](max) NULL;
            ALTER TABLE [dbo].[Students] ADD [Temp_ModifiedOn] [datetime2](7) NULL;
        END;

        -- 2. Preserve active records audit data
        EXEC('UPDATE [dbo].[Students] SET 
            [Temp_IsActive] = [IsActive],
            [Temp_IsDeleted] = [IsDeleted],
            [Temp_CreatedBy] = [CreatedBy],
            [Temp_CreatedOn] = [CreatedOn],
            [Temp_ModifiedBy] = [ModifiedBy],
            [Temp_ModifiedOn] = [ModifiedOn]');

        -- 3. Dynamic Drop of existing default constraints to allow column removal
        DECLARE @ConstraintName NVARCHAR(200);

        -- IsActive Default
        SELECT @ConstraintName = d.name 
        FROM sys.default_constraints d 
        JOIN sys.columns c ON d.parent_column_id = c.column_id 
        WHERE d.parent_object_id = OBJECT_ID('dbo.Students') AND c.name = 'IsActive';
        IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Students] DROP CONSTRAINT [' + @ConstraintName + ']');

        -- IsDeleted Default
        SET @ConstraintName = NULL;
        SELECT @ConstraintName = d.name 
        FROM sys.default_constraints d 
        JOIN sys.columns c ON d.parent_column_id = c.column_id 
        WHERE d.parent_object_id = OBJECT_ID('dbo.Students') AND c.name = 'IsDeleted';
        IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Students] DROP CONSTRAINT [' + @ConstraintName + ']');

        -- CreatedOn Default
        SET @ConstraintName = NULL;
        SELECT @ConstraintName = d.name 
        FROM sys.default_constraints d 
        JOIN sys.columns c ON d.parent_column_id = c.column_id 
        WHERE d.parent_object_id = OBJECT_ID('dbo.Students') AND c.name = 'CreatedOn';
        IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Students] DROP CONSTRAINT [' + @ConstraintName + ']');

        -- ModifiedOn Default
        SET @ConstraintName = NULL;
        SELECT @ConstraintName = d.name 
        FROM sys.default_constraints d 
        JOIN sys.columns c ON d.parent_column_id = c.column_id 
        WHERE d.parent_object_id = OBJECT_ID('dbo.Students') AND c.name = 'ModifiedOn';
        IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE [dbo].[Students] DROP CONSTRAINT [' + @ConstraintName + ']');

        -- 4. Drop original columns physically re-indexing the table layout
        ALTER TABLE [dbo].[Students] DROP COLUMN [IsActive];
        ALTER TABLE [dbo].[Students] DROP COLUMN [IsDeleted];
        ALTER TABLE [dbo].[Students] DROP COLUMN [CreatedBy];
        ALTER TABLE [dbo].[Students] DROP COLUMN [CreatedOn];
        ALTER TABLE [dbo].[Students] DROP COLUMN [ModifiedBy];
        ALTER TABLE [dbo].[Students] DROP COLUMN [ModifiedOn];

        -- 5. Add columns back (this appends them under any recently added fields like DigitalUniform, DigitalNotebook)
        ALTER TABLE [dbo].[Students] ADD [IsActive] [bit] NOT NULL CONSTRAINT [DF_Students_IsActive] DEFAULT (1);
        ALTER TABLE [dbo].[Students] ADD [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Students_IsDeleted] DEFAULT (0);
        ALTER TABLE [dbo].[Students] ADD [CreatedBy] [nvarchar](max) NULL;
        ALTER TABLE [dbo].[Students] ADD [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Students_CreatedOn] DEFAULT (GETUTCDATE());
        ALTER TABLE [dbo].[Students] ADD [ModifiedBy] [nvarchar](max) NULL;
        ALTER TABLE [dbo].[Students] ADD [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Students_ModifiedOn] DEFAULT (GETUTCDATE());

        -- 6. Restore data from temporary structures
        EXEC('UPDATE [dbo].[Students] SET 
            [IsActive] = COALESCE([Temp_IsActive], 1),
            [IsDeleted] = COALESCE([Temp_IsDeleted], 0),
            [CreatedBy] = [Temp_CreatedBy],
            [CreatedOn] = COALESCE([Temp_CreatedOn], GETUTCDATE()),
            [ModifiedBy] = [Temp_ModifiedBy],
            [ModifiedOn] = COALESCE([Temp_ModifiedOn], GETUTCDATE())');

        -- 7. Prune temporary columns cleanly
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_IsActive];
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_IsDeleted];
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_CreatedBy];
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_CreatedOn];
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_ModifiedBy];
        ALTER TABLE [dbo].[Students] DROP COLUMN [Temp_ModifiedOn];
    END;
END;
GO

-- =========================================================================
-- 7. High-Performance Database Indexing Strategy (Scalability Up To 90 Lakhs+ Records)
-- =========================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    -- Ensure columns have precise, non-MAX types for indexing compatibility in SQL Server
    ALTER TABLE [dbo].[Students] ALTER COLUMN [RegistrationNumber] NVARCHAR(100) NOT NULL;
    ALTER TABLE [dbo].[Students] ALTER COLUMN [GrNo] NVARCHAR(100) NULL;

    -- High Performance Composite Filter Index matching GetStudents queries
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics_Filters' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Students_School_Academics_Filters] 
        ON [dbo].[Students] ([SchoolId], [AcademicYearId], [StandardId], [SectionId], [IsDeleted])
        INCLUDE ([Id], [RegistrationNumber], [Name], [RollNumber], [GrNo]);
    END;

    -- High Performance Index for Fast Dynamic Searching by Student details and GrNo
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_Name_Search' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        CREATE NONCLUSTERED INDEX [IX_Students_Name_Search] 
        ON [dbo].[Students] ([GrNo], [RegistrationNumber], [RollNumber])
        INCLUDE ([Name]);
    END;
END;
GO

-- =========================================================================
-- 8. Remove Redundant Temporaries From Staff Table
-- =========================================================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
BEGIN
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_IsActive')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_IsActive];
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_IsDeleted')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_IsDeleted];
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_CreatedBy')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_CreatedBy];
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_CreatedOn')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_CreatedOn];
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_ModifiedBy')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_ModifiedBy];
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_ModifiedOn')
        ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_ModifiedOn];
END;
GO

-- =========================================================================
-- 9. Add Categories, Sessions, Batches, Exam Types, Designations, Occupations, Staff Initials to Navigation Master
-- =========================================================================
-- First delete them so this is idempotent (to avoid key collisions on reruns)
DELETE FROM [dbo].[NavigationRoles] WHERE [NavigationItemId] IN (24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42);
DELETE FROM [dbo].[NavigationItems] WHERE [Id] IN (24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42);

-- Re-enable IDENTITY INSERT on NavigationItems for precise custom sequentials
SET IDENTITY_INSERT [dbo].[NavigationItems] ON;

-- Re-Insert Standard and New items
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(24, N'Manage Users', N'UserPlus', N'/configuration/users', 6, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(25, N'General Masters', N'Database', NULL, 11, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(26, N'Religion Master', N'Heart', N'/configuration/religions', 25, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(27, N'Blood Group Master', N'Droplets', N'/configuration/blood-groups', 25, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(28, N'Caste Category', N'Users', N'/configuration/castes', 25, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(29, N'Sub-Caste Master', N'UserCircle', N'/configuration/sub-castes', 25, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(30, N'School House', N'Home', N'/configuration/houses', 25, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(31, N'Admission Types', N'UserCheck', N'/configuration/admission-types', 25, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(32, N'States Master', N'Map', N'/configuration/states', 25, 7, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(33, N'Cities Master', N'MapPin', N'/configuration/cities', 25, 8, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(34, N'School Sections', N'Layers', N'/configuration/school-sections', 25, 9, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(35, N'Shift Timetable', N'Clock', N'/configuration/shifts', 25, 10, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(36, N'Category Master', N'LayoutGrid', N'/configuration/categories', 25, 11, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(37, N'Session Master', N'Clock', N'/configuration/sessions', 25, 12, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(38, N'Batch Master', N'Users', N'/configuration/batches', 25, 13, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(39, N'Exam Type Master', N'Award', N'/configuration/exam-types', 25, 14, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(40, N'Designation Master', N'Briefcase', N'/configuration/designations', 25, 15, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(41, N'Occupation Master', N'Hammer', N'/configuration/occupations', 25, 16, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(42, N'Staff Initials', N'UserRound', N'/configuration/staff-initials', 25, 17, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;

-- Assign to Roles (1 = Super Admin, 2 = Admin)
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
(24, 1), (24, 2),
(25, 1), (25, 2),
(26, 1), (26, 2),
(27, 1), (27, 2),
(28, 1), (28, 2),
(29, 1), (29, 2),
(30, 1), (30, 2),
(31, 1), (31, 2),
(32, 1), (32, 2),
(33, 1), (33, 2),
(34, 1), (34, 2),
(35, 1), (35, 2),
(36, 1), (36, 2),
(37, 1), (37, 2),
(38, 1), (38, 2),
(39, 1), (39, 2),
(40, 1), (40, 2),
(41, 1), (41, 2),
(42, 1), (42, 2);
GO


