/*
  ScanID Implementation: Navigation RBAC Sequential ID Patch (v3)
  Author: AI Assistant
  Date: 2024-05-16
  Purpose: Resets and rebuilds the NavigationItems table with sequential IDs (1-23)
           and establishes correct RBAC mappings.
*/

USE ScanID_DB;
GO

-- 1. CLEANUP: Clear existing mappings and items
DELETE FROM [dbo].[NavigationRoles];
DELETE FROM [dbo].[NavigationItems];

-- 2. ENSURE ROLES EXIST
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'SuperAdmin', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Admin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Admin', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Teacher') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Teacher', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Student') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Student', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Parent') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Parent', 1, 0);

DECLARE @SuperAdminId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin');
DECLARE @AdminId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Admin');
DECLARE @TeacherId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Teacher');
DECLARE @StudentId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Student');
DECLARE @ParentId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Parent');

-- 3. INSERT NAVIGATION ITEMS WITH EXPLICIT IDS
SET IDENTITY_INSERT [dbo].[NavigationItems] ON;

-- Dashboard
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (1, N'Dashboard', N'LayoutDashboard', N'/', NULL, 1, 1, GETUTCDATE());

-- Academic Operations (2)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (2, N'Academic Operations', N'BookOpen', NULL, NULL, 2, 1, GETUTCDATE());
-- Children of Academic Operations
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (3, N'Student Registry', N'GraduationCap', N'/students', 2, 1, 1, GETUTCDATE()),
       (4, N'Attendance Tracking', N'CalendarCheck', N'/attendance', 2, 2, 1, GETUTCDATE()),
       (5, N'Examination & Marks', N'BarChart3', N'/marks', 2, 3, 1, GETUTCDATE());

-- Staff & HR (6)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (6, N'Staff & HR', N'Users', NULL, NULL, 3, 1, GETUTCDATE());
-- Children of Staff & HR
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (7, N'Staff Directory', N'UserCheck', N'/teachers', 6, 1, 1, GETUTCDATE());

-- Administrative (8)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (8, N'Administrative', N'ShieldCheck', NULL, NULL, 4, 1, GETUTCDATE());
-- Children of Administrative
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (9, N'Fee Management', N'CreditCard', N'/fees', 8, 1, 1, GETUTCDATE()),
       (10, N'Communication Hub', N'MessageSquare', N'/messages', 8, 2, 1, GETUTCDATE());

-- Masters & Config (11)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (11, N'Masters & Config', N'Database', N'/configuration', NULL, 5, 1, GETUTCDATE());
-- Children of Masters & Config
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (12, N'Global Schools', N'School', N'/configuration/schools', 11, 1, 1, GETUTCDATE());

-- Access Control Sub-group (13)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (13, N'Access Control (RBAC)', N'Key', NULL, 11, 2, 1, GETUTCDATE());
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (14, N'Role Master', N'Shield', N'/configuration/role-master', 13, 1, 1, GETUTCDATE()),
       (15, N'User Accounts', N'UserCheck', N'/configuration/role-assignment', 13, 2, 1, GETUTCDATE());

-- Menu Designer Sub-group (16)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (16, N'Menu Designer', N'Layout', NULL, 11, 3, 1, GETUTCDATE());
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (17, N'Navigation Builder', N'LayoutGrid', N'/configuration/navigation', 16, 1, 1, GETUTCDATE());

-- Academic Masters Sub-group (18)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (18, N'Academic Masters', N'BookOpen', NULL, 11, 4, 1, GETUTCDATE());
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (19, N'Standards & Grades', N'Layers', N'/configuration/standards', 18, 1, 1, GETUTCDATE()),
       (20, N'Divisions/Sections', N'Hash', N'/configuration/sections', 18, 2, 1, GETUTCDATE()),
       (21, N'Academic Years', N'Calendar', N'/configuration/academic-years', 18, 3, 1, GETUTCDATE()),
       (22, N'Subject Registry', N'BookOpen', N'/configuration/subjects', 18, 4, 1, GETUTCDATE());

-- System Audit (23)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [IsActive], [CreatedOn])
VALUES (23, N'System Audit', N'Terminal', N'/system-logs', NULL, 6, 1, GETUTCDATE());

SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;

-- 4. INSERT NAVIGATION ROLES (RBAC MAPPINGS)

-- Helper: Map all roles to an item
-- SuperAdmin & Admin get 1-22
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, r.Id
FROM [dbo].[NavigationItems] n
CROSS JOIN (SELECT @SuperAdminId AS Id UNION SELECT @AdminId) r
WHERE n.Id <= 22 AND r.Id IS NOT NULL;

-- SuperAdmin only for System Audit (23)
IF @SuperAdminId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (23, @SuperAdminId);

-- Teacher mappings
IF @TeacherId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    VALUES (1, @TeacherId), -- Dashboard
           (2, @TeacherId), (3, @TeacherId), (4, @TeacherId), (5, @TeacherId), -- Academic Ops
           (6, @TeacherId), (7, @TeacherId), -- Staff & HR
           (8, @TeacherId), (10, @TeacherId); -- Administrative & messages
END

-- Parent mappings
IF @ParentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    VALUES (1, @ParentId), -- Dashboard
           (2, @ParentId), (3, @ParentId), (4, @ParentId), (5, @ParentId), -- Academic Ops
           (8, @ParentId), (9, @ParentId), (10, @ParentId); -- Admin & Fees & Messages
END

-- Student mappings
IF @StudentId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
    VALUES (1, @StudentId), -- Dashboard
           (2, @StudentId), (4, @StudentId), (5, @StudentId), -- Academic Ops (Attendance & Marks)
           (8, @StudentId), (10, @StudentId); -- Admin & Messages
END

PRINT 'Navigation sequential IDs and RBAC successfully patched (v3).';
GO
