-- =========================================================================================
-- INCREMENTAL DATABASE MIGRATION SCRIPT: STAFF MANAGEMENT REFLECTION
-- Renames Teachers to Staff and adds comprehensive legacy form fields and relationships.
-- =========================================================================================

-- 1. Rename Teachers Table to Staff Table
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Teachers]') AND type in (N'U'))
BEGIN
    EXEC sp_rename 'dbo.Teachers', 'Staff';
END
GO

-- 2. Rename PK Constraint if needed
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'PK_Teachers' AND object_id = OBJECT_ID(N'[dbo].[Staff]'))
BEGIN
    EXEC sp_rename 'dbo.Staff.PK_Teachers', 'PK_Staff', 'INDEX';
END
GO

-- 3. Add Legacy Form Extra Columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Initials')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [Initials] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Contact2')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [Contact2] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'IsClassTeacher')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [IsClassTeacher] BIT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Gender')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [Gender] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'DateOfBirth')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [DateOfBirth] DATETIME2(7) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'BloodGroupId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [BloodGroupId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'RetirementDate')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [RetirementDate] DATETIME2(7) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ReligionId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [ReligionId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CasteId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [CasteId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'SubCasteId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [SubCasteId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CategoryId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [CategoryId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'DateOfJoining')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [DateOfJoining] DATETIME2(7) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Address')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [Address] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'CityId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [CityId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'StateId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [StateId] INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'BioId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [BioId] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Rfid')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [Rfid] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'ShiftId')
BEGIN
    ALTER TABLE [dbo].[Staff] ADD [ShiftId] INT NULL;
END
GO


-- 4. Apply Referential Integrity Constraints on the Expanded Staff Entity
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_BloodGroups_BloodGroupId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_BloodGroups_BloodGroupId] FOREIGN KEY([BloodGroupId]) REFERENCES [dbo].[BloodGroups]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_Religions_ReligionId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_Religions_ReligionId] FOREIGN KEY([ReligionId]) REFERENCES [dbo].[Religions]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_Castes_CasteId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_Castes_CasteId] FOREIGN KEY([CasteId]) REFERENCES [dbo].[Castes]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_SubCastes_SubCasteId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_SubCastes_SubCasteId] FOREIGN KEY([SubCasteId]) REFERENCES [dbo].[SubCastes]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_Categories_CategoryId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_Categories_CategoryId] FOREIGN KEY([CategoryId]) REFERENCES [dbo].[Categories]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_Cities_CityId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_Cities_CityId] FOREIGN KEY([CityId]) REFERENCES [dbo].[Cities]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_States_StateId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_States_StateId] FOREIGN KEY([StateId]) REFERENCES [dbo].[States]([Id]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Staff_Shifts_ShiftId')
    ALTER TABLE [dbo].[Staff] ADD CONSTRAINT [FK_Staff_Shifts_ShiftId] FOREIGN KEY([ShiftId]) REFERENCES [dbo].[Shifts]([Id]);
GO


-- 5. Stored Procedures: Staff Directory & Operation Logic
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
               s.ContactNumber LIKE '%' + @Search + '%' OR 
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

        CASE WHEN UPPER(@SortOrder) = 'ASC' AND LOWER(@SortBy) = 'phone' THEN fs.ContactNumber END ASC,
        CASE WHEN UPPER(@SortOrder) = 'DESC' AND LOWER(@SortBy) = 'phone' THEN fs.ContactNumber END DESC,

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
    @ContactNumber NVARCHAR(50) = NULL,
    @Contact2 NVARCHAR(100) = NULL,
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
                UserId, SchoolId, EmployeeId, Initials, Department, Qualification, ContactNumber, Contact2, Status, ProfilePhotoPath, 
                Experience, Subject, StandardId, SectionId, IsClassTeacher, Gender, DateOfBirth, BloodGroupId, RetirementDate, 
                ReligionId, CasteId, SubCasteId, CategoryId, DateOfJoining, Address, CityId, StateId, BioId, Rfid, ShiftId,
                IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn
            ) VALUES (
                @UserId, ISNULL(@SchoolId, 1), ISNULL(@EmployeeId, ''), @Initials, @Department, @Qualification, @ContactNumber, @Contact2, ISNULL(@Status, 'Active'), @ProfilePhotoPath,
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
                ContactNumber = ISNULL(@ContactNumber, ContactNumber),
                Contact2 = ISNULL(@Contact2, Contact2),
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
