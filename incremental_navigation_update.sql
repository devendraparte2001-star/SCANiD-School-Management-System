/*
  INCREMENTAL NAVIGATION UPDATE SCRIPT
  Description: Updates the navigation structure to be more hierarchical and comprehensive.
  Execution: Run this on your existing ScanID_DB database.
*/

USE ScanID_DB;
GO

-- 1. Ensure Navigation Tables exist (Forward compatibility if not already in main schema)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NavigationItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NavigationItems](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Title] [nvarchar](100) NOT NULL,
        [Icon] [nvarchar](100) NULL,
        [Path] [nvarchar](255) NULL,
        [ParentId] [int] NULL,
        [SortOrder] [int] NOT NULL DEFAULT (0),
        [IsActive] [bit] NOT NULL DEFAULT (1),
        [CreatedBy] [nvarchar](max) NULL,
        [CreatedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
        [ModifiedBy] [nvarchar](max) NULL,
        [ModifiedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
     CONSTRAINT [PK_NavigationItems] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NavigationRoles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NavigationRoles](
        [NavigationItemId] [int] NOT NULL,
        [RoleId] [int] NOT NULL,
     CONSTRAINT [PK_NavigationRoles] PRIMARY KEY CLUSTERED ([NavigationItemId] ASC, [RoleId] ASC),
     CONSTRAINT [FK_NavigationRoles_NavigationItems] FOREIGN KEY([NavigationItemId]) REFERENCES [dbo].[NavigationItems] ([Id]) ON DELETE CASCADE,
     CONSTRAINT [FK_NavigationRoles_Roles] FOREIGN KEY([RoleId]) REFERENCES [dbo].[Roles] ([Id]) ON DELETE CASCADE
    );
END
GO

-- 2. Clear existing navigation to rebuild hierarchy
DELETE FROM [dbo].[NavigationRoles];
DELETE FROM [dbo].[NavigationItems];
GO

-- 3. Rebuild Hierarchical Navigation
SET IDENTITY_INSERT [dbo].[NavigationItems] ON;

-- Level 0: Top Level Parents & Standalone Items
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES 
(1, N'Dashboard', N'LayoutDashboard', N'/', NULL, 1),
(1000, N'Academic Operations', N'BookOpen', NULL, NULL, 2),
(2000, N'Staff & HR', N'Users', NULL, NULL, 3),
(3000, N'Administrative', N'ShieldCheck', NULL, NULL, 4),
(4000, N'Masters & Config', N'Database', N'/configuration', NULL, 5),
(5000, N'System Audit', N'Terminal', N'/system-logs', NULL, 6);

-- Level 1: Sub-items for Academic Operations (1000)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES 
(11, N'Student Registry', N'GraduationCap', N'/students', 1000, 1),
(12, N'Attendance Tracking', N'CalendarCheck', N'/attendance', 1000, 2),
(13, N'Examination & Marks', N'BarChart3', N'/marks', 1000, 3);

-- Level 1: Sub-items for Staff & HR (2000)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES 
(21, N'Staff Directory', N'UserCheck', N'/teachers', 2000, 1);

-- Level 1: Sub-items for Administrative (3000)
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES 
(31, N'Fee Management', N'CreditCard', N'/fees', 3000, 1),
(32, N'Communication Hub', N'MessageSquare', N'/messages', 3000, 2);

-- Level 1: Sub-items for Configuration (4000) - Deep links
INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder]) VALUES 
(41, N'Global Schools', N'School', N'/configuration/schools', 4000, 1),
(42, N'Access Control (RBAC)', N'Key', N'/role-assignment', 4000, 2),
(43, N'Menu Designer', N'Layout', N'/navigation-management', 4000, 3),
(44, N'Academic Masters', N'BookOpen', N'/configuration/masters', 4000, 4);

SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;
GO

-- 4. Map Roles to Navigation Items using dynamic Lookup
-- Note: Roles table should exist with names SuperAdmin, Admin, Teacher, etc.
DECLARE @SRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'SuperAdmin' OR [Name] = 'Super Admin');
DECLARE @ARoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Admin');
DECLARE @TRoleId INT = (SELECT Id FROM [dbo].[Roles] WHERE [Name] = 'Teacher');

-- SuperAdmin gets everything
IF @SRoleId IS NOT NULL
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) SELECT Id, @SRoleId FROM [dbo].[NavigationItems];

-- Admin gets most except System Audit and deep config
IF @ARoleId IS NOT NULL
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) SELECT Id, @ARoleId FROM [dbo].[NavigationItems] WHERE Id NOT IN (5000, 42, 43);

-- Teacher gets critical operational items
IF @TRoleId IS NOT NULL
BEGIN
    INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES 
    (1, @TRoleId), (1000, @TRoleId), (11, @TRoleId), (12, @TRoleId), (13, @TRoleId), (2000, @TRoleId), (21, @TRoleId), (3000, @TRoleId), (32, @TRoleId);
END
GO
