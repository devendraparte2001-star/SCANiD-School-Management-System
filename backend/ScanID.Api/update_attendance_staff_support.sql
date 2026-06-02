-- Incremental DB Update: Attendance Module Staff Support, Auditing and MarkedByUserId validations
-- This fully updates the [dbo].[Attendance] table and [dbo].[sp_ManageAttendance] stored procedure.

-- 1. Ensure Attendance Table supports Nullable StudentId, Nullable StaffId, default MarkedByUserId, and UploadSource
IF OBJECT_ID('FK_Attendance_Students_StudentId', 'F') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Attendance] DROP CONSTRAINT [FK_Attendance_Students_StudentId];
END
GO

IF OBJECT_ID('FK_Attendance_Staff_StaffId', 'F') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Attendance] DROP CONSTRAINT [FK_Attendance_Staff_StaffId];
END
GO

-- Safe alteration of StudentId to NULL
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance' AND COLUMN_NAME = 'StudentId')
BEGIN
    ALTER TABLE [dbo].[Attendance] ALTER COLUMN [StudentId] INT NULL;
END
GO

-- Add StaffId if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance' AND COLUMN_NAME = 'StaffId')
BEGIN
    ALTER TABLE [dbo].[Attendance] ADD [StaffId] INT NULL;
END
GO

-- Add UploadSource if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance' AND COLUMN_NAME = 'UploadSource')
BEGIN
    ALTER TABLE [dbo].[Attendance] ADD [UploadSource] NVARCHAR(100) NOT NULL DEFAULT 'Manual';
END
GO

-- Add Remarks if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance' AND COLUMN_NAME = 'Remarks')
BEGIN
    ALTER TABLE [dbo].[Attendance] ADD [Remarks] NVARCHAR(255) NULL;
END
GO

-- Ensure MarkedByUserId exists and is NOT NULL with a default of 1
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Attendance' AND COLUMN_NAME = 'MarkedByUserId')
BEGIN
    -- Ensure any existing nulls (if altered) are filled
    EXEC('UPDATE [dbo].[Attendance] SET [MarkedByUserId] = 1 WHERE [MarkedByUserId] IS NULL');
    ALTER TABLE [dbo].[Attendance] ALTER COLUMN [MarkedByUserId] INT NOT NULL;
    
    -- Add Default Constraint to ensure no NULL can ever be inserted
    IF NOT EXISTS (SELECT * FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID('dbo.Attendance') AND col_name(parent_object_id, parent_column_id) = 'MarkedByUserId')
    BEGIN
        ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [DF_Attendance_MarkedByUserId] DEFAULT (1) FOR [MarkedByUserId];
    END
END
GO

-- Recreate Foreign Key Constraints
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [FK_Attendance_Students_StudentId] FOREIGN KEY([StudentId]) REFERENCES [dbo].[Students] ([Id]);
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
BEGIN
    ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [FK_Attendance_Staff_StaffId] FOREIGN KEY([StaffId]) REFERENCES [dbo].[Staff] ([Id]);
END
GO


-- 2. Clean and Upgraded [dbo].[sp_ManageAttendance]
IF OBJECT_ID('dbo.sp_ManageAttendance', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ManageAttendance;
GO

CREATE PROCEDURE dbo.sp_ManageAttendance
    @StudentId INT = NULL,
    @Date DATETIME,
    @Status NVARCHAR(50),
    @Remarks NVARCHAR(255) = NULL,
    @CreatedBy NVARCHAR(100) = NULL,
    @StaffId INT = NULL,
    @MarkedByUserId INT = 1,
    @UploadSource NVARCHAR(100) = 'Manual'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Safety validation fallback
    IF @MarkedByUserId IS NULL SET @MarkedByUserId = 1;
    IF @UploadSource IS NULL SET @UploadSource = 'Manual';

    DECLARE @NewValues NVARCHAR(MAX);
    DECLARE @OldValues NVARCHAR(MAX);
    DECLARE @AttendanceId INT;
    DECLARE @IsUpdate BIT = 0;

    -- CASE 1: Student Attendance
    IF @StudentId IS NOT NULL
    BEGIN
        -- Capture old state if exists
        SELECT TOP 1 
            @OldValues = '{ "StudentId": ' + CAST(StudentId AS VARCHAR(10)) + ', "Status": "' + ISNULL(Status, 'None') + '", "Source": "' + ISNULL(UploadSource, 'Unknown') + '" }',
            @AttendanceId = Id,
            @IsUpdate = 1
        FROM [dbo].[Attendance]
        WHERE StudentId = @StudentId AND CONVERT(DATE, Date) = CONVERT(DATE, @Date) AND IsDeleted = 0;

        MERGE [dbo].[Attendance] AS target
        USING (SELECT @StudentId AS StudentId, CONVERT(DATE, @Date) AS AttendanceDate) AS source
        ON (target.StudentId = source.StudentId AND CONVERT(DATE, target.Date) = source.AttendanceDate AND target.IsDeleted = 0)
        WHEN MATCHED THEN
            UPDATE SET 
                Status = @Status, 
                Remarks = @Remarks,
                UploadSource = @UploadSource,
                MarkedByUserId = @MarkedByUserId,
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@CreatedBy, 'System')
        WHEN NOT MATCHED THEN
            INSERT (StudentId, StaffId, Date, Status, Remarks, UploadSource, MarkedByUserId, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy, IsActive, IsDeleted)
            VALUES (@StudentId, NULL, @Date, @Status, @Remarks, @UploadSource, @MarkedByUserId, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System'), 1, 0);

        IF @IsUpdate = 0
            SET @AttendanceId = SCOPE_IDENTITY();

        -- Audit trail logging
        SET @NewValues = '{ "StudentId": ' + CAST(@StudentId AS VARCHAR(10)) + ', "Status": "' + @Status + '", "Date": "' + CONVERT(VARCHAR(19), @Date, 120) + '", "Source": "' + @UploadSource + '" }';
        
        INSERT INTO [dbo].[AuditLogs] (UserId, Type, TableName, DateTime, OldValues, NewValues, PrimaryKey)
        VALUES (
            CAST(@MarkedByUserId AS NVARCHAR(100)), 
            CASE WHEN @IsUpdate = 1 THEN 'Attendance Update' ELSE 'Attendance Create' END, 
            'Attendance', 
            GETUTCDATE(), 
            @OldValues, 
            @NewValues, 
            CAST(@AttendanceId AS NVARCHAR(100))
        );
    END

    -- CASE 2: Staff Attendance
    ELSE IF @StaffId IS NOT NULL
    BEGIN
        -- Capture old state if exists
        SELECT TOP 1 
            @OldValues = '{ "StaffId": ' + CAST(StaffId AS VARCHAR(10)) + ', "Status": "' + ISNULL(Status, 'None') + '", "Source": "' + ISNULL(UploadSource, 'Unknown') + '" }',
            @AttendanceId = Id,
            @IsUpdate = 1
        FROM [dbo].[Attendance]
        WHERE StaffId = @StaffId AND CONVERT(DATE, Date) = CONVERT(DATE, @Date) AND IsDeleted = 0;

        MERGE [dbo].[Attendance] AS target
        USING (SELECT @StaffId AS StaffId, CONVERT(DATE, @Date) AS AttendanceDate) AS source
        ON (target.StaffId = source.StaffId AND CONVERT(DATE, target.Date) = source.AttendanceDate AND target.IsDeleted = 0)
        WHEN MATCHED THEN
            UPDATE SET 
                Status = @Status, 
                Remarks = @Remarks,
                UploadSource = @UploadSource,
                MarkedByUserId = @MarkedByUserId,
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@CreatedBy, 'System')
        WHEN NOT MATCHED THEN
            INSERT (StudentId, StaffId, Date, Status, Remarks, UploadSource, MarkedByUserId, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy, IsActive, IsDeleted)
            VALUES (NULL, @StaffId, @Date, @Status, @Remarks, @UploadSource, @MarkedByUserId, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System'), 1, 0);

        IF @IsUpdate = 0
            SET @AttendanceId = SCOPE_IDENTITY();

        -- Audit trail logging
        SET @NewValues = '{ "StaffId": ' + CAST(@StaffId AS VARCHAR(10)) + ', "Status": "' + @Status + '", "Date": "' + CONVERT(VARCHAR(19), @Date, 120) + '", "Source": "' + @UploadSource + '" }';
        
        INSERT INTO [dbo].[AuditLogs] (UserId, Type, TableName, DateTime, OldValues, NewValues, PrimaryKey)
        VALUES (
            CAST(@MarkedByUserId AS NVARCHAR(100)), 
            CASE WHEN @IsUpdate = 1 THEN 'Attendance Update' ELSE 'Attendance Create' END, 
            'Attendance', 
            GETUTCDATE(), 
            @OldValues, 
            @NewValues, 
            CAST(@AttendanceId AS NVARCHAR(100))
        );
    END
END
GO
