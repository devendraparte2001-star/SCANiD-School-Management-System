-- =========================================================================
-- RE-ALIGN ATTENDANCE TABLE COLUMNS AND AUDIT TRAIL FIELDS
-- Description:
--   Ensures all Audit Trail columns ([IsActive], [IsDeleted], [CreatedBy], [CreatedOn],
--   [ModifiedBy], [ModifiedOn]) are placed at the very end of the Attendance table.
--   Safely recreates the table, copies data, restores all FK indexes,
--   and rebuilds the [sp_GetAttendance] and [sp_ManageAttendance] stored procedures.
-- =========================================================================

BEGIN TRANSACTION;
BEGIN TRY

    PRINT 'Dropping stored procedures referencing Attendance...';
    
    IF OBJECT_ID('dbo.sp_GetAttendance', 'P') IS NOT NULL 
        DROP PROCEDURE dbo.sp_GetAttendance;

    IF OBJECT_ID('dbo.sp_ManageAttendance', 'P') IS NOT NULL 
        DROP PROCEDURE dbo.sp_ManageAttendance;

    PRINT 'Dropping Attendance table foreign key constraints...';

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Attendance_Students_StudentId')
        ALTER TABLE [dbo].[Attendance] DROP CONSTRAINT [FK_Attendance_Students_StudentId];

    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Attendance_Staff_StaffId')
        ALTER TABLE [dbo].[Attendance] DROP CONSTRAINT [FK_Attendance_Staff_StaffId];

    PRINT 'Creating new Attendance table layout...';

    -- Create new Attendance table with correct column order (Audit trails at the end)
    CREATE TABLE [dbo].[Attendance_New](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [StudentId] [int] NULL,
        [StaffId] [int] NULL,
        [Date] [datetime2](7) NOT NULL,
        [Status] [nvarchar](max) NOT NULL DEFAULT (N'Present'),
        [MarkedByUserId] [int] NOT NULL DEFAULT (1),
        [UploadSource] [nvarchar](100) NOT NULL DEFAULT (N'Manual'),
        [Remarks] [nvarchar](max) NULL,
        [IsActive] [bit] NOT NULL DEFAULT (1),
        [IsDeleted] [bit] NOT NULL DEFAULT (0),
        [CreatedBy] [nvarchar](max) NULL,
        [CreatedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
        [ModifiedBy] [nvarchar](max) NULL,
        [ModifiedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
     CONSTRAINT [PK_Attendance_New] PRIMARY KEY CLUSTERED ([Id] ASC)
    );

    PRINT 'Copying data...';

    -- Copy data from original Attendance table to the temporary one
    SET IDENTITY_INSERT [dbo].[Attendance_New] ON;
    
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Attendance]') AND type in (N'U'))
    BEGIN
        INSERT INTO [dbo].[Attendance_New] (
            [Id], [StudentId], [StaffId], [Date], [Status], [MarkedByUserId], [UploadSource], [Remarks],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        )
        SELECT 
            [Id], [StudentId], [StaffId], [Date], [Status], [MarkedByUserId], [UploadSource], [Remarks],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        FROM [dbo].[Attendance];
    END;

    SET IDENTITY_INSERT [dbo].[Attendance_New] OFF;

    PRINT 'Replacing old table with new aligned table...';

    -- Drop original table [dbo].[Attendance]
    IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Attendance]') AND type in (N'U'))
    BEGIN
        DROP TABLE [dbo].[Attendance];
    END;

    -- Rename the [Attendance_New] table to [Attendance]
    EXEC sp_rename 'dbo.Attendance_New', 'Attendance';

    -- Add Primary Key naming back to PK_Attendance
    EXEC sp_rename 'dbo.PK_Attendance_New', 'PK_Attendance', 'OBJECT';

    PRINT 'Recreating Attendance foreign keys...';

    -- Recreate and add all foreign key constraints
    ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [FK_Attendance_Students_StudentId] FOREIGN KEY([StudentId]) REFERENCES [dbo].[Students] ([Id]) ON DELETE CASCADE;
    ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [FK_Attendance_Staff_StaffId] FOREIGN KEY([StaffId]) REFERENCES [dbo].[Staff] ([Id]);

    COMMIT TRANSACTION;
    PRINT 'SUCCESS: Table [dbo].[Attendance] columns realigned correctly with audit trails at the end!';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@ErrMsg, 16, 1);
END CATCH;
GO

-- Recreate sp_GetAttendance Stored Procedure
IF OBJECT_ID('dbo.sp_GetAttendance', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetAttendance;
GO
CREATE PROCEDURE dbo.sp_GetAttendance
    @Date DATETIME,
    @SchoolId INT = NULL,
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.*, s.Name AS StudentName
    FROM [dbo].[Attendance] a
    INNER JOIN [dbo].[Students] s ON a.StudentId = s.Id
    WHERE CONVERT(DATE, a.Date) = CONVERT(DATE, @Date)
      AND (@SchoolId IS NULL OR s.SchoolId = @SchoolId)
      AND (@AcademicYearId IS NULL OR s.AcademicYearId = @AcademicYearId);
END;
GO

-- Recreate sp_ManageAttendance Stored Procedure with full Student, Staff, and Audit Trail support
IF OBJECT_ID('dbo.sp_ManageAttendance', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageAttendance;
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
 OldValues, 
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
END;
GO
