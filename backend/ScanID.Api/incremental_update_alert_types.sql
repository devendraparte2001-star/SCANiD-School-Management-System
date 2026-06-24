-- Incremental update to add audit and school/academic year tracking columns to AlertTypes table
ALTER TABLE AlertTypes ADD CreatedBy NVARCHAR(MAX) NULL;
ALTER TABLE AlertTypes ADD ModifiedBy NVARCHAR(MAX) NULL;
ALTER TABLE AlertTypes ADD SchoolId INT NULL;
ALTER TABLE AlertTypes ADD AcademicYearId INT NULL;
