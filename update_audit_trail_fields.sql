-- =================================================================================
-- INCREMENTAL DATABASE UPDATE: Support Custom Audit Fields CreatedBy / ModifiedBy
-- =================================================================================

-- 1. Recreate [dbo].[sp_ManageStudent] with CreatedBy and ModifiedBy logging
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ManageStudent]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_ManageStudent];
END
GO

CREATE PROCEDURE [dbo].[sp_ManageStudent]
    @Action NVARCHAR(50),
    @Id INT = NULL,
    @RegistrationNumber NVARCHAR(100) = NULL,
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
    SET XACT_ABORT ON; -- Ensures instant rollback on any fatal SQL runtime errors

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
                @MotherContactNo, @ProfilePhotoPath, @SchoolSectionId, @AdmissionDate, @Email, @CityId, @StateId, @IsStateBoard, @DigitalUniform, @DigitalNotebook, @OptedForBus, 1, 0, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System')
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
            SET NOCOUNT OFF; -- Temporarily allow row count to be returned
            UPDATE [dbo].[Students] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;
            SET NOCOUNT ON; -- Restore NOCOUNT
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO


-- 2. Recreate [dbo].[sp_ManageTeacher] with CreatedBy and ModifiedBy logging
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ManageTeacher]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_ManageTeacher];
END
GO

CREATE PROCEDURE dbo.sp_ManageTeacher
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE'
    @Id INT = NULL,
    @UserId INT = NULL,
    @ContactNumber NVARCHAR(50) = NULL,
    @Department NVARCHAR(100) = NULL,
    @Qualification NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = NULL,
    @SchoolId INT = NULL,
    @ProfilePhotoPath NVARCHAR(255) = NULL,
    @EmployeeId NVARCHAR(255) = NULL,
    @Experience NVARCHAR(100) = NULL,
    @Subject NVARCHAR(200) = NULL,
    @StandardId INT = NULL,
    @SectionId INT = NULL,
    @CreatedBy NVARCHAR(MAX) = NULL,
    @ModifiedBy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Instantly rolls back on any fatal SQL runtime errors

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            INSERT INTO [dbo].[Teachers] (
                UserId, SchoolId, EmployeeId, ContactNumber, Department, Qualification, Status, ProfilePhotoPath, Experience, Subject, StandardId, SectionId, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
            ) VALUES (
                @UserId, ISNULL(@SchoolId, 1), ISNULL(@EmployeeId, ''), @ContactNumber, @Department, @Qualification, @Status, @ProfilePhotoPath, @Experience, @Subject, @StandardId, @SectionId, 1, 0, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System')
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Teachers] SET
                UserId = CASE WHEN @UserId IS NULL OR @UserId <= 0 THEN UserId ELSE @UserId END,
                ContactNumber = ISNULL(@ContactNumber, ContactNumber),
                Department = ISNULL(@Department, Department),
                Qualification = ISNULL(@Qualification, Qualification),
                Status = ISNULL(@Status, Status),
                SchoolId = ISNULL(@SchoolId, SchoolId),
                ProfilePhotoPath = ISNULL(@ProfilePhotoPath, ProfilePhotoPath),
                EmployeeId = ISNULL(@EmployeeId, EmployeeId),
                Experience = ISNULL(@Experience, Experience),
                Subject = ISNULL(@Subject, Subject),
                StandardId = ISNULL(@StandardId, StandardId),
                SectionId = ISNULL(@SectionId, SectionId),
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy)
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            UPDATE [dbo].[Teachers] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;
            DECLARE @LinkedUserId INT;
            SELECT @LinkedUserId = UserId FROM [dbo].[Teachers] WHERE Id = @Id;
            IF @LinkedUserId IS NOT NULL
            BEGIN
                UPDATE [dbo].[Users] SET IsDeleted = 1, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @LinkedUserId;
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO


-- 3. Recreate [dbo].[sp_ManageSchool] with CreatedBy and ModifiedBy logging
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ManageSchool]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_ManageSchool];
END
GO

CREATE PROCEDURE dbo.sp_ManageSchool
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE'
    @Id INT = NULL,
    @Name NVARCHAR(100) = NULL,
    @LogoPath NVARCHAR(255) = NULL,
    @Address NVARCHAR(255) = NULL,
    @ContactNumber NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL,
    @CreatedBy NVARCHAR(MAX) = NULL,
    @ShortName NVARCHAR(100) = NULL,
    @CityId INT = NULL,
    @StateId INT = NULL,
    @Pincode NVARCHAR(100) = NULL,
    @SMSLimit INT = NULL,
    @TotalSMSSent INT = NULL,
    @SMSBalance INT = NULL,
    @EnableSMS BIT = NULL,
    @EnablePresenteeSMS BIT = NULL,
    @AutomaticBirthdaySMS BIT = NULL,
    @EnableWhatsapp BIT = NULL,
    @WebsiteUrl NVARCHAR(500) = NULL,
    @SMSSenderID NVARCHAR(100) = NULL,
    @BusNumbers NVARCHAR(MAX) = NULL,
    @SCANiDContact NVARCHAR(100) = NULL,
    @SCANiDEmail NVARCHAR(255) = NULL,
    @InChargeContact NVARCHAR(100) = NULL,
    @ModifiedBy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Action = 'INSERT'
        BEGIN
            INSERT INTO [dbo].[Schools] (
                Name, ProfilePhotoPath, Address, Phone, Email,
                ShortName, CityId, StateId, Pincode, SMSLimit, TotalSMSSent, SMSBalance, EnableSMS,
                EnablePresenteeSMS, AutomaticBirthdaySMS, EnableWhatsapp, WebsiteUrl, SMSSenderID, BusNumbers,
                SCANiDContact, SCANiDEmail, InChargeContact,
                IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
            ) VALUES (
                @Name, @LogoPath, @Address, @ContactNumber, @Email,
                @ShortName, @CityId, @StateId, @Pincode, @SMSLimit, @TotalSMSSent, @SMSBalance, @EnableSMS,
                @EnablePresenteeSMS, @AutomaticBirthdaySMS, @EnableWhatsapp, @WebsiteUrl, @SMSSenderID, @BusNumbers,
                @SCANiDContact, @SCANiDEmail, @InChargeContact,
                1, 0, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System')
            );
            SELECT SCOPE_IDENTITY();
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            UPDATE [dbo].[Schools] SET
                Name = ISNULL(@Name, Name),
                ProfilePhotoPath = ISNULL(@LogoPath, ProfilePhotoPath),
                Address = ISNULL(@Address, Address),
                Phone = ISNULL(@ContactNumber, Phone),
                Email = ISNULL(@Email, Email),
                ShortName = ISNULL(@ShortName, ShortName),
                CityId = ISNULL(@CityId, CityId),
                StateId = ISNULL(@StateId, StateId),
                Pincode = ISNULL(@Pincode, Pincode),
                SMSLimit = ISNULL(@SMSLimit, SMSLimit),
                TotalSMSSent = ISNULL(@TotalSMSSent, TotalSMSSent),
                SMSBalance = ISNULL(@SMSBalance, SMSBalance),
                EnableSMS = ISNULL(@EnableSMS, EnableSMS),
                EnablePresenteeSMS = ISNULL(@EnablePresenteeSMS, EnablePresenteeSMS),
                AutomaticBirthdaySMS = ISNULL(@AutomaticBirthdaySMS, AutomaticBirthdaySMS),
                EnableWhatsapp = ISNULL(@EnableWhatsapp, EnableWhatsapp),
                WebsiteUrl = ISNULL(@WebsiteUrl, WebsiteUrl),
                SMSSenderID = ISNULL(@SMSSenderID, SMSSenderID),
                BusNumbers = ISNULL(@BusNumbers, BusNumbers),
                SCANiDContact = ISNULL(@SCANiDContact, SCANiDContact),
                SCANiDEmail = ISNULL(@SCANiDEmail, SCANiDEmail),
                InChargeContact = ISNULL(@InChargeContact, InChargeContact),
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy)
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            UPDATE [dbo].[Schools] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO


-- 4. Recreate [dbo].[sp_ManageUser] with CreatedBy and ModifiedBy logging
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ManageUser]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_ManageUser];
END
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
            IF @PasswordHash IS NULL OR @PasswordHash = ''
            BEGIN
                SET @PasswordHash = 'password123';
            END

            INSERT INTO [dbo].[Users] (
                Username, PasswordHash, Name, Email, Role, RoleId, SchoolId, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
            ) VALUES (
                @Username, @PasswordHash, @Name, @Email, @Role, @RoleId, @SchoolId, 1, 0, GETUTCDATE(), GETUTCDATE(), ISNULL(@CreatedBy, 'System'), ISNULL(@CreatedBy, 'System')
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
                ModifiedOn = GETUTCDATE(),
                ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy)
            WHERE Id = @Id;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            UPDATE [dbo].[Users] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO


-- 5. Recreate [dbo].[sp_ManageMasterData] with CreatedBy and ModifiedBy logging
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_ManageMasterData]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [dbo].[sp_ManageMasterData];
END
GO

CREATE PROCEDURE dbo.sp_ManageMasterData
    @TableName NVARCHAR(128),
    @Action NVARCHAR(10), -- 'INSERT', 'UPDATE', 'DELETE'
    @Id INT,
    @Name NVARCHAR(255) = NULL,
    @Description NVARCHAR(500) = NULL,
    @IsActive BIT = 1,
    @CreatedBy NVARCHAR(255) = NULL,
    @ModifiedBy NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @SQL NVARCHAR(MAX);
    DECLARE @Params NVARCHAR(MAX);

    IF @TableName IN ('Standards', 'Sections', 'AcademicYears', 'Castes', 'Religions', 'Categories', 'BloodGroups', 'Houses', 'AdmissionTypes', 'Shifts', 'SubCastes', 'Cities', 'Subjects', 'ExamTypes', 'Designations', 'Occupations')
    BEGIN
        IF @Action = 'INSERT'
        BEGIN
            SET @SQL = N'INSERT INTO [dbo].[' + @TableName + N'] (Name, Description, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy) VALUES (@Name, @Description, @IsActive, 0, GETUTCDATE(), GETUTCDATE(), @CreatedBy, @CreatedBy); SELECT SCOPE_IDENTITY();';
            SET @Params = N'@Name NVARCHAR(255), @Description NVARCHAR(500), @IsActive BIT, @CreatedBy NVARCHAR(255)';
            EXEC sp_executesql @SQL, @Params, @Name, @Description, @IsActive, @CreatedBy;
        END
        ELSE IF @Action = 'UPDATE'
        BEGIN
            SET @SQL = N'UPDATE [dbo].[' + @TableName + N'] SET Name = ISNULL(@Name, Name), Description = ISNULL(@Description, Description), IsActive = ISNULL(@IsActive, IsActive), ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;';
            SET @Params = N'@Id INT, @Name NVARCHAR(255), @Description NVARCHAR(500), @IsActive BIT, @ModifiedBy NVARCHAR(255)';
            EXEC sp_executesql @SQL, @Params, @Id, @Name, @Description, @IsActive, @ModifiedBy;
        END
        ELSE IF @Action = 'DELETE'
        BEGIN
            SET @SQL = N'UPDATE [dbo].[' + @TableName + N'] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE(), ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy) WHERE Id = @Id;';
            SET @Params = N'@Id INT, @ModifiedBy NVARCHAR(255)';
            EXEC sp_executesql @SQL, @Params, @Id, @ModifiedBy;
        END
    END
    ELSE
    BEGIN
        RAISERROR('Invalid Table Name', 16, 1);
    END
END;
GO
