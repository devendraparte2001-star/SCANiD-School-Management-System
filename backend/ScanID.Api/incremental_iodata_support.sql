-- ==========================================
-- Incremental DB Update: Iodata Attendance System support
-- ==========================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[IodataRecords]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[IodataRecords](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Rfid] [nvarchar](100) NOT NULL,
    [Date] [datetime2](7) NOT NULL,
    [InTime] [nvarchar](15) NOT NULL,
    [IsPresent] [bit] NOT NULL DEFAULT(1),
    [IsStudent] [bit] NOT NULL DEFAULT(0),
    [ShiftId] [int] NULL,
    [GrNo] [nvarchar](100) NULL,
    [MatchedName] [nvarchar](255) NULL,
    [Role] [nvarchar](50) NULL,
    [Status] [nvarchar](50) NULL,
    [PunchDate] [nvarchar](50) NULL,
    [PunchTime] [nvarchar](50) NULL,
    [MachineId] [nvarchar](50) NULL,
    [TransactionId] [nvarchar](50) NULL,
    [SchoolId] [int] NULL,
    [AcademicYearId] [int] NULL,
    [IsActive] [bit] NOT NULL DEFAULT (1),
    [IsDeleted] [bit] NOT NULL DEFAULT (0),
    [CreatedBy] [nvarchar](max) NULL,
    [CreatedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedBy] [nvarchar](max) NULL,
    [ModifiedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
 CONSTRAINT [PK_IodataRecords] PRIMARY KEY CLUSTERED ([Id] ASC)
);
END
GO

IF OBJECT_ID('dbo.sp_ProcessIodataRecord', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ProcessIodataRecord;
GO
CREATE PROCEDURE dbo.sp_ProcessIodataRecord
    @Rfid NVARCHAR(100),
    @PunchDate NVARCHAR(50),
    @PunchTime NVARCHAR(50),
    @MachineId NVARCHAR(50) = NULL,
    @TransactionId NVARCHAR(50) = NULL,
    @CreatedDateTime NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StudentId INT = NULL;
    DECLARE @StaffId INT = NULL;
    DECLARE @IsStudent BIT = 0;
    DECLARE @ShiftId INT = NULL;
    DECLARE @GrNo NVARCHAR(100) = NULL;
    DECLARE @MatchedName NVARCHAR(255) = NULL;
    DECLARE @Role NVARCHAR(50) = 'Unknown';
    DECLARE @IsPresent BIT = 1;
    DECLARE @Status NVARCHAR(50) = 'On-Time';
    DECLARE @SchoolId INT = NULL;
    DECLARE @AcademicYearId INT = NULL;
    
    -- Normalize PunchTime (double colons or weird spaces)
    SET @PunchTime = LTRIM(RTRIM(REPLACE(@PunchTime, '::', ':')));
    
    DECLARE @Date DATE = NULL;
    DECLARE @RawDateString NVARCHAR(100) = LTRIM(RTRIM(@PunchDate));

    -- Clean up trailing time components if any (e.g. "2026-06-11T08:02" or "11/06/2026 15:30")
    IF CHARINDEX(' ', @RawDateString) > 0
    BEGIN
        SET @RawDateString = SUBSTRING(@RawDateString, 1, CHARINDEX(' ', @RawDateString) - 1);
    END
    IF CHARINDEX('T', @RawDateString) > 0
    BEGIN
        SET @RawDateString = SUBSTRING(@RawDateString, 1, CHARINDEX('T', @RawDateString) - 1);
    END

    DECLARE @CleanDate NVARCHAR(50) = @RawDateString;

    -- 1. Try native casting (works for standard ISO YYYY-MM-DD)
    SET @Date = TRY_CAST(@CleanDate AS DATE);

    -- 2. Try style 112 (basic ISO: yyyyMMdd, e.g. "20260611")
    IF @Date IS NULL AND LEN(@CleanDate) = 8 AND ISNUMERIC(@CleanDate) = 1 AND (CAST(SUBSTRING(@CleanDate, 1, 4) AS INT) BETWEEN 1900 AND 2100)
    BEGIN
        SET @Date = TRY_CONVERT(DATE, @CleanDate, 112);
    END

    -- 3. Parse custom 6-digit pure numeric representation (DDMMyy, e.g. "110626" -> "11/06/26")
    IF @Date IS NULL AND LEN(@CleanDate) = 6 AND ISNUMERIC(@CleanDate) = 1
    BEGIN
        DECLARE @FormattedSixChar NVARCHAR(50) = SUBSTRING(@CleanDate, 1, 2) + '/' + SUBSTRING(@CleanDate, 3, 2) + '/' + SUBSTRING(@CleanDate, 5, 2);
        SET @Date = TRY_CONVERT(DATE, @FormattedSixChar, 103);
        IF @Date IS NULL
        BEGIN
            SET @Date = TRY_CONVERT(DATE, @FormattedSixChar, 101);
        END
    END

    -- 4. Parse custom 8-digit pure numeric representation (DDMMyyyy, e.g. "11062026" -> "11/06/2026")
    IF @Date IS NULL AND LEN(@CleanDate) = 8 AND ISNUMERIC(@CleanDate) = 1
    BEGIN
        DECLARE @FormattedEightChar NVARCHAR(50) = SUBSTRING(@CleanDate, 1, 2) + '/' + SUBSTRING(@CleanDate, 3, 2) + '/' + SUBSTRING(@CleanDate, 5, 4);
        SET @Date = TRY_CONVERT(DATE, @FormattedEightChar, 103);
        IF @Date IS NULL
        BEGIN
            SET @Date = TRY_CONVERT(DATE, @FormattedEightChar, 101);
        END
    END

    -- 5. Standard Slashed/Dashed Parsing with manual validation
    IF @Date IS NULL
    BEGIN
        -- Normalize dashes to slashes
        SET @CleanDate = REPLACE(@CleanDate, '-', '/');

        -- Handle custom punch scanner string normalization (e.g. "11/0626" -> "11/06/26" if missing second slash)
        IF CHARINDEX('/', @CleanDate) > 0 AND LEN(@CleanDate) <= 8 AND CHARINDEX('/', @CleanDate, CHARINDEX('/', @CleanDate) + 1) = 0
        BEGIN
            DECLARE @SlashOffset INT = CHARINDEX('/', @CleanDate);
            DECLARE @SecondPortionLen INT = LEN(@CleanDate) - @SlashOffset;
            IF @SecondPortionLen >= 4
            BEGIN
                SET @CleanDate = SUBSTRING(@CleanDate, 1, @SlashOffset) + SUBSTRING(@CleanDate, @SlashOffset + 1, @SecondPortionLen - 2) + '/' + SUBSTRING(@CleanDate, LEN(@CleanDate) - 1, 2);
            END
        END

        -- Try style 103 (DD/MM/YYYY) first
        SET @Date = TRY_CONVERT(DATE, @CleanDate, 103);

        -- Try style 101 (MM/DD/YYYY) fallback
        IF @Date IS NULL
        BEGIN
            SET @Date = TRY_CONVERT(DATE, @CleanDate, 101);
        END

        -- Try style 111 (YYYY/MM/DD) fallback
        IF @Date IS NULL
        BEGIN
            SET @Date = TRY_CONVERT(DATE, @CleanDate, 111);
        END
    END

    -- 6. Safety fallback to current UTC date if completely unparseable
    IF @Date IS NULL 
    BEGIN
        SET @Date = CAST(GETUTCDATE() AS DATE);
    END

    -- Look up student
    SELECT TOP 1 
        @StudentId = Id, 
        @IsStudent = 1, 
        @ShiftId = ShiftId, 
        @GrNo = ISNULL(GrNo, ''), 
        @MatchedName = Name, 
        @Role = 'Student',
        @SchoolId = SchoolId,
        @AcademicYearId = AcademicYearId
    FROM [dbo].[Students] 
    WHERE LTRIM(RTRIM(Rfid)) = LTRIM(RTRIM(@Rfid)) AND IsDeleted = 0;

    -- If not found, look up staff/teacher
    IF @StudentId IS NULL
    BEGIN
        SELECT TOP 1 
            @StaffId = s.Id, 
            @IsStudent = 0, 
            @ShiftId = s.ShiftId, 
            @GrNo = ISNULL(s.EmployeeId, ''), 
            @MatchedName = u.Name, 
            @Role = ISNULL(u.Role, 'Teacher'),
            @SchoolId = s.SchoolId,
            @AcademicYearId = s.AcademicYearId
        FROM [dbo].[Staff] s
        INNER JOIN [dbo].[Users] u ON s.UserId = u.Id
        WHERE LTRIM(RTRIM(s.Rfid)) = LTRIM(RTRIM(@Rfid)) AND s.IsDeleted = 0;
    END

    -- Default shift timings if not assigned or not found
    DECLARE @StartTime NVARCHAR(15) = '09:00';
    DECLARE @EndTime NVARCHAR(15) = '17:00';
    DECLARE @GraceInTime NVARCHAR(15) = '15';
    DECLARE @SpanInTime NVARCHAR(15) = '120';
    
    IF @ShiftId IS NOT NULL
    BEGIN
        SELECT TOP 1 
            @StartTime = ISNULL(StartTime, '09:00'),
            @EndTime = ISNULL(EndTime, '17:00'),
            @GraceInTime = ISNULL(GraceInTime, '15'),
            @SpanInTime = ISNULL(SpanInTime, '120')
        FROM [dbo].[Shifts]
        WHERE Id = @ShiftId;
    END

    DECLARE @PunchMin INT = 540;
    DECLARE @StartMin INT = 540;
    DECLARE @GraceMinVal INT = 15;
    DECLARE @SpanMinVal INT = 120;
    
    -- Parse punch minutes
    BEGIN TRY
        DECLARE @pIdx INT = CHARINDEX(':', @PunchTime);
        IF @pIdx > 0
        BEGIN
            DECLARE @pHour INT = CAST(SUBSTRING(@PunchTime, 1, @pIdx - 1) AS INT);
            DECLARE @pMin INT = CAST(SUBSTRING(@PunchTime, @pIdx + 1, LEN(@PunchTime)) AS INT);
            SET @PunchMin = @pHour * 60 + @pMin;
        END
    END TRY
    BEGIN CATCH
        SET @PunchMin = 540;
    END CATCH;

    -- Parse start minutes
    BEGIN TRY
        DECLARE @sIdx INT = CHARINDEX(':', @StartTime);
        IF @sIdx > 0
        BEGIN
            DECLARE @sHour INT = CAST(SUBSTRING(@StartTime, 1, @sIdx - 1) AS INT);
            DECLARE @sMin INT = CAST(SUBSTRING(@StartTime, @sIdx + 1, LEN(@StartTime)) AS INT);
            SET @StartMin = @sHour * 60 + @sMin;
        END
    END TRY
    BEGIN CATCH
        SET @StartMin = 540;
    END CATCH;

    -- Grace Minutes Configuration
    BEGIN TRY
        SET @GraceMinVal = CAST(@GraceInTime AS INT);
    END TRY
    BEGIN CATCH
        SET @GraceMinVal = 15;
    END CATCH;

    -- Span Minutes Configuration
    BEGIN TRY
        SET @SpanMinVal = CAST(@SpanInTime AS INT);
    END TRY
    BEGIN CATCH
        SET @SpanMinVal = 120;
    END CATCH;

    -- Compare punch time with grace and span constraints & map to master table codes
    DECLARE @StatusCode NVARCHAR(20) = 'P';
    IF @PunchMin < @StartMin - 30
    BEGIN
        SET @StatusCode = 'EG';
    END
    ELSE IF @PunchMin <= @StartMin + @GraceMinVal
    BEGIN
        SET @StatusCode = 'P';
    END
    ELSE IF @PunchMin <= @StartMin + @SpanMinVal
    BEGIN
        SET @StatusCode = 'PL';
    END
    ELSE
    BEGIN
        SET @StatusCode = 'PVL';
    END

    -- Retrieve active dynamic display status name from FRS AttendanceStatuses master table
    SELECT TOP 1 @Status = Name 
    FROM [dbo].[AttendanceStatuses] 
    WHERE Code = @StatusCode AND IsDeleted = 0 AND IsActive = 1;

    -- Failback to offline standards if the master table is not queried successfully
    IF @Status IS NULL
    BEGIN
        SET @Status = CASE @StatusCode 
            WHEN 'EG' THEN 'Early' 
            WHEN 'P' THEN 'On-Time' 
            WHEN 'PL' THEN 'Late' 
            ELSE 'Very Late' 
        END;
    END

    -- Upsert raw parsed entry into IodataRecords
    MERGE [dbo].[IodataRecords] AS target
    USING (SELECT @Rfid AS Rfid, @Date AS [Date], @PunchTime AS InTime) AS source
    ON (target.Rfid = source.Rfid AND CONVERT(DATE, target.[Date]) = source.[Date] AND target.InTime = source.InTime)
    WHEN MATCHED THEN
        UPDATE SET 
            IsPresent = @IsPresent,
            IsStudent = @IsStudent,
            ShiftId = @ShiftId,
            GrNo = @GrNo,
            MatchedName = @MatchedName,
            Role = @Role,
            Status = @Status,
            PunchDate = @PunchDate,
            PunchTime = @PunchTime,
            MachineId = @MachineId,
            TransactionId = @TransactionId,
            SchoolId = @SchoolId,
            AcademicYearId = @AcademicYearId,
            ModifiedOn = GETUTCDATE()
    WHEN NOT MATCHED THEN
        INSERT (Rfid, [Date], InTime, IsPresent, IsStudent, ShiftId, GrNo, MatchedName, Role, Status, PunchDate, PunchTime, MachineId, TransactionId, SchoolId, AcademicYearId, CreatedOn, ModifiedOn, IsActive, IsDeleted)
        VALUES (@Rfid, @Date, @PunchTime, @IsPresent, @IsStudent, @ShiftId, @GrNo, @MatchedName, @Role, @Status, @PunchDate, @PunchTime, @MachineId, @TransactionId, @SchoolId, @AcademicYearId, GETUTCDATE(), GETUTCDATE(), 1, 0);

    -- Sync to Core Student/Staff Attendance registers dynamically using the retrieved master status 
    DECLARE @AttStatus NVARCHAR(100) = @Status;

    IF @StudentId IS NOT NULL
    BEGIN
        EXEC dbo.sp_ManageAttendance @StudentId = @StudentId, @Date = @Date, @Status = @AttStatus, @Remarks = @Status, @CreatedBy = 'IodataService', @StaffId = NULL, @MarkedByUserId = 1, @UploadSource = 'IodataService';
    END
    ELSE IF @StaffId IS NOT NULL
    BEGIN
        EXEC dbo.sp_ManageAttendance @StudentId = NULL, @Date = @Date, @Status = @AttStatus, @Remarks = @Status, @CreatedBy = 'IodataService', @StaffId = @StaffId, @MarkedByUserId = 1, @UploadSource = 'IodataService';
    END

    -- Return the processed result
    SELECT TOP 1 * FROM [dbo].[IodataRecords] 
    WHERE Rfid = @Rfid AND CONVERT(DATE, [Date]) = @Date AND InTime = @PunchTime;
END;
GO

IF OBJECT_ID('dbo.sp_GetIodataRecords', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetIodataRecords;
GO
CREATE PROCEDURE dbo.sp_GetIodataRecords
    @Date DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * 
    FROM [dbo].[IodataRecords]
    WHERE (@Date IS NULL OR CONVERT(DATE, [Date]) = CONVERT(DATE, @Date))
    ORDER BY [Date] DESC, InTime DESC;
END;
GO

IF OBJECT_ID('dbo.sp_GetIodataRecordsPaged', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetIodataRecordsPaged;
GO
CREATE PROCEDURE dbo.sp_GetIodataRecordsPaged
    @Date DATETIME = NULL,
    @Page INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 10;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    WITH FilteredRecords AS (
        SELECT *
        FROM [dbo].[IodataRecords]
        WHERE (@Date IS NULL OR CONVERT(DATE, [Date]) = CONVERT(DATE, @Date))
    ),
    Total AS (
        SELECT COUNT_BIG(*) AS TotalCount FROM FilteredRecords
    )
    SELECT r.*, t.TotalCount
    FROM FilteredRecords r
    CROSS JOIN Total t
    ORDER BY r.[Date] DESC, r.[InTime] DESC, r.[Id] DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
