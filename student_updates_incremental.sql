-- =========================================================================
-- INCREMENTAL DATABASE UPDATE SCRIPT (STUDENTS SECTION IMPROVEMENTS)
-- Description: 
--   1. Adds OptedForBus BIT field to Students table.
--   2. Drops RegistrationNumber column from Students table (dependent indexes are cleaned/updated).
--   3. Updates sp_ManageStudent Stored Procedure to handle these changes.
-- =========================================================================

-- 1. Ensure OptedForBus column exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'OptedForBus')
    BEGIN
        ALTER TABLE [dbo].[Students] ADD [OptedForBus] [bit] NOT NULL CONSTRAINT [DF_Students_OptedForBus] DEFAULT (0);
    END;
END;
GO

-- 2. Drop dependent indexes dynamically to prevent ALTER failures
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics_Filters' AND object_id = OBJECT_ID('dbo.Students'))
BEGIN
    DROP INDEX [IX_Students_School_Academics_Filters] ON [dbo].[Students];
END;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_Name_Search' AND object_id = OBJECT_ID('dbo.Students'))
BEGIN
    DROP INDEX [IX_Students_Name_Search] ON [dbo].[Students];
END;
GO

-- 3. Drop RegistrationNumber column from Students table if it exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'RegistrationNumber')
BEGIN
    -- Check if there are default constraints on RegistrationNumber first
    DECLARE @ConstraintName NVARCHAR(255) = NULL;
    SELECT @ConstraintName = d.name 
    FROM sys.default_constraints d 
    JOIN sys.columns c ON d.parent_column_id = c.column_id 
    WHERE d.parent_object_id = OBJECT_ID('dbo.Students') AND c.name = 'RegistrationNumber';
    
    IF @ConstraintName IS NOT NULL 
    BEGIN
        EXEC('ALTER TABLE [dbo].[Students] DROP CONSTRAINT [' + @ConstraintName + ']');
    END;

    ALTER TABLE [dbo].[Students] DROP COLUMN [RegistrationNumber];
END;
GO

-- 4. Re-create the indexes without RegistrationNumber matching the updated schema
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND type in (N'U'))
BEGIN
    -- High Performance Composite Filter Index
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_School_Academics_Filters' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        EXEC('CREATE NONCLUSTERED INDEX [IX_Students_School_Academics_Filters] ON [dbo].[Students] ([SchoolId], [AcademicYearId], [StandardId], [SectionId], [IsDeleted]) INCLUDE ([Id], [Name], [RollNumber], [GrNo]);');
    END;

    -- High Performance Index for Fast Dynamic Searching
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_Name_Search' AND object_id = OBJECT_ID('dbo.Students'))
    BEGIN
        EXEC('CREATE NONCLUSTERED INDEX [IX_Students_Name_Search] ON [dbo].[Students] ([GrNo], [RollNumber]) INCLUDE ([Name]);');
    END;
END;
GO

-- 5. Modify or drop/recreate sp_ManageStudent stored procedure to accept OptedForBus and remove RegistrationNumber
IF OBJECT_ID('dbo.sp_ManageStudent', 'P') IS NOT NULL 
    DROP PROCEDURE dbo.sp_ManageStudent;
GO

CREATE PROCEDURE dbo.sp_ManageStudent
       @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE', 'PHOTO'
    @Id INT = NULL,
    @Name NVARCHAR(100) = NULL,
    @FirstName NVARCHAR(100) = NULL,
    @MiddleName NVARCHAR(100) = NULL,
    @LastName NVARCHAR(100) = NULL,
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
    @SubCasteId INT = NULL,
    @Status NVARCHAR(50) = NULL,
    @FatherContactNo NVARCHAR(200) = NULL,
    @Address NVARCHAR(500) = NULL,
    @MotherName NVARCHAR(100) = NULL,
    @AadharCard NVARCHAR(100) = NULL,
    @Rfid NVARCHAR(100) = NULL,
    @ShiftId INT = NULL,
    @BloodGroupId INT = NULL,
    @HouseId INT = NULL,
    @AdmissionTypeId INT = NULL,
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
    @DigitalNotebook BIT = 0,
    @OptedForBus BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Ensures instant rollback on any fatal SQL runtime errors

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            INSERT INTO [dbo].[Students] (
                Name, FirstName, MiddleName, LastName, SchoolId, StandardId, SectionId, AcademicYearId, RollNumber, 
                GrNo, Gender, DateOfBirth, CategoryId, ReligionId, CasteId, SubCasteId, Status, FatherContactNo, Address, 
                MotherName, AadharCard, Rfid, ShiftId, BloodGroupId, HouseId, AdmissionTypeId, Sms, UniformId,
                MotherContactNo, ProfilePhotoPath, SchoolSectionId, AdmissionDate, Email, CityId, StateId, IsStateBoard, DigitalUniform, DigitalNotebook, IsActive, IsDeleted, CreatedOn, ModifiedOn, OptedForBus
            ) VALUES (
                @Name, @FirstName, @MiddleName, @LastName, @SchoolId, @StandardId, @SectionId, @AcademicYearId, @RollNumber,
                @GrNo, @Gender, @DateOfBirth, @CategoryId, @ReligionId, @CasteId, @SubCasteId, @Status, @FatherContactNo, @Address,
                @MotherName, @AadharCard, @Rfid, @ShiftId, @BloodGroupId, @HouseId, @AdmissionTypeId, @Sms, @UniformId,
                @MotherContactNo, @ProfilePhotoPath, @SchoolSectionId, @AdmissionDate, @Email, @CityId, @StateId, @IsStateBoard, @DigitalUniform, @DigitalNotebook, 1, 0, GETUTCDATE(), GETUTCDATE(), @OptedForBus
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Students] SET
                Name = @Name,
                FirstName = @FirstName,
                MiddleName = @MiddleName,
                LastName = @LastName,
                SchoolId = @SchoolId,
                StandardId = @StandardId,
                SectionId = @SectionId,
                AcademicYearId = @AcademicYearId,
                RollNumber = @RollNumber,
                GrNo = @GrNo,
                Gender = @Gender,
                DateOfBirth = @DateOfBirth,
                CategoryId = @CategoryId,
                ReligionId = @ReligionId,
                CasteId = @CasteId,
                SubCasteId = @SubCasteId,                
                Status = @Status,
                FatherContactNo = @FatherContactNo,
                Address = @Address,
                MotherName = @MotherName,
                AadharCard = @AadharCard,
                Rfid = @Rfid,
                ShiftId = @ShiftId,
                BloodGroupId = @BloodGroupId,
                HouseId = @HouseId,
                AdmissionTypeId = @AdmissionTypeId,
                Sms = @Sms,
                UniformId = @UniformId,
                MotherContactNo = @MotherContactNo,
                ProfilePhotoPath = @ProfilePhotoPath,
                SchoolSectionId = @SchoolSectionId,
                AdmissionDate = @AdmissionDate,
                Email = @Email,
                CityId = @CityId,
                StateId = @StateId,
                IsStateBoard = @IsStateBoard,
                DigitalUniform = @DigitalUniform,
                DigitalNotebook = @DigitalNotebook,
                OptedForBus = @OptedForBus,
                ModifiedOn = GETUTCDATE()
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            SET NOCOUNT OFF;
            UPDATE [dbo].[Students] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
            SET NOCOUNT ON;
        END
        ELSE IF @Action = 'PHOTO'
        BEGIN
            UPDATE [dbo].[Students] SET ProfilePhotoPath = @ProfilePhotoPath, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO
