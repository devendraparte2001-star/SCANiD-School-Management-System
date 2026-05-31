/*
  ScanID Implementation: Navigation Update v3 (Unified Sequential Alignment)
  Purpose: Ensures all navigation item seeding scripts produce the exact same clean table layout.
*/

USE ScanID_DB;
GO

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
(459, N'School Sections', N'Layers', N'/configuration/school-sections', 45, 9, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(460, N'Shift Timetable', N'Clock', N'/configuration/shifts', 45, 10, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

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
