-- Incremental database update: Added AlertTypes master table with pre-seeded values.

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AlertTypes]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[AlertTypes](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Code] [nvarchar](50) NOT NULL,
    [Name] [nvarchar](100) NOT NULL,
    [IsActive] [bit] NOT NULL DEFAULT (1),
    [IsDeleted] [bit] NOT NULL DEFAULT (0),
    [CreatedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
    [ModifiedOn] [datetime2](7) NOT NULL DEFAULT (GETUTCDATE()),
 CONSTRAINT [PK_AlertTypes] PRIMARY KEY CLUSTERED ([Id] ASC)
);

INSERT INTO [dbo].[AlertTypes] ([Code], [Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'info', N'Info (Blue)', 1, GETUTCDATE(), GETUTCDATE());
INSERT INTO [dbo].[AlertTypes] ([Code], [Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'success', N'Success (Green)', 1, GETUTCDATE(), GETUTCDATE());
INSERT INTO [dbo].[AlertTypes] ([Code], [Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'warning', N'Warning (Amber)', 1, GETUTCDATE(), GETUTCDATE());
INSERT INTO [dbo].[AlertTypes] ([Code], [Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'error', N'Error (Red)', 1, GETUTCDATE(), GETUTCDATE());
END
GO
