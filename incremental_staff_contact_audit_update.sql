-- =========================================================================================
-- INCREMENTAL DATABASE MIGRATION SCRIPT: STAFF RENAME DETAILS & AUDIT COLUMNS REALIGNMENT
-- Replaces ContactNumber with PersonalContact, Contact2 with EmergencyContact,
-- and shifts all audit trail columns (IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn) to the end.
-- =========================================================================================

-- 1. Rename columns if they exist
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ContactNumber')
BEGIN
    EXEC sp_rename 'dbo.Staff.ContactNumber', 'PersonalContact', 'COLUMN';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Contact2')
BEGIN
    EXEC sp_rename 'dbo.Staff.Contact2', 'EmergencyContact', 'COLUMN';
END
GO

-- 2. Move Audit Trail Columns to the End of the Staff Table for Architectural Consistency
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
BEGIN
    -- Create temp table with all audit columns
    IF OBJECT_ID('tempdb..#TempStaffAudit') IS NOT NULL DROP TABLE #TempStaffAudit;
    
    CREATE TABLE #TempStaffAudit (
        Id INT PRIMARY KEY,
        IsActive BIT,
        IsDeleted BIT,
        CreatedBy NVARCHAR(MAX),
        CreatedOn DATETIME2(7),
        ModifiedBy NVARCHAR(MAX),
        ModifiedOn DATETIME2(7)
    );

    -- Dynamically insert existing values
    DECLARE @SelectSql NVARCHAR(MAX) = 'INSERT INTO #TempStaffAudit (Id, IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn) SELECT Id';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'IsActive')
        SET @SelectSql = @SelectSql + ', IsActive';
    ELSE
        SET @SelectSql = @SelectSql + ', 1';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'IsDeleted')
        SET @SelectSql = @SelectSql + ', IsDeleted';
    ELSE
        SET @SelectSql = @SelectSql + ', 0';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CreatedBy')
        SET @SelectSql = @SelectSql + ', CreatedBy';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CreatedOn')
        SET @SelectSql = @SelectSql + ', CreatedOn';
    ELSE
        SET @SelectSql = @SelectSql + ', GETUTCDATE()';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ModifiedBy')
        SET @SelectSql = @SelectSql + ', ModifiedBy';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ModifiedOn')
        SET @SelectSql = @SelectSql + ', ModifiedOn';
    ELSE
        SET @SelectSql = @SelectSql + ', GETUTCDATE()';

    SET @SelectSql = @SelectSql + ' FROM [dbo].[Staff]';

    EXEC sp_executesql @SelectSql;

    -- Drop default constraints to allow column removal dynamically
    DECLARE @DropConstraintsSql NVARCHAR(MAX) = '';
    SELECT @DropConstraintsSql = @DropConstraintsSql + 'ALTER TABLE [dbo].[Staff] DROP CONSTRAINT [' + d.name + '];' + CHAR(13) + CHAR(10)
    FROM sys.default_constraints d
    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
    WHERE d.parent_object_id = OBJECT_ID('dbo.Staff')
      AND c.name IN ('IsActive', 'IsDeleted', 'CreatedBy', 'CreatedOn', 'ModifiedBy', 'ModifiedOn');

    IF @DropConstraintsSql <> ''
    BEGIN
        EXEC sp_executesql @DropConstraintsSql;
    END;

    -- Drop original columns dynamically if they exist
    DECLARE @DropColumnsSql NVARCHAR(MAX) = 'ALTER TABLE [dbo].[Staff] DROP COLUMN ';
    DECLARE @ColumnsToDrop NVARCHAR(MAX) = '';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'IsActive')
        SET @ColumnsToDrop = @ColumnsToDrop + '[IsActive],';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'IsDeleted')
        SET @ColumnsToDrop = @ColumnsToDrop + '[IsDeleted],';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CreatedBy')
        SET @ColumnsToDrop = @ColumnsToDrop + '[CreatedBy],';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CreatedOn')
        SET @ColumnsToDrop = @ColumnsToDrop + '[CreatedOn],';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ModifiedBy')
        SET @ColumnsToDrop = @ColumnsToDrop + '[ModifiedBy],';

    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ModifiedOn')
        SET @ColumnsToDrop = @ColumnsToDrop + '[ModifiedOn],';

    IF @ColumnsToDrop <> ''
    BEGIN
        SET @ColumnsToDrop = LEFT(@ColumnsToDrop, LEN(@ColumnsToDrop) - 1);
        SET @DropColumnsSql = @DropColumnsSql + @ColumnsToDrop;
        EXEC sp_executesql @DropColumnsSql;
    END;

    -- Append columns back cleanly at the physical end of the block/record dynamically
    EXEC('
    ALTER TABLE [dbo].[Staff] ADD [IsActive] [bit] NOT NULL CONSTRAINT [DF_Staff_IsActive] DEFAULT (1);
    ALTER TABLE [dbo].[Staff] ADD [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Staff_IsDeleted] DEFAULT (0);
    ALTER TABLE [dbo].[Staff] ADD [CreatedBy] [nvarchar](max) NULL;
    ALTER TABLE [dbo].[Staff] ADD [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Staff_CreatedOn] DEFAULT (GETUTCDATE());
    ALTER TABLE [dbo].[Staff] ADD [ModifiedBy] [nvarchar](max) NULL;
    ALTER TABLE [dbo].[Staff] ADD [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Staff_ModifiedOn] DEFAULT (GETUTCDATE());
    ');

    -- Restore data from temporary structures
    EXEC('
    UPDATE s SET 
        s.[IsActive] = COALESCE(t.[IsActive], 1),
        s.[IsDeleted] = COALESCE(t.[IsDeleted], 0),
        s.[CreatedBy] = t.[CreatedBy],
        s.[CreatedOn] = COALESCE(t.[CreatedOn], GETUTCDATE()),
        s.[ModifiedBy] = t.[ModifiedBy],
        s.[ModifiedOn] = COALESCE(t.[ModifiedOn], GETUTCDATE())
    FROM [dbo].[Staff] s
    INNER JOIN #TempStaffAudit t ON s.Id = t.Id;
    ');

    -- Clean up temporary table
    IF OBJECT_ID('tempdb..#TempStaffAudit') IS NOT NULL DROP TABLE #TempStaffAudit;
END;
GO


-- 3. Recreate SQL Stored Procedures to accurately reference PersonalContact and EmergencyContact

IF OBJECT_ID('dbo.sp_GetStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetStaff;
GO
CREATE PROCEDURE dbo.sp_GetStaff
    @SchoolId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.*, u.Name AS UserName, u.Email AS UserEmail, u.RoleId AS RoleId,
           bg.Name AS BloodGroupName, r.Name AS ReligionName, c.Name AS CasteName,
           sc.Name AS SubCasteName, cat.Name AS CategoryName, ct.Name AS CityName,
           st.Name AS StateName, sh.Name AS ShiftName, std.Name AS StandardName, sec.Name AS SectionName
    FROM [dbo].[Staff] s
    LEFT JOIN [dbo].[Users] u ON s.UserId = u.Id
    LEFT JOIN [dbo].[BloodGroups] bg ON s.BloodGroupId = bg.Id
    LEFT JOIN [dbo].[Religions] r ON s.ReligionId = r.Id
    LEFT JOIN [dbo].[Castes] c ON s.CasteId = c.Id
    LEFT JOIN [dbo].[SubCastes] sc ON s.SubCasteId = sc.Id
    LEFT JOIN [dbo].[Categories] cat ON s.CategoryId = cat.Id
    LEFT JOIN [dbo].[Cities] ct ON s.CityId = ct.Id
    LEFT JOIN [dbo].[States] st ON s.StateId = st.Id
    LEFT JOIN [dbo].[Shifts] sh ON s.ShiftId = sh.Id
    LEFT JOIN [dbo].[Standards] std ON s.StandardId = std.Id
    LEFT JOIN [dbo].[Sections] sec ON s.SectionId = sec.Id
    WHERE s.IsDeleted = 0
      AND (@SchoolId IS NULL OR s.SchoolId = @SchoolId);
END;
GO


IF OBJECT_ID('dbo.sp_GetStaffPaged', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_GetStaffPaged;
GO
CREATE PROCEDURE dbo.sp_GetStaffPaged
    @SchoolId INT = NULL,
    @AcademicYearId INT = NULL,
    @Page INT = 1,
    @PageSize INT = 10,
    @SortBy NVARCHAR(50) = NULL,
    @SortOrder NVARCHAR(10) = 'ASC',
    @Search NVARCHAR(255) = NULL,
    @Status NVARCHAR(50) = NULL,
    @Subject NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    WITH FilteredStaff AS (
        SELECT s.*, u.Name AS UserName, u.Email AS UserEmail, u.RoleId AS RoleId,
               bg.Name AS BloodGroupName, r.Name AS ReligionName, c.Name AS CasteName,
               sc.Name AS SubCasteName, cat.Name AS CategoryName, ct.Name AS CityName,
               st.Name AS StateName, sh.Name AS ShiftName, std.Name AS StandardName, sec.Name AS SectionName
        FROM [dbo].[Staff] s
        LEFT JOIN [dbo].[Users] u ON s.UserId = u.Id
        LEFT JOIN [dbo].[BloodGroups] bg ON s.BloodGroupId = bg.Id
        LEFT JOIN [dbo].[Religions] r ON s.ReligionId = r.Id
        LEFT JOIN [dbo].[Castes] c ON s.CasteId = c.Id
        LEFT JOIN [dbo].[SubCastes] sc ON s.SubCasteId = sc.Id
        LEFT JOIN [dbo].[Categories] cat ON s.CategoryId = cat.Id
        LEFT JOIN [dbo].[Cities] ct ON s.CityId = ct.Id
        LEFT JOIN [dbo].[States] st ON s.StateId = st.Id
        LEFT JOIN [dbo].[Shifts] sh ON s.ShiftId = sh.Id
        LEFT JOIN [dbo].[Standards] std ON s.StandardId = std.Id
        LEFT JOIN [dbo].[Sections] sec ON s.SectionId = sec.Id
        WHERE s.IsDeleted = 0
          AND (@SchoolId IS NULL OR s.SchoolId = @SchoolId)
          AND (@Status IS NULL OR @Status = '' OR @Status = 'all' OR s.Status = @Status)
          AND (@Subject IS NULL OR @Subject = '' OR @Subject = 'all' OR s.Subject = @Subject)
          AND (@Search IS NULL OR @Search = '' OR 
               u.Name LIKE '%' + @Search + '%' OR 
               u.Email LIKE '%' + @Search + '%' OR 
               s.PersonalContact LIKE '%' + @Search + '%' OR 
               s.EmergencyContact LIKE '%' + @Search + '%' OR 
               s.Qualification LIKE '%' + @Search + '%' OR 
               s.Department LIKE '%' + @Search + '%' OR 
               s.Subject LIKE '%' + @Search + '%' OR 
               s.EmployeeId LIKE '%' + @Search + '%')
    ),
    Total AS (
        SELECT COUNT_BIG(*) AS TotalCount FROM FilteredStaff
    )
    SELECT fs.*, tot.TotalCount
    FROM FilteredStaff fs
    CROSS JOIN Total tot
    ORDER BY
        CASE WHEN UPPER(@SortOrder) = 'ASC' AND LOWER(@SortBy) = 'name' THEN fs.UserName END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND LOWER(@SortBy) = 'name' THEN fs.UserName END DESC,

        CASE WHEN UPPER(@SortOrder) = 'ASC' AND LOWER(@SortBy) = 'email' THEN fs.UserEmail END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND LOWER(@SortBy) = 'email' THEN fs.UserEmail END DESC,

        CASE WHEN UPPER(@SortOrder) = 'ASC' AND LOWER(@SortBy) = 'phone' THEN fs.PersonalContact END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND LOWER(@SortBy) = 'phone' THEN fs.PersonalContact END DESC,

        CASE WHEN UPPER(@SortOrder) = 'ASC' AND LOWER(@SortBy) = 'employeeid' THEN fs.EmployeeId END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND LOWER(@SortBy) = 'employeeid' THEN fs.EmployeeId END DESC,

        CASE WHEN UPPER(@SortOrder) = 'ASC' AND (@SortBy IS NULL OR @SortBy = '') THEN fs.UserName END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND (@SortBy IS NULL OR @SortBy = '') THEN fs.UserName END DESC
    OFFSET (@Page - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO


IF OBJECT_ID('dbo.sp_ManageStaff', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageStaff;
GO
CREATE PROCEDURE dbo.sp_ManageStaff
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE'
    @Id INT = NULL,
    @UserId INT = NULL,
    @SchoolId INT = NULL,
    @EmployeeId NVARCHAR(255) = NULL,
    @Initials NVARCHAR(50) = NULL,
    @Department NVARCHAR(100) = NULL,
    @Qualification NVARCHAR(100) = NULL,
    @PersonalContact NVARCHAR(50) = NULL,
    @EmergencyContact NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = NULL,
    @ProfilePhotoPath NVARCHAR(255) = NULL,
    @Experience NVARCHAR(100) = NULL,
    @Subject NVARCHAR(200) = NULL,
    @StandardId INT = NULL,
    @SectionId INT = NULL,
    @IsClassTeacher BIT = 0,
    @Gender NVARCHAR(50) = NULL,
    @DateOfBirth DATETIME2(7) = NULL,
    @BloodGroupId INT = NULL,
    @RetirementDate DATETIME2(7) = NULL,
    @ReligionId INT = NULL,
    @CasteId INT = NULL,
    @SubCasteId INT = NULL,
    @CategoryId INT = NULL,
    @DateOfJoining DATETIME2(7) = NULL,
    @Address NVARCHAR(MAX) = NULL,
    @CityId INT = NULL,
    @StateId INT = NULL,
    @BioId NVARCHAR(100) = NULL,
    @Rfid NVARCHAR(100) = NULL,
    @ShiftId INT = NULL,
    @CreatedBy NVARCHAR(255) = NULL,
    @ModifiedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            INSERT INTO [dbo].[Staff] (
                UserId, SchoolId, EmployeeId, Initials, Department, Qualification, PersonalContact, EmergencyContact, Status, ProfilePhotoPath, 
                Experience, Subject, StandardId, SectionId, IsClassTeacher, Gender, DateOfBirth, BloodGroupId, RetirementDate, 
                ReligionId, CasteId, SubCasteId, CategoryId, DateOfJoining, Address, CityId, StateId, BioId, Rfid, ShiftId,
                IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
            ) VALUES (
                @UserId, ISNULL(@SchoolId, 1), ISNULL(@EmployeeId, ''), @Initials, @Department, @Qualification, @PersonalContact, @EmergencyContact, ISNULL(@Status, 'Active'), @ProfilePhotoPath,
                @Experience, @Subject, @StandardId, @SectionId, ISNULL(@IsClassTeacher, 0), @Gender, @DateOfBirth, @BloodGroupId, @RetirementDate,
                @ReligionId, @CasteId, @SubCasteId, @CategoryId, @DateOfJoining, @Address, @CityId, @StateId, @BioId, @Rfid, @ShiftId,
                1, 0, @CreatedBy, GETUTCDATE(), @CreatedBy, GETUTCDATE()
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Staff] SET
                UserId = CASE WHEN @UserId IS NULL OR @UserId <= 0 THEN UserId ELSE @UserId END,
                SchoolId = ISNULL(@SchoolId, SchoolId),
                EmployeeId = ISNULL(@EmployeeId, EmployeeId),
                Initials = ISNULL(@Initials, Initials),
                Department = ISNULL(@Department, Department),
                Qualification = ISNULL(@Qualification, Qualification),
                PersonalContact = ISNULL(@PersonalContact, PersonalContact),
                EmergencyContact = ISNULL(@EmergencyContact, EmergencyContact),
                Status = ISNULL(@Status, Status),
                ProfilePhotoPath = ISNULL(@ProfilePhotoPath, ProfilePhotoPath),
                Experience = ISNULL(@Experience, Experience),
                Subject = ISNULL(@Subject, Subject),
                StandardId = ISNULL(@StandardId, StandardId),
                SectionId = ISNULL(@SectionId, SectionId),
                IsClassTeacher = ISNULL(@IsClassTeacher, IsClassTeacher),
                Gender = ISNULL(@Gender, Gender),
                DateOfBirth = ISNULL(@DateOfBirth, DateOfBirth),
                BloodGroupId = ISNULL(@BloodGroupId, BloodGroupId),
                RetirementDate = ISNULL(@RetirementDate, RetirementDate),
                ReligionId = ISNULL(@ReligionId, ReligionId),
                CasteId = ISNULL(@CasteId, CasteId),
                SubCasteId = ISNULL(@SubCasteId, SubCasteId),
                CategoryId = ISNULL(@CategoryId, CategoryId),
                DateOfJoining = ISNULL(@DateOfJoining, DateOfJoining),
                Address = ISNULL(@Address, Address),
                CityId = ISNULL(@CityId, CityId),
                StateId = ISNULL(@StateId, StateId),
                BioId = ISNULL(@BioId, BioId),
                Rfid = ISNULL(@Rfid, Rfid),
                ShiftId = ISNULL(@ShiftId, ShiftId),
                ModifiedBy = @ModifiedBy,
                ModifiedOn = GETUTCDATE()
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            UPDATE [dbo].[Staff] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
            DECLARE @LinkedUserId INT;
            SELECT @LinkedUserId = UserId FROM [dbo].[Staff] WHERE Id = @Id;
            IF @LinkedUserId IS NOT NULL
            BEGIN
                UPDATE [dbo].[Users] SET IsDeleted = 1, ModifiedOn = GETUTCDATE() WHERE Id = @LinkedUserId;
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;
        THROW;
    END CATCH
END;
GO
