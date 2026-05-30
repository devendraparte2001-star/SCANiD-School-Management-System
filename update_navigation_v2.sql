/*
  ScanID Implementation: Navigation RBAC Final Patch
  Author: AI Assistant
  Date: 2024-05-24
  Purpose: Synchronizes database NavigationItems with the screenshot IDs and assigns deep RBAC for all roles.
*/

USE ScanID_DB;
GO

-- 1. Ensure all standard roles exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'SuperAdmin', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Admin') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Admin', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Teacher') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Teacher', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Student') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Student', 1, 0);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [Name] = 'Parent') INSERT INTO [dbo].[Roles] ([Name], [IsActive], [IsDeleted]) VALUES (N'Parent', 1, 0);

DECLARE @SuperAdminRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin');
DECLARE @AdminRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Admin');
DECLARE @TeacherRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Teacher');
DECLARE @StudentRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Student');
DECLARE @ParentRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Parent');

-- 2. Clean up existing roles for these groups to start fresh
DELETE FROM [dbo].[NavigationRoles] 
WHERE [NavigationItemId] IN (1, 1000, 11, 12, 13, 2000, 21, 3000, 31, 32, 4000, 41, 42, 43, 44, 421, 422, 431, 441, 442, 443, 444, 5000);

-- 3. HELPER PROCEDURE-LIKE INSERTS
-- Dashboard (1)
IF @SuperAdminRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1, @SuperAdminRoleId);
IF @AdminRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1, @AdminRoleId);
IF @TeacherRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1, @TeacherRoleId);
IF @StudentRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1, @StudentRoleId);
IF @ParentRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1, @ParentRoleId);

-- Academic Operations (1000) and children
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, r.Id
FROM (SELECT 1000 AS Id UNION SELECT 11 UNION SELECT 12 UNION SELECT 13) n
CROSS JOIN (SELECT @SuperAdminRoleId AS Id UNION SELECT @AdminRoleId UNION SELECT @TeacherRoleId) r
WHERE r.Id IS NOT NULL;

-- Parent access to Academic Operations (limited)
IF @ParentRoleId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1000, @ParentRoleId); -- Parent item
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (11, @ParentRoleId); -- Student Registry
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (12, @ParentRoleId); -- Attendance
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (13, @ParentRoleId); -- Marks
END

-- Student access to Academic Operations (limited)
IF @StudentRoleId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (1000, @StudentRoleId); -- Parent item
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (12, @StudentRoleId); -- Attendance
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (13, @StudentRoleId); -- Marks
END

-- Staff & HR (2000) and Staff Directory (21)
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, r.Id
FROM (SELECT 2000 AS Id UNION SELECT 21) n
CROSS JOIN (SELECT @SuperAdminRoleId AS Id UNION SELECT @AdminRoleId UNION SELECT @TeacherRoleId) r
WHERE r.Id IS NOT NULL;

-- Administrative (3000) and Fee/Messages (31, 32)
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, r.Id
FROM (SELECT 3000 AS Id UNION SELECT 31 UNION SELECT 32) n
CROSS JOIN (SELECT @SuperAdminRoleId AS Id UNION SELECT @AdminRoleId) r
WHERE r.Id IS NOT NULL;

-- Specific access for Teacher/Parent/Student to Comm Hub (32) and Admin (3000)
IF @TeacherRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (3000, @TeacherRoleId), (32, @TeacherRoleId);
IF @ParentRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (3000, @ParentRoleId), (31, @ParentRoleId), (32, @ParentRoleId);
IF @StudentRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (3000, @StudentRoleId), (32, @StudentRoleId);

-- Masters & Config (4000) and children
INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, @SuperAdminRoleId
FROM [dbo].[NavigationItems] n
WHERE n.Id >= 4000 AND n.Id < 5000 AND @SuperAdminRoleId IS NOT NULL;

INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId])
SELECT n.Id, @AdminRoleId
FROM [dbo].[NavigationItems] n
WHERE n.Id >= 4000 AND n.Id < 5000 AND @AdminRoleId IS NOT NULL;

-- System Audit (5000)
IF @SuperAdminRoleId IS NOT NULL INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (5000, @SuperAdminRoleId);

PRINT 'Navigation RBAC mappings successfully synchronized with DB screenshot IDs.';
GO
