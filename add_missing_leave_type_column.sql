-- =========================================================================
-- SCANiD ERP System Schema Alignment Migration Script
-- Purpose: Safely adds missing LeaveType column to the [LeaveApplications]
--          table under Microsoft SQL Server.
-- =========================================================================

USE ScanID_DB;
GO

-- Ensure the LeaveApplications table exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LeaveApplications]') AND type in (N'U'))
BEGIN
    -- Add LeaveType
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[LeaveApplications]') AND name = 'LeaveType')
    BEGIN
        ALTER TABLE [dbo].[LeaveApplications] ADD [LeaveType] NVARCHAR(50) NULL CONSTRAINT [DF_LeaveApplications_LeaveType] DEFAULT ('L');
        PRINT 'Added column [LeaveType] to [LeaveApplications]';
    END
    ELSE
    BEGIN
        PRINT 'Column [LeaveType] already exists in [LeaveApplications].';
    END

    PRINT 'Schema update for table [LeaveApplications] completed successfully.';
END
ELSE
BEGIN
    PRINT 'Error: [LeaveApplications] table does not exist in the database.';
END
GO
