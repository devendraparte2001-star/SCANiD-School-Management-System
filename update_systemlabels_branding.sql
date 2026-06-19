-- ==========================================
-- SCANiD System Labels & Custom Branding Migration
-- ==========================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SystemLabels]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SystemLabels](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Key] [nvarchar](255) NOT NULL UNIQUE,
        [DefaultValue] [nvarchar](max) NOT NULL,
        [CustomizedValue] [nvarchar](max) NOT NULL,
        [Category] [nvarchar](100) NOT NULL DEFAULT (N'General'),
        [IsActive] [bit] NOT NULL DEFAULT ((1)),
        [IsDeleted] [bit] NOT NULL DEFAULT ((0)),
        [CreatedBy] [nvarchar](255) NULL,
        [CreatedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
        [ModifiedBy] [nvarchar](255) NULL,
        [ModifiedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
        [SchoolId] [int] NULL,
        [AcademicYearId] [int] NULL,
     CONSTRAINT [PK_SystemLabels] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

-- Seeding Default Core System Taxonomy and Customized Branding Configurations
-- Using MERGE to safely insert or retain values without duplicates
MERGE INTO [dbo].[SystemLabels] AS Target
USING (VALUES 
    (N'student', N'Student', N'Student', N'Student Records'),
    (N'students', N'Students', N'Students', N'Student Records'),
    (N'staff', N'Staff/Faculty', N'Staff/Faculty', N'Staff Records'),
    (N'staffs', N'Staff & Faculty', N'Staff & Faculty', N'Staff Records'),
    (N'standard', N'Class/Standard', N'Class/Standard', N'Academic Structure'),
    (N'section', N'Section/Division', N'Section/Division', N'Academic Structure'),
    (N'grNo', N'GR No', N'GR No', N'Identifiers'),
    (N'rollNo', N'Roll No', N'Roll No', N'Identifiers'),
    (N'employeeId', N'Employee Code', N'Employee Code', N'Identifiers'),
    (N'academicYear', N'Academic Year', N'Academic Year', N'Academic Structure'),
    (N'logoTextPrimary', N'SCAN', N'SCAN', N'Branding & Identity'),
    (N'logoTextSecondary', N'iD', N'iD', N'Branding & Identity'),
    (N'logoSubtitle', N'SCANiD SYSTEMS PVT. LTD.', N'SCANiD SYSTEMS PVT. LTD.', N'Branding & Identity'),
    (N'loginHeading', N'Member Login', N'Member Login', N'Branding & Identity'),
    (N'loginSubtext', N'Institutional Multi-Branch Control Portal', N'Institutional Multi-Branch Control Portal', N'Branding & Identity'),
    (N'logoImage', N'', N'', N'Branding & Identity')
) AS Source ([Key], DefaultValue, CustomizedValue, Category)
ON Target.[Key] = Source.[Key]
WHEN NOT MATCHED THEN
    INSERT ([Key], DefaultValue, CustomizedValue, Category, IsActive, IsDeleted, CreatedOn, ModifiedOn)
    VALUES (Source.[Key], Source.DefaultValue, Source.CustomizedValue, Source.Category, 1, 0, GETUTCDATE(), GETUTCDATE());
GO

-- =========================================================================
-- Dedicated Stored Procedure: Read System Label Customizations/Branding
-- =========================================================================
IF OBJECT_ID('dbo.sp_GetSystemLabels', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetSystemLabels;
GO
CREATE PROCEDURE dbo.sp_GetSystemLabels
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Id], [Key], [DefaultValue], [CustomizedValue], [Category], [IsActive], [IsDeleted], [CreatedOn], [ModifiedOn]
    FROM [dbo].[SystemLabels] 
    WHERE [IsDeleted] = 0;
END;
GO

-- =========================================================================
-- Dedicated Stored Procedure: Update / Save a single system label or value
-- =========================================================================
IF OBJECT_ID('dbo.sp_SaveSystemLabel', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_SaveSystemLabel;
GO
CREATE PROCEDURE dbo.sp_SaveSystemLabel
    @Key NVARCHAR(255),
    @CustomizedValue NVARCHAR(MAX),
    @ModifiedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM [dbo].[SystemLabels] WHERE [Key] = @Key)
    BEGIN
        UPDATE [dbo].[SystemLabels]
        SET [CustomizedValue] = @CustomizedValue,
            [ModifiedOn] = GETUTCDATE(),
            [ModifiedBy] = @ModifiedBy
        WHERE [Key] = @Key;
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[SystemLabels] ([Key], [DefaultValue], [CustomizedValue], [Category], [IsActive], [IsDeleted], [CreatedOn], [ModifiedOn], [CreatedBy])
        VALUES (@Key, @CustomizedValue, @CustomizedValue, N'General', 1, 0, GETUTCDATE(), GETUTCDATE(), @ModifiedBy);
    END
END;
GO

-- =========================================================================
-- Dedicated Stored Procedure: Bulk Save System Labels via JSON parameter
-- =========================================================================
IF OBJECT_ID('dbo.sp_BulkSaveSystemLabels', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_BulkSaveSystemLabels;
GO
CREATE PROCEDURE dbo.sp_BulkSaveSystemLabels
    @JsonData NVARCHAR(MAX),
    @ModifiedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Parse JSON list & update matched keys or insert unmatched keys
    MERGE INTO [dbo].[SystemLabels] AS Target
    USING (
        SELECT [key], [customizedValue]
        FROM OPENJSON(@JsonData)
        WITH (
            [key] NVARCHAR(255) '$.key',
            [customizedValue] NVARCHAR(MAX) '$.customizedValue'
        )
    ) AS Source
    ON Target.[Key] = Source.[key]
    WHEN MATCHED THEN
        UPDATE SET 
            Target.[CustomizedValue] = Source.[customizedValue],
            Target.[ModifiedOn] = GETUTCDATE(),
            Target.[ModifiedBy] = @ModifiedBy
    WHEN NOT MATCHED THEN
        INSERT ([Key], [DefaultValue], [CustomizedValue], [Category], [IsActive], [IsDeleted], [CreatedOn], [ModifiedOn], [CreatedBy])
        VALUES (Source.[key], Source.[customizedValue], Source.[customizedValue], N'General', 1, 0, GETUTCDATE(), GETUTCDATE(), @CreatedBy);
END;
GO

-- =========================================================================
-- Supporting Master Procedures whitelist extension to enable standard CRUD
-- =========================================================================
IF OBJECT_ID('dbo.sp_GetMasterData', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetMasterData;
GO
CREATE PROCEDURE dbo.sp_GetMasterData
    @TableName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @SQL NVARCHAR(MAX);
    IF @TableName IN ('Standards', 'Sections', 'AcademicYears', 'Castes', 'Religions', 'Categories', 'SchoolSections', 'States', 'BloodGroups', 'Houses', 'AdmissionTypes', 'Shifts', 'SubCastes', 'Cities', 'Subjects', 'ExamTypes', 'Designations', 'Occupations', 'SystemLabels')
    BEGIN
        SET @SQL = N'SELECT * FROM [dbo].[' + @TableName + N'] WHERE [IsDeleted] = 0';
        EXEC sp_executesql @SQL;
    END
    ELSE
    BEGIN
        RAISERROR('Invalid Master Table Name', 16, 1);
    END
END;
GO
