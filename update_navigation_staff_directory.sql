-- Dynamic update of navigation title 'Teacher Catalog' to 'Staff Directory' to reflect renaming of Teachers to Staff
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NavigationItems]') AND type in (N'U'))
BEGIN
    UPDATE [dbo].[NavigationItems]
    SET [Title] = N'Staff Directory'
    WHERE [Title] = N'Teacher Catalog';
END;
GO
