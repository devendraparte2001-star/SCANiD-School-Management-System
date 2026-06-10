/*
  ScanID Implementation: Navigation Update v4 (Unified Sequential Alignment)
  Purpose: Rebuilds navigation with perfectly sequential Ids (1 to 35) without any arbitrary jumps.
*/

USE ScanID_DB;
GO

PRINT 'Resetting and rebuilding sidebar navigation menu hierarchy with perfect database standards...';

-- Clean old structures
DELETE FROM [dbo].[NavigationRoles];
DELETE FROM [dbo].[NavigationItems];

-- Reset identity seed to 0 so the first item naturally gets Id = 1
DBCC CHECKIDENT ('[dbo].[NavigationItems]', RESEED, 0);
GO

-- Ensure Roles exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'SuperAdmin', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Admin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Admin', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Teacher') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Teacher', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Student') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Student', 1, 0, N'SYSTEM', GETUTCDATE());
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Parent') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn]) VALUES (N'Parent', 1, 0, N'SYSTEM', GETUTCDATE());
GO

SET IDENTITY_INSERT [dbo].[NavigationItems] ON;

-- Level 0 (Root Level Parent menus and standalone modules)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(1, N'Dashboard', N'LayoutDashboard', N'/', NULL, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(2, N'Academic Operations', N'BookOpen', NULL, NULL, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(6, N'Staff & HR', N'Users', NULL, NULL, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(8, N'Administrative', N'ShieldCheck', NULL, NULL, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(11, N'Masters & Config', N'Database', N'/configuration', NULL, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Academic Operations - Id: 2)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(3, N'Student Registry', N'GraduationCap', N'/students', 2, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(4, N'Attendance Tracking', N'CalendarCheck', N'/attendance', 2, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(5, N'Examination & Marks', N'BarChart3', N'/marks', 2, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Staff & HR - Id: 6)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(7, N'Staff Directory', N'UserCheck', N'/staff', 6, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Administrative - Id: 8)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(9, N'Fee Management', N'CreditCard', N'/fees', 8, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(10, N'Communication Hub', N'MessageSquare', N'/messages', 8, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Masters & Config - Id: 11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(12, N'Global Schools', N'School', N'/configuration/schools', 11, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(13, N'Access Control (RBAC)', N'Key', NULL, 11, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Access Control [RBAC] - Id: 13)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(14, N'Role Master', N'Shield', N'/configuration/role-master', 13, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(15, N'User Accounts', N'UserCheck', N'/configuration/role-assignment', 13, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Masters & Config - Id: 11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(16, N'Menu Designer', N'Layout', NULL, 11, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Menu Designer - Id: 16)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(17, N'Navigation Builder', N'LayoutGrid', N'/configuration/navigation', 16, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Masters & Config - Id: 11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(18, N'Academic Masters', N'BookOpen', NULL, 11, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Academic Masters - Id: 18)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(19, N'Standards & Grades', N'Layers', N'/configuration/standards', 18, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(20, N'Divisions/Sections', N'Hash', N'/configuration/sections', 18, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(21, N'Academic Years', N'Calendar', N'/configuration/academic-years', 18, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(22, N'Subject Registry', N'BookOpen', N'/configuration/subjects', 18, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Standalone Module (Root Level standalone modules)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(23, N'System Audit', N'Terminal', N'/system-logs', NULL, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Additional menus structured strictly sequentially without arbitrary jumps
-- ID 24 (Manage Users under Staff & HR group ID 6)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(24, N'Manage Users', N'UserPlus', N'/configuration/users', 6, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- ID 25 (General Masters under Masters & Config group ID 11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(25, N'General Masters', N'Database', NULL, 11, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- IDs 26 to 42 (General Masters Children)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(26, N'Religion Master', N'Heart', N'/configuration/religions', 25, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(27, N'Blood Group Master', N'Droplets', N'/configuration/blood-groups', 25, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(28, N'Caste Category', N'Users', N'/configuration/castes', 25, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(29, N'Sub-Caste Master', N'UserCircle', N'/configuration/sub-castes', 25, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(30, N'School House', N'Home', N'/configuration/houses', 25, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(31, N'Admission Types', N'UserCheck', N'/configuration/admission-types', 25, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(32, N'States Master', N'Map', N'/configuration/states', 25, 7, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(33, N'Cities Master', N'MapPin', N'/configuration/cities', 25, 8, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(34, N'School Sections', N'Layers', N'/configuration/school-sections', 25, 9, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(35, N'Shift Timetable', N'Clock', N'/configuration/shifts', 25, 10, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(36, N'Category Master', N'LayoutGrid', N'/configuration/categories', 25, 11, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(37, N'Session Master', N'Clock', N'/configuration/sessions', 25, 12, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(38, N'Batch Master', N'Users', N'/configuration/batches', 25, 13, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(39, N'Exam Type Master', N'Award', N'/configuration/exam-types', 25, 14, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(40, N'Designation Master', N'Briefcase', N'/configuration/designations', 25, 15, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(41, N'Occupation Master', N'Hammer', N'/configuration/occupations', 25, 16, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(42, N'Staff Initials', N'UserRound', N'/configuration/staff-initials', 25, 17, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(43, N'Weekday Master', N'Calendar', N'/configuration/weekdays', 25, 18, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(44, N'Holiday Master', N'CalendarCheck', N'/configuration/holidays', 25, 19, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(45, N'Attendance Statuses', N'CalendarCheck', N'/configuration/attendance-statuses', 25, 20, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;
GO

-- Role Mapping
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
