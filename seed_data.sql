/*
  ScanID Database Comprehensive Seed Script
  Version: 2.0
  Description: Complete master and sample transactional data seeding with hierarchical validation.
  All CreatedBy and ModifiedBy values default to 'SYSTEM' for automated workspace bootstrap.
*/

-- ===================================================
-- 1. INDEPENDENT MASTER TABLES
-- ===================================================

-- 1.1. SCHOOLS
SET IDENTITY_INSERT [dbo].[Schools] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Schools] WHERE [Id] = 1)
    INSERT [dbo].[Schools] ([Id], [Name], [Code], [Address], [Phone], [Email], [TotalStudents], [ProfilePhotoPath], [Status], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, N'SCANiD PRIMARY SCHOOL', N'SCH001', N'MUMBAI, MAHARASHTRA', N'9876543210', N'pri@scanid.com', 2, NULL, N'Active', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Schools] WHERE [Id] = 2)
    INSERT [dbo].[Schools] ([Id], [Name], [Code], [Address], [Phone], [Email], [TotalStudents], [ProfilePhotoPath], [Status], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, N'SCANiD SECONDARY HIGH SCHOOL', N'SCH002', N'PUNE, MAHARASHTRA', N'9876543211', N'sec@scanid.com', 0, NULL, N'Active', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Schools] OFF;
GO

-- 1.2. ROLES
SET IDENTITY_INSERT [dbo].[Roles] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 1)
    INSERT [dbo].[Roles] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, N'SuperAdmin', N'Global System Administrator', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 2)
    INSERT [dbo].[Roles] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, N'Admin', N'School Level Administrator', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 3)
    INSERT [dbo].[Roles] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (3, N'Teacher', N'Teaching Staff', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 4)
    INSERT [dbo].[Roles] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (4, N'Student', N'Student Account', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Id] = 5)
    INSERT [dbo].[Roles] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (5, N'Parent', N'Guardian Account', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Roles] OFF;
GO

-- 1.3. STANDARDS (Grade Levels)
SET IDENTITY_INSERT [dbo].[Standards] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 1) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'1st', N'Primary Grade One', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 2) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'2nd', N'Primary Grade Two', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 3) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'3rd', N'Primary Grade Three', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 4) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'4th', N'Primary Grade Four', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 5) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (5, N'5th', N'Primary Grade Five', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 6) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (6, N'LKG', N'Lower Kindergarten', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Standards] WHERE [Id] = 7) INSERT [dbo].[Standards] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (7, N'UKG', N'Upper Kindergarten', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Standards] OFF;
GO

-- 1.4. SECTIONS (Divisions)
SET IDENTITY_INSERT [dbo].[Sections] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sections] WHERE [Id] = 1) INSERT [dbo].[Sections] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'A', N'Division A', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sections] WHERE [Id] = 2) INSERT [dbo].[Sections] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'B', N'Division B', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sections] WHERE [Id] = 3) INSERT [dbo].[Sections] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'C', N'Division C', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Sections] OFF;
GO

-- 1.5. ACADEMIC YEARS
SET IDENTITY_INSERT [dbo].[AcademicYears] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[AcademicYears] WHERE [Id] = 1) INSERT [dbo].[AcademicYears] ([Id], [Name], [IsCurrent], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'2024-2025', 0, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[AcademicYears] WHERE [Id] = 2) INSERT [dbo].[AcademicYears] ([Id], [Name], [IsCurrent], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'2025-2026', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[AcademicYears] OFF;
GO

-- 1.6. CASTES
SET IDENTITY_INSERT [dbo].[Castes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Castes] WHERE [Id] = 1) INSERT [dbo].[Castes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'OPEN', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Castes] WHERE [Id] = 2) INSERT [dbo].[Castes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'OBC', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Castes] WHERE [Id] = 3) INSERT [dbo].[Castes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'SC', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Castes] WHERE [Id] = 4) INSERT [dbo].[Castes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'ST', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Castes] OFF;
GO

-- 1.7. RELIGIONS
SET IDENTITY_INSERT [dbo].[Religions] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Religions] WHERE [Id] = 1) INSERT [dbo].[Religions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'HINDU', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Religions] WHERE [Id] = 2) INSERT [dbo].[Religions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'MUSLIM', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Religions] WHERE [Id] = 3) INSERT [dbo].[Religions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'CHRISTIAN', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Religions] WHERE [Id] = 4) INSERT [dbo].[Religions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'SIKH', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Religions] OFF;
GO

-- 1.8. CATEGORIES
SET IDENTITY_INSERT [dbo].[Categories] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 1) INSERT [dbo].[Categories] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'General', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 2) INSERT [dbo].[Categories] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'OBC', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 3) INSERT [dbo].[Categories] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'SC', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 4) INSERT [dbo].[Categories] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'ST', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = 5) INSERT [dbo].[Categories] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (5, N'EWS', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Categories] OFF;
GO

-- 1.8.1. SCHOOLSECTIONS
SET IDENTITY_INSERT [dbo].[SchoolSections] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[SchoolSections] WHERE [Id] = 1) INSERT [dbo].[SchoolSections] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Primary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[SchoolSections] WHERE [Id] = 2) INSERT [dbo].[SchoolSections] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Secondary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[SchoolSections] WHERE [Id] = 3) INSERT [dbo].[SchoolSections] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'Higher Secondary', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[SchoolSections] OFF;
GO

-- 1.9. STATES
SET IDENTITY_INSERT [dbo].[States] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[States] WHERE [Id] = 1) INSERT [dbo].[States] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'MAHARASHTRA', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[States] WHERE [Id] = 2) INSERT [dbo].[States] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'DELHI', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[States] WHERE [Id] = 3) INSERT [dbo].[States] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'KARNATAKA', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[States] OFF;
GO

-- 1.10. BLOOD GROUPS
SET IDENTITY_INSERT [dbo].[BloodGroups] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[BloodGroups] WHERE [Id] = 1) INSERT [dbo].[BloodGroups] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'A+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[BloodGroups] WHERE [Id] = 2) INSERT [dbo].[BloodGroups] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'B+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[BloodGroups] WHERE [Id] = 3) INSERT [dbo].[BloodGroups] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'O+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[BloodGroups] WHERE [Id] = 4) INSERT [dbo].[BloodGroups] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'AB+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[BloodGroups] OFF;
GO

-- 1.11. HOUSES
SET IDENTITY_INSERT [dbo].[Houses] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Houses] WHERE [Id] = 1) INSERT [dbo].[Houses] ([Id], [Name], [Color], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'RED', N'#EF4444', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Houses] WHERE [Id] = 2) INSERT [dbo].[Houses] ([Id], [Name], [Color], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'BLUE', N'#3B82F6', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Houses] WHERE [Id] = 3) INSERT [dbo].[Houses] ([Id], [Name], [Color], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'GREEN', N'#10B981', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Houses] WHERE [Id] = 4) INSERT [dbo].[Houses] ([Id], [Name], [Color], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (4, N'YELLOW', N'#F59E0B', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Houses] OFF;
GO

-- 1.12. ADMISSION TYPES
SET IDENTITY_INSERT [dbo].[AdmissionTypes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[AdmissionTypes] WHERE [Id] = 1) INSERT [dbo].[AdmissionTypes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'REGULAR', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[AdmissionTypes] WHERE [Id] = 2) INSERT [dbo].[AdmissionTypes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'RTE', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[AdmissionTypes] WHERE [Id] = 3) INSERT [dbo].[AdmissionTypes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'STAFF CHILD', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[AdmissionTypes] OFF;
GO

-- 1.13. SHIFTS
SET IDENTITY_INSERT [dbo].[Shifts] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Shifts] WHERE [Id] = 1) INSERT [dbo].[Shifts] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'MORNING', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Shifts] WHERE [Id] = 2) INSERT [dbo].[Shifts] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'AFTERNOON', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Shifts] OFF;
GO

-- 1.14. SESSIONS
SET IDENTITY_INSERT [dbo].[Sessions] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sessions] WHERE [Id] = 1) INSERT [dbo].[Sessions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Morning Session', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Sessions] WHERE [Id] = 2) INSERT [dbo].[Sessions] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Afternoon Session', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Sessions] OFF;
GO

-- 1.15. BATCHES
SET IDENTITY_INSERT [dbo].[Batches] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Batches] WHERE [Id] = 1) INSERT [dbo].[Batches] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Batch-A 2025', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Batches] WHERE [Id] = 2) INSERT [dbo].[Batches] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Batch-B 2025', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Batches] OFF;
GO

-- 1.16. SUBJECTS
SET IDENTITY_INSERT [dbo].[Subjects] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Subjects] WHERE [Id] = 1) INSERT [dbo].[Subjects] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Mathematics', N'Primary School Mathematics', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Subjects] WHERE [Id] = 2) INSERT [dbo].[Subjects] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'English Literature', N'English Grammar and Prose', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Subjects] WHERE [Id] = 3) INSERT [dbo].[Subjects] ([Id], [Name], [Description], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'Science', N'General Physics, Chemistry & Biology', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Subjects] OFF;
GO

-- 1.17. EXAM TYPES
SET IDENTITY_INSERT [dbo].[ExamTypes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[ExamTypes] WHERE [Id] = 1) INSERT [dbo].[ExamTypes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Mid-Term Exam', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[ExamTypes] WHERE [Id] = 2) INSERT [dbo].[ExamTypes] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Final Examination', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[ExamTypes] OFF;
GO

-- 1.18. DESIGNATIONS
SET IDENTITY_INSERT [dbo].[Designations] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Designations] WHERE [Id] = 1) INSERT [dbo].[Designations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Principal', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Designations] WHERE [Id] = 2) INSERT [dbo].[Designations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Head Of Department', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Designations] WHERE [Id] = 3) INSERT [dbo].[Designations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'Senior Teacher', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Designations] OFF;
GO

-- 1.19. OCCUPATIONS
SET IDENTITY_INSERT [dbo].[Occupations] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Occupations] WHERE [Id] = 1) INSERT [dbo].[Occupations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, N'Business', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Occupations] WHERE [Id] = 2) INSERT [dbo].[Occupations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, N'Government Service', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Occupations] WHERE [Id] = 3) INSERT [dbo].[Occupations] ([Id], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, N'Self Employed', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Occupations] OFF;
GO


-- ===================================================
-- 2. DEPENDENT MASTER TABLES (FOREIGN KEY BOUND)
-- ===================================================

-- 2.1. SUB CASTES
SET IDENTITY_INSERT [dbo].[SubCastes] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[SubCastes] WHERE [Id] = 1) INSERT [dbo].[SubCastes] ([Id], [CasteId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, 1, N'MARATHA', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[SubCastes] WHERE [Id] = 2) INSERT [dbo].[SubCastes] ([Id], [CasteId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, 2, N'KUNBI', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[SubCastes] OFF;
GO

-- 2.2. CITIES
SET IDENTITY_INSERT [dbo].[Cities] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Cities] WHERE [Id] = 1) INSERT [dbo].[Cities] ([Id], [StateId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (1, 1, N'Mumbaí', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Cities] WHERE [Id] = 2) INSERT [dbo].[Cities] ([Id], [StateId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (2, 1, N'Pune', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Cities] WHERE [Id] = 3) INSERT [dbo].[Cities] ([Id], [StateId], [Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES (3, 2, N'New Delhi', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Cities] OFF;
GO


-- ===================================================
-- 3. IDENTITY AND MAIN USER ENTITIES
-- ===================================================

-- 3.1. USERS
SET IDENTITY_INSERT [dbo].[Users] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 1)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, N'Super Admin', N'superadmin@scanid.com', N'superadmin', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 1, 'superadmin', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 2)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, N'Admin Campus One', N'admin@scanid.com', N'adminuser', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 2, 'admin', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 3)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (3, N'Sanjay Khopkar', N'teacher@scanid.com', N'teacher', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 3, 'teacher', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 6)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (6, N'Sanjay Khopkar Parent', N'parent@scanid.com', N'parent', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 5, 'parent', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Id] = 7)
    INSERT [dbo].[Users] ([Id], [Name], [Email], [Username], [PasswordHash], [RoleId], [Role], [SchoolId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (7, N'Shivansh Khopkar', N'student@scanid.com', N'student', N'AQAAAAEAACcQAAAAEPvR3zF1kLwS59vB3B...', 4, 'student', 1, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Users] OFF;
GO

-- 3.2. TEACHERS / STAFF
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Staff] WHERE [Id] = 1)
    BEGIN
        SET IDENTITY_INSERT [dbo].[Staff] ON;
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'PersonalContact')
        BEGIN
            EXEC sp_executesql N'INSERT [dbo].[Staff] ([Id], [UserId], [SchoolId], [EmployeeId], [Department], [Qualification], [Experience], [Subject], [StandardId], [SectionId], [PersonalContact], [Status], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
            VALUES (1, 3, 1, N''EMP001'', N''Mathematics Department'', N''MA B.Ed'', N''5+ Years'', N''Mathematics'', 1, 1, N''9876543210'', N''Active'', 1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE())';
        END
        ELSE
        BEGIN
            EXEC sp_executesql N'INSERT [dbo].[Staff] ([Id], [UserId], [SchoolId], [EmployeeId], [Department], [Qualification], [Experience], [Subject], [StandardId], [SectionId], [ContactNumber], [Status], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
            VALUES (1, 3, 1, N''EMP001'', N''Mathematics Department'', N''MA B.Ed'', N''5+ Years'', N''Mathematics'', 1, 1, N''9876543210'', N''Active'', 1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE())';
        END
        SET IDENTITY_INSERT [dbo].[Staff] OFF;
    END
END
ELSE IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Teachers]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Teachers] WHERE [Id] = 1)
    BEGIN
        SET IDENTITY_INSERT [dbo].[Teachers] ON;
        EXEC sp_executesql N'INSERT [dbo].[Teachers] ([Id], [UserId], [SchoolId], [EmployeeId], [Department], [Qualification], [Experience], [Subject], [StandardId], [SectionId], [ContactNumber], [Status], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
        VALUES (1, 3, 1, N''EMP001'', N''Mathematics Department'', N''MA B.Ed'', N''5+ Years'', N''Mathematics'', 1, 1, N''9876543210'', N''Active'', 1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE())';
        SET IDENTITY_INSERT [dbo].[Teachers] OFF;
    END
END
GO

-- 3.3. STUDENTS
IF NOT EXISTS (SELECT 1 FROM [dbo].[Students] WHERE [Id] = 1)
BEGIN
    SET IDENTITY_INSERT [dbo].[Students] ON;
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'RegistrationNumber')
    BEGIN
        EXEC sp_executesql N'INSERT [dbo].[Students] (
            [Id], [RegistrationNumber], [Name], [SchoolId], [Status], [RollNumber],
            [FirstName], [MiddleName], [LastName],
            [GrNo], [Gender], [DateOfBirth], [Address], [MotherName],
            [FatherContactNo], [MotherContactNo], [AadharCard], [UniformId], [Rfid],
            [SchoolSectionId], [AdmissionDate], [Email],
            [StandardId], [SectionId], [AcademicYearId], [CasteId], [SubCasteId], [ReligionId], [BloodGroupId],
            [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId],
            [Sms], [IsStateBoard], [ProfilePhotoPath], [DigitalUniform], [DigitalNotebook],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        ) 
        VALUES (
            1, N''REG1001'', N''Shivansh Sanjay Khopkar'', 1, N''Active'', 1,
            N''Shivansh'', N''Sanjay'', N''Khopkar'',
            N''REG1001'', N''Male'', N''2015-05-20'', N''123 Education Lane, Mumbai'', N''Shraddha Khopkar'',
            N''9876543210'', N''9876543201'', N''123456789012'', N''UNIF-001'', N''RF99221'',
            1, N''2024-05-01'', N''shivansh@khopkar.com'',
            1, 1, 2, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1,
            1, 0, NULL, 0, 0,
            1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE()
        )';
    END
    ELSE
    BEGIN
        EXEC sp_executesql N'INSERT [dbo].[Students] (
            [Id], [Name], [SchoolId], [Status], [RollNumber],
            [FirstName], [MiddleName], [LastName],
            [GrNo], [Gender], [DateOfBirth], [Address], [MotherName],
            [FatherContactNo], [MotherContactNo], [AadharCard], [UniformId], [Rfid],
            [SchoolSectionId], [AdmissionDate], [Email],
            [StandardId], [SectionId], [AcademicYearId], [CasteId], [SubCasteId], [ReligionId], [BloodGroupId],
            [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId],
            [Sms], [IsStateBoard], [ProfilePhotoPath], [DigitalUniform], [DigitalNotebook],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        ) 
        VALUES (
            1, N''Shivansh Sanjay Khopkar'', 1, N''Active'', 1,
            N''Shivansh'', N''Sanjay'', N''Khopkar'',
            N''REG1001'', N''Male'', N''2015-05-20'', N''123 Education Lane, Mumbai'', N''Shraddha Khopkar'',
            N''9876543210'', N''9876543201'', N''123456789012'', N''UNIF-001'', N''RF99221'',
            1, N''2024-05-01'', N''shivansh@khopkar.com'',
            1, 1, 2, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1,
            1, 0, NULL, 0, 0,
            1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE()
        )';
    END
    SET IDENTITY_INSERT [dbo].[Students] OFF;
END

IF NOT EXISTS (SELECT 1 FROM [dbo].[Students] WHERE [Id] = 2)
BEGIN
    SET IDENTITY_INSERT [dbo].[Students] ON;
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Students]') AND name = 'RegistrationNumber')
    BEGIN
        EXEC sp_executesql N'INSERT [dbo].[Students] (
            [Id], [RegistrationNumber], [Name], [SchoolId], [Status], [RollNumber],
            [FirstName], [MiddleName], [LastName],
            [GrNo], [Gender], [DateOfBirth], [Address], [MotherName],
            [FatherContactNo], [MotherContactNo], [AadharCard], [UniformId], [Rfid],
            [SchoolSectionId], [AdmissionDate], [Email],
            [StandardId], [SectionId], [AcademicYearId], [CasteId], [SubCasteId], [ReligionId], [BloodGroupId],
            [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId],
            [Sms], [IsStateBoard], [ProfilePhotoPath], [DigitalUniform], [DigitalNotebook],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        ) 
        VALUES (
            2, N''REG1002'', N''Aavya Amit Patil'', 1, N''Active'', 2,
            N''Aavya'', N''Amit'', N''Patil'',
            N''REG1002'', N''Female'', N''2015-08-15'', N''456 Ocean View, Pune'', N''Alka Patil'',
            N''9876543211'', N''9876543202'', N''987654321098'', N''UNIF-002'', N''RF99222'',
            1, N''2024-05-01'', N''aavya@patil.com'',
            1, 1, 2, 2, 2, 1, 2,
            2, 1, 2, 1, 1, 2,
            1, 0, NULL, 0, 0,
            1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE()
        )';
    END
    ELSE
    BEGIN
        EXEC sp_executesql N'INSERT [dbo].[Students] (
            [Id], [Name], [SchoolId], [Status], [RollNumber],
            [FirstName], [MiddleName], [LastName],
            [GrNo], [Gender], [DateOfBirth], [Address], [MotherName],
            [FatherContactNo], [MotherContactNo], [AadharCard], [UniformId], [Rfid],
            [SchoolSectionId], [AdmissionDate], [Email],
            [StandardId], [SectionId], [AcademicYearId], [CasteId], [SubCasteId], [ReligionId], [BloodGroupId],
            [HouseId], [AdmissionTypeId], [CityId], [StateId], [ShiftId], [CategoryId],
            [Sms], [IsStateBoard], [ProfilePhotoPath], [DigitalUniform], [DigitalNotebook],
            [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]
        ) 
        VALUES (
            2, N''Aavya Amit Patil'', 1, N''Active'', 2,
            N''Aavya'', N''Amit'', N''Patil'',
            N''REG1002'', N''Female'', N''2015-08-15'', N''456 Ocean View, Pune'', N''Alka Patil'',
            N''9876543211'', N''9876543202'', N''987654321098'', N''UNIF-002'', N''RF99222'',
            1, N''2024-05-01'', N''aavya@patil.com'',
            1, 1, 2, 2, 2, 1, 2,
            2, 1, 2, 1, 1, 2,
            1, 0, NULL, 0, 0,
            1, 0, N''SYSTEM'', GETUTCDATE(), N''SYSTEM'', GETUTCDATE()
        )';
    END
    SET IDENTITY_INSERT [dbo].[Students] OFF;
END
GO


-- ===================================================
-- 4. NAVIGATION DESIGN AND ROLE-BASED ACCESS (RBAC)
-- ===================================================

-- 4.1. Resetting and rebuilding unified sidebar navigation menu hierarchy
PRINT 'Resetting and rebuilding unified sidebar navigation menu hierarchy...';

-- Clean old structures
DELETE FROM [dbo].[NavigationRoles];
DELETE FROM [dbo].[NavigationItems];

-- Reset identity seed
DBCC CHECKIDENT ('[dbo].[NavigationItems]', RESEED, 0);

-- Ensure Roles exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'SuperAdmin', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Admin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Admin', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Teacher') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Teacher', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Student') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Student', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Parent') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Parent', 1, 0, N'SYSTEM', GETUTCDATE());

SET IDENTITY_INSERT [dbo].[NavigationItems] ON;

-- Level 0 (Root Level Parent menus and standalone modules)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(1, N'Dashboard', N'LayoutDashboard', N'/', NULL, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(2, N'Academic Operations', N'BookOpen', NULL, NULL, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(6, N'Staff & HR', N'Users', NULL, NULL, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(8, N'Administrative', N'ShieldCheck', NULL, NULL, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(11, N'Masters & Config', N'Database', N'/configuration', NULL, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(23, N'System Audit', N'Terminal', N'/system-logs', NULL, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Academic Operations - Id: 2)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(3, N'Student Registry', N'GraduationCap', N'/students', 2, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(4, N'Attendance Tracking', N'CalendarCheck', N'/attendance', 2, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(5, N'Examination & Marks', N'BarChart3', N'/marks', 2, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Staff & HR - Id: 6) - Uses "/staff" path instead of legacy "/teachers"
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(7, N'Staff Directory', N'UserCheck', N'/staff', 6, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(432, N'Manage Users', N'UserPlus', N'/configuration/users', 6, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Administrative - Id: 8)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(9, N'Fee Management', N'CreditCard', N'/fees', 8, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(10, N'Communication Hub', N'MessageSquare', N'/messages', 8, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Masters & Config - Id: 11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(12, N'Global Schools', N'School', N'/configuration/schools', 11, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(13, N'Access Control (RBAC)', N'Key', NULL, 11, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(16, N'Menu Designer', N'Layout', NULL, 11, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(18, N'Academic Masters', N'BookOpen', NULL, 11, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(45, N'General Masters', N'Database', NULL, 11, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Access Control [RBAC] - Id: 13)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(14, N'Role Master', N'Shield', N'/configuration/role-master', 13, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(15, N'User Accounts', N'UserCheck', N'/configuration/role-assignment', 13, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Menu Designer - Id: 16)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(17, N'Navigation Builder', N'LayoutGrid', N'/configuration/navigation', 16, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Academic Masters - Id: 18)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(19, N'Standards & Grades', N'Layers', N'/configuration/standards', 18, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(20, N'Divisions/Sections', N'Hash', N'/configuration/sections', 18, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(21, N'Academic Years', N'Calendar', N'/configuration/academic-years', 18, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(22, N'Subject Registry', N'BookOpen', N'/configuration/subjects', 18, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under General Masters - Id: 45)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(451, N'Religion Master', N'Heart', N'/configuration/religions', 45, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(452, N'Blood Group Master', N'Droplets', N'/configuration/blood-groups', 45, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(453, N'Caste Category', N'Users', N'/configuration/castes', 45, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(454, N'Sub-Caste Master', N'UserCircle', N'/configuration/sub-castes', 45, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(455, N'School House', N'Home', N'/configuration/houses', 45, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(456, N'Admission Types', N'UserCheck', N'/configuration/admission-types', 45, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(457, N'States Master', N'Map', N'/configuration/states', 45, 7, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(458, N'Cities Master', N'MapPin', N'/configuration/cities', 45, 8, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(459, N'School Sections', N'Layers', N'/configuration/school-sections', 45, 9, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;
GO

-- 4.2. NAVIGATION ROLES MAPPING
DECLARE @SuperAdminId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin' OR [Name] = 'Super Admin');
DECLARE @AdminId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Admin' OR [Name] = 'Administrative');
DECLARE @TeacherId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Teacher' OR [Name] = 'Faculty');
DECLARE @StudentId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Student' OR [Name] = 'Pupil');
DECLARE @ParentId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Parent' OR [Name] = 'Guardian');

-- Map SuperAdmin (Access to all menus)
IF @SuperAdminId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    SELECT Id, @SuperAdminId FROM [dbo].[NavigationItems];
END

-- Map Admin (Access to all except System Audit - ID: 23)
IF @AdminId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    SELECT Id, @AdminId FROM [dbo].[NavigationItems] WHERE [Id] <> 23;
END

-- Map Teacher
IF @TeacherId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @TeacherId), (2, @TeacherId), (3, @TeacherId), (4, @TeacherId), (5, @TeacherId), 
    (6, @TeacherId), (7, @TeacherId), (8, @TeacherId), (10, @TeacherId);
END

-- Map Student
IF @StudentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @StudentId), (2, @StudentId), (4, @StudentId), (5, @StudentId), 
    (8, @StudentId), (10, @StudentId);
END

-- Map Parent
IF @ParentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @ParentId), (2, @ParentId), (3, @ParentId), (4, @ParentId), (5, @ParentId), 
    (8, @ParentId), (9, @ParentId), (10, @ParentId);
END
GO



-- ===================================================
-- 5. TRANSACTIONAL DATA RECORD SETS
-- ===================================================

-- 5.1. ATTENDANCE HISTORY
SET IDENTITY_INSERT [dbo].[Attendance] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 1)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, 1, DATEADD(DAY, -1, GETUTCDATE()), N'Present', 2, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 2)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, 2, DATEADD(DAY, -1, GETUTCDATE()), N'Present', 2, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 3)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (3, 1, GETUTCDATE(), N'Present', 2, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Attendance] WHERE [Id] = 4)
    INSERT INTO [dbo].[Attendance] ([Id], [StudentId], [Date], [Status], [MarkedByUserId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (4, 2, GETUTCDATE(), N'Absent', 2, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Attendance] OFF;
GO

-- 5.2. ADMINISTRATIVE INVOICES AND FEES
SET IDENTITY_INSERT [dbo].[Fees] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Fees] WHERE [Id] = 1)
    INSERT INTO [dbo].[Fees] ([Id], [StudentId], [InvoiceNumber], [Type], [Amount], [DueDate], [PaidDate], [Status], [PaymentMethod], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, 1, N'INV-2026-0001', N'Tuition Fee', 25000.00, DATEADD(MONTH, 1, GETUTCDATE()), GETUTCDATE(), N'Paid', N'UPI', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Fees] WHERE [Id] = 2)
    INSERT INTO [dbo].[Fees] ([Id], [StudentId], [InvoiceNumber], [Type], [Amount], [DueDate], [PaidDate], [Status], [PaymentMethod], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, 1, N'INV-2026-0002', N'Uniform and Supplies', 4500.00, DATEADD(MONTH, 2, GETUTCDATE()), NULL, N'Pending', NULL, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Fees] WHERE [Id] = 3)
    INSERT INTO [dbo].[Fees] ([Id], [StudentId], [InvoiceNumber], [Type], [Amount], [DueDate], [PaidDate], [Status], [PaymentMethod], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (3, 2, N'INV-2026-0003', N'Tuition Fee', 25000.00, DATEADD(MONTH, 1, GETUTCDATE()), NULL, N'Pending', NULL, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Fees] OFF;
GO

-- 5.3. GRADEBOOKS AND ACADEMIC MARKS
SET IDENTITY_INSERT [dbo].[Marks] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Marks] WHERE [Id] = 1)
    INSERT INTO [dbo].[Marks] ([Id], [StudentId], [Subject], [ExamName], [MarksObtained], [TotalMarks], [Grade], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, 1, N'Mathematics', N'Mid-Term Exam', 88.50, 100.00, N'A', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Marks] WHERE [Id] = 2)
    INSERT INTO [dbo].[Marks] ([Id], [StudentId], [Subject], [ExamName], [MarksObtained], [TotalMarks], [Grade], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, 1, N'Science', N'Mid-Term Exam', 94.00, 100.00, N'A+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Marks] WHERE [Id] = 3)
    INSERT INTO [dbo].[Marks] ([Id], [StudentId], [Subject], [ExamName], [MarksObtained], [TotalMarks], [Grade], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (3, 2, N'Mathematics', N'Mid-Term Exam', 92.50, 100.00, N'A+', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Marks] WHERE [Id] = 4)
    INSERT INTO [dbo].[Marks] ([Id], [StudentId], [Subject], [ExamName], [MarksObtained], [TotalMarks], [Grade], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (4, 2, N'Science', N'Mid-Term Exam', 76.00, 100.00, N'B', 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Marks] OFF;
GO

-- 5.4. MESSAGES AND INTERNAL COMMUNICATIONS
SET IDENTITY_INSERT [dbo].[Messages] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Messages] WHERE [Id] = 1)
    INSERT INTO [dbo].[Messages] ([Id], [SenderId], [ReceiverId], [Subject], [Content], [IsRead], [Type], [CreatedAt], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, 2, 3, N'Annual Syllabi Audit', N'Please upload the class syllabi plans for 1st grade by Friday evening.', 0, N'Alert', GETUTCDATE(), 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Messages] WHERE [Id] = 2)
    INSERT INTO [dbo].[Messages] ([Id], [SenderId], [ReceiverId], [Subject], [Content], [IsRead], [Type], [CreatedAt], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, 3, 2, N'Re: Annual Syllabi Audit', N'Drafted syllabus has been uploaded onto academic logs. Review when free.', 1, N'Message', GETUTCDATE(), 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Messages] OFF;
GO

-- 5.5. NOTIFICATIONS
SET IDENTITY_INSERT [dbo].[Notifications] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Notifications] WHERE [Id] = 1)
    INSERT INTO [dbo].[Notifications] ([Id], [UserId], [RoleId], [Title], [Message], [Type], [IsRead], [CreatedAt], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (1, 3, 3, N'RFID Systems Online', N'School security barriers have loaded student cards successfully.', N'success', 0, GETUTCDATE(), 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Notifications] WHERE [Id] = 2)
    INSERT INTO [dbo].[Notifications] ([Id], [UserId], [RoleId], [Title], [Message], [Type], [IsRead], [CreatedAt], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) 
    VALUES (2, NULL, 2, N'Pending Invoice Threshold', N'3 invoices have exceeded standard collection timelines.', N'warning', 0, GETUTCDATE(), 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
SET IDENTITY_INSERT [dbo].[Notifications] OFF;
GO


-- ===================================================
-- 6. SYSTEM STABILITY AND TELEMTRY LOGS
-- ===================================================

-- 6.1. SAMPLE INFRASTRUCTURE AUDITS
IF NOT EXISTS (SELECT 1 FROM [dbo].[AuditLogs] WHERE [Id] = 1)
BEGIN
    INSERT INTO [dbo].[AuditLogs] ([UserId], [Type], [TableName], [DateTime], [OldValues], [NewValues], [AffectedColumns], [PrimaryKey])
    VALUES (N'superadmin@scanid.com', N'Insert', N'Schools', DATEADD(MINUTE, -120, GETUTCDATE()), NULL, N'{"Name":"SCANiD SECONDARY HIGH SCHOOL"}', N'Name,Address,Phone', N'2');
END
GO

-- 6.2. SAMPLE RECOVERABLE EXCEPTIONS
IF NOT EXISTS (SELECT 1 FROM [dbo].[ErrorLogs] WHERE [Id] = 1)
BEGIN
    INSERT INTO [dbo].[ErrorLogs] ([Message], [Level], [Timestamp], [Exception], [Properties])
    VALUES (N'Database connection timeout resolved on secondary retry attempt.', N'Warning', DATEADD(MINUTE, -60, GETUTCDATE()), N'System.Data.SqlClient.SqlException', N'RetryCount=1;Server=MSI;');
    INSERT INTO [dbo].[ErrorLogs] ([Message], [Level], [Timestamp], [Exception], [Properties])
    VALUES (N'Cache invalidation triggered successfully.', N'Info', DATEADD(MINUTE, -30, GETUTCDATE()), NULL, NULL);
END
GO
