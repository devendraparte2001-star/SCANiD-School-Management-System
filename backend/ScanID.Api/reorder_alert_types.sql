-- Create a backup of the existing data
SELECT * INTO AlertTypes_Backup FROM AlertTypes;

-- Drop the existing table
DROP TABLE AlertTypes;

-- Create the table with the desired column order
CREATE TABLE AlertTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(MAX),
    Description NVARCHAR(MAX),
    SchoolId INT NULL,
    AcademicYearId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(MAX) NULL,
    CreatedOn DATETIME2 NOT NULL DEFAULT GETDATE(),
    ModifiedBy NVARCHAR(MAX) NULL,
    ModifiedOn DATETIME2 NULL
);

-- Copy the data back
-- Note: Assuming the original table only had Id, Name, Description
INSERT INTO AlertTypes (Id, Name, Description, IsActive, IsDeleted, CreatedOn)
SELECT Id, Name, Description, 1, 0, GETDATE() FROM AlertTypes_Backup;

-- Drop the backup table
DROP TABLE AlertTypes_Backup;
