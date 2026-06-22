-- =========================================================================
-- SCANiD ERP System Schema Alignment Migration Script
-- Purpose: Safely adds missing CMS dashboard columns and representation CityName/StateName 
--          fields to the [Schools] table under Microsoft SQL Server.
-- =========================================================================

USE ScanID_DB;
GO

-- Ensure the Schools table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND type in (N'U'))
BEGIN
    -- Add CityName
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CityName')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CityName] NVARCHAR(200) NULL;
        PRINT 'Added column [CityName] to [Schools]';
    END

    -- Add StateName
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'StateName')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [StateName] NVARCHAR(200) NULL;
        PRINT 'Added column [StateName] to [Schools]';
    END

    -- Add DashboardTheme
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'DashboardTheme')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [DashboardTheme] NVARCHAR(50) NULL;
        PRINT 'Added column [DashboardTheme] to [Schools]';
    END

    -- Add CmsTotalStudents
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsTotalStudents')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsTotalStudents] INT NULL;
        PRINT 'Added column [CmsTotalStudents] to [Schools]';
    END

    -- Add CmsTotalTeachers
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsTotalTeachers')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsTotalTeachers] INT NULL;
        PRINT 'Added column [CmsTotalTeachers] to [Schools]';
    END

    -- Add CmsFeeCollection
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsFeeCollection')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsFeeCollection] NVARCHAR(50) NULL;
        PRINT 'Added column [CmsFeeCollection] to [Schools]';
    END

    -- Add CmsAttendanceRate
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsAttendanceRate')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsAttendanceRate] NVARCHAR(50) NULL;
        PRINT 'Added column [CmsAttendanceRate] to [Schools]';
    END

    -- Add CmsAnnouncements
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsAnnouncements')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsAnnouncements] NVARCHAR(MAX) NULL;
        PRINT 'Added column [CmsAnnouncements] to [Schools]';
    END

    -- Add CmsEvents
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Schools]') AND name = 'CmsEvents')
    BEGIN
        ALTER TABLE [dbo].[Schools] ADD [CmsEvents] NVARCHAR(MAX) NULL;
        PRINT 'Added column [CmsEvents] to [Schools]';
    END

    PRINT 'Schema update for table [Schools] completed successfully.';
END
ELSE
BEGIN
    PRINT 'Error: [Schools] table does not exist in the database.';
END
GO
