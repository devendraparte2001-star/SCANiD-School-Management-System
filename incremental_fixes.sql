-- Fixes for sp_ManageUser and sp_ManageStudent stored procedures
-- To resolve "too many arguments specified" errors

-- 1. Fix sp_ManageUser
IF OBJECT_ID('dbo.sp_ManageUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageUser;
GO
CREATE PROCEDURE dbo.sp_ManageUser
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE'
    @Id INT = NULL,
    @Username NVARCHAR(100) = NULL,
    @PasswordHash NVARCHAR(255) = NULL,
    @Name NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
    @Role NVARCHAR(50) = NULL,
    @RoleId INT = NULL,
    @SchoolId INT = NULL,
    @CreatedBy NVARCHAR(100) = NULL,
    @ModifiedBy NVARCHAR(100) = NULL,
    @AcademicYearId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @Action = 'INSERT'
    BEGIN
        IF @PasswordHash IS NULL OR @PasswordHash = ''
        BEGIN
            SET @PasswordHash = 'password123';
        END

        INSERT INTO [dbo].[Users] (
            Username, PasswordHash, Name, Email, Role, RoleId, SchoolId, AcademicYearId, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
        ) VALUES (
            @Username, @PasswordHash, @Name, @Email, @Role, @RoleId, @SchoolId, @AcademicYearId, 1, 0, GETUTCDATE(), GETUTCDATE(), @CreatedBy, @ModifiedBy
        );
        SELECT SCOPE_IDENTITY();
    END
    ELSE IF @Action = 'UPDATE'
    BEGIN
        UPDATE [dbo].[Users] SET
            Username = ISNULL(@Username, Username),
            PasswordHash = ISNULL(@PasswordHash, PasswordHash),
            Name = ISNULL(@Name, Name),
            Email = ISNULL(@Email, Email),
            Role = ISNULL(@Role, Role),
            RoleId = ISNULL(@RoleId, RoleId),
            SchoolId = ISNULL(@SchoolId, SchoolId),
            AcademicYearId = ISNULL(@AcademicYearId, AcademicYearId),
            ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy),
            ModifiedOn = GETUTCDATE()
        WHERE Id = @Id;
    END
    ELSE IF @Action = 'DELETE'
    BEGIN
        UPDATE [dbo].[Users] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
    END
END;
GO

-- 2. Fix sp_ManageStudent
IF OBJECT_ID('dbo.sp_ManageStudent', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageStudent;
GO
CREATE PROCEDURE [dbo].[sp_ManageStudent]
    @Action NVARCHAR(50),
    @Id INT = NULL,    
    @Name NVARCHAR(255) = NULL,
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
    @DateOfBirth DATETIME = NULL,
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
    @AdmissionDate DATETIME = NULL,
    @Email NVARCHAR(255) = NULL,
    @CityId INT = NULL,
    @StateId INT = NULL,
    @IsStateBoard BIT = 0,
    @DigitalUniform BIT = 0,
    @DigitalNotebook BIT = 0,
    @OptedForBus BIT = 0,
    @CreatedBy NVARCHAR(MAX) = NULL,
    @ModifiedBy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            INSERT INTO [dbo].[Students] (
                Name, FirstName, MiddleName, LastName, SchoolId, StandardId, SectionId, AcademicYearId, RollNumber, 
                GrNo, Gender, DateOfBirth, CategoryId, ReligionId, CasteId, SubCasteId, Status, FatherContactNo, Address, 
                MotherName, AadharCard, Rfid, ShiftId, BloodGroupId, HouseId, AdmissionTypeId, Sms, UniformId,
                MotherContactNo, ProfilePhotoPath, SchoolSectionId, AdmissionDate, Email, CityId, StateId, IsStateBoard, DigitalUniform, DigitalNotebook, OptedForBus, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
            ) VALUES (
                @Name, @FirstName, @MiddleName, @LastName, @SchoolId, @StandardId, @SectionId, @AcademicYearId, @RollNumber,
                @GrNo, @Gender, @DateOfBirth, @CategoryId, @ReligionId, @CasteId, @SubCasteId, @Status, @FatherContactNo, @Address,
                @MotherName, @AadharCard, @Rfid, @ShiftId, @BloodGroupId, @HouseId, @AdmissionTypeId, @Sms, @UniformId,
                @MotherContactNo, @ProfilePhotoPath, @SchoolSectionId, @AdmissionDate, @Email, @CityId, @StateId, @IsStateBoard, @DigitalUniform, @DigitalNotebook, @OptedForBus, 1, 0, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@ModifiedBy, 'System')
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Students] SET
                Name = ISNULL(@Name, Name),
                FirstName = ISNULL(@FirstName, FirstName),
                MiddleName = ISNULL(@MiddleName, MiddleName),
                LastName = ISNULL(@LastName, LastName),
                SchoolId = @SchoolId,
                StandardId = @StandardId,
                SectionId = @SectionId,
                AcademicYearId = @AcademicYearId,
                RollNumber = ISNULL(@RollNumber, RollNumber),
                GrNo = ISNULL(@GrNo, GrNo),
                Gender = ISNULL(@Gender, Gender),
                DateOfBirth = ISNULL(@DateOfBirth, DateOfBirth),
                CategoryId = @CategoryId,
                ReligionId = @ReligionId,
                CasteId = @CasteId,
                SubCasteId = @SubCasteId,                
                Status = ISNULL(@Status, Status),
                FatherContactNo = ISNULL(@FatherContactNo, FatherContactNo),
                Address = ISNULL(@Address, Address),
                MotherName = ISNULL(@MotherName, MotherName),
                AadharCard = ISNULL(@AadharCard, AadharCard),
                Rfid = ISNULL(@Rfid, Rfid),
                ShiftId = @ShiftId,
                BloodGroupId = @BloodGroupId,
                HouseId = @HouseId,
                AdmissionTypeId = @AdmissionTypeId,
                Sms = ISNULL(@Sms, Sms),
                UniformId = ISNULL(@UniformId, UniformId),
                MotherContactNo = ISNULL(@MotherContactNo, MotherContactNo),
                ProfilePhotoPath = ISNULL(@ProfilePhotoPath, ProfilePhotoPath),
                SchoolSectionId = @SchoolSectionId,
                AdmissionDate = ISNULL(@AdmissionDate, AdmissionDate),
                Email = ISNULL(@Email, Email),
                CityId = @CityId,
                StateId = @StateId,
                IsStateBoard = ISNULL(@IsStateBoard, IsStateBoard),
                DigitalUniform = ISNULL(@DigitalUniform, DigitalUniform),
                DigitalNotebook = ISNULL(@DigitalNotebook, DigitalNotebook),
                OptedForBus = ISNULL(@OptedForBus, OptedForBus),
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy)
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            SET NOCOUNT OFF; 
            UPDATE [dbo].[Students] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;
            SET NOCOUNT ON; 
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END
        THROW;
    END CATCH
END;
GO
