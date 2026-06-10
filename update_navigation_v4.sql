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
(13, N'Staff & HR', N'Users', NULL, NULL, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(16, N'Administrative', N'ShieldCheck', NULL, NULL, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(20, N'Masters & Config', N'Database', N'/configuration', NULL, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(53, N'System Audit', N'Terminal', N'/system-logs', NULL, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Academic Operations - Id: 2)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(3, N'Student Registry', N'GraduationCap', N'/students', 2, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(4, N'Attendance Tracking', N'CalendarCheck', NULL, 2, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(12, N'Examination & Marks', N'BarChart3', N'/marks', 2, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Attendance Tracking - Id: 4)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(5, N'Roll Call', N'CalendarCheck', N'/attendance/daily', 4, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(6, N'Manual Upload', N'Upload', N'/attendance/manual', 4, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(7, N'Leaves Register', N'CalendarClock', N'/attendance/leaves', 4, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(8, N'Reprocess Range', N'RefreshCw', N'/attendance/reprocess', 4, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(9, N'Payroll Lock', N'Lock', N'/attendance/lock', 4, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(10, N'Correction Audit', N'History', N'/attendance/audit', 4, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(11, N'Reports', N'BarChart3', N'/attendance/report', 4, 7, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Staff & HR - Id: 13)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(14, N'Staff Directory', N'UserCheck', N'/staff', 13, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(15, N'Manage Users', N'UserPlus', N'/configuration/users', 13, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Administrative - Id: 16)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(17, N'Fee Management', N'CreditCard', N'/fees', 16, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(18, N'Communication Hub', N'MessageSquare', N'/messages', 16, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(19, N'Notification Center', N'Bell', N'/notifications', 16, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 1 (Under Masters & Config - Id: 20)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(21, N'Global Schools', N'School', N'/configuration/schools', 20, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(22, N'Access Control (RBAC)', N'Key', NULL, 20, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(25, N'Menu Designer', N'Layout', NULL, 20, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(27, N'Academic Masters', N'BookOpen', NULL, 20, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(32, N'General Masters', N'Database', NULL, 20, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Access Control (RBAC) - Id: 22)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(23, N'Role Master', N'Shield', N'/configuration/role-master', 22, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(24, N'User Accounts', N'UserCheck', N'/configuration/role-assignment', 22, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Menu Designer - Id: 25)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(26, N'Navigation Builder', N'LayoutGrid', N'/configuration/navigation', 25, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under Academic Masters - Id: 27)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(28, N'Standards & Grades', N'Layers', N'/configuration/standards', 27, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(29, N'Divisions/Sections', N'Hash', N'/configuration/sections', 27, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(30, N'Academic Years', N'Calendar', N'/configuration/academic-years', 27, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(31, N'Subject Registry', N'BookOpen', N'/configuration/subjects', 27, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

-- Level 2 (Under General Masters - Id: 32)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
(33, N'Religion Master', N'Heart', N'/configuration/religions', 32, 1, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(34, N'Blood Group Master', N'Droplets', N'/configuration/blood-groups', 32, 2, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(35, N'Caste Category', N'Users', N'/configuration/castes', 32, 3, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(36, N'Sub-Caste Master', N'UserCircle', N'/configuration/sub-castes', 32, 4, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(37, N'School House', N'Home', N'/configuration/houses', 32, 5, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(38, N'Admission Types', N'UserCheck', N'/configuration/admission-types', 32, 6, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(39, N'States Master', N'Map', N'/configuration/states', 32, 7, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(40, N'Cities Master', N'MapPin', N'/configuration/cities', 32, 8, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(41, N'School Sections', N'Layers', N'/configuration/school-sections', 32, 9, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(42, N'Shift Timetable', N'Clock', N'/configuration/shifts', 32, 10, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(43, N'Category Master', N'LayoutGrid', N'/configuration/categories', 32, 11, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(44, N'Session Master', N'Clock', N'/configuration/sessions', 32, 12, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(45, N'Batch Master', N'Users', N'/configuration/batches', 32, 13, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(46, N'Exam Type Master', N'Award', N'/configuration/exam-types', 32, 14, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(47, N'Designation Master', N'Briefcase', N'/configuration/designations', 32, 15, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(48, N'Occupation Master', N'Hammer', N'/configuration/occupations', 32, 16, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(49, N'Staff Initials', N'UserRound', N'/configuration/staff-initials', 32, 17, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(50, N'Weekday Master', N'Calendar', N'/configuration/weekdays', 32, 18, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(51, N'Holiday Master', N'CalendarCheck', N'/configuration/holidays', 32, 19, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE()),
(52, N'Attendance Statuses', N'CalendarCheck', N'/configuration/attendance-statuses', 32, 20, 1, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());

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

-- Map Admin (Access to all except System Audit - ID: 53)
IF @AdminId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    SELECT Id, @AdminId FROM [dbo].[NavigationItems] WHERE [Id] <> 53;
END

-- Map Teacher
IF @TeacherId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @TeacherId), (2, @TeacherId), (3, @TeacherId), (4, @TeacherId), 
    (5, @TeacherId), (6, @TeacherId), (7, @TeacherId), (8, @TeacherId), (11, @TeacherId),
    (12, @TeacherId), (13, @TeacherId), (14, @TeacherId), (16, @TeacherId), (18, @TeacherId), (19, @TeacherId);
END

-- Map Student
IF @StudentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @StudentId), (2, @StudentId), (4, @StudentId), (5, @StudentId), (7, @StudentId), 
    (12, @StudentId), (16, @StudentId), (18, @StudentId), (19, @StudentId);
END

-- Map Parent
IF @ParentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES
    (1, @ParentId), (2, @ParentId), (3, @ParentId), (4, @ParentId), (7, @ParentId), (11, @ParentId),
    (12, @ParentId), (16, @ParentId), (17, @ParentId), (18, @ParentId), (19, @ParentId);
END
GO
