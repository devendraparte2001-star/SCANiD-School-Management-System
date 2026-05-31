-- =========================================================================================
-- INCREMENTAL DATABASE MIGRATION SCRIPT: SHIFT TIMETABLE SCHEEMA & AUDIT COLUMNS REALIGNMENT
-- Add StartTime, EndTime, GraceInTime, SpanInTime, LunchStart, LunchEnd columns,
-- and ensures that all audit trail columns reside at the absolute end of the table structure.
-- =========================================================================================

USE ScanID_DB;
GO

PRINT 'Starting Shift Timetable schema audit realignment...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND type in (N'U'))
BEGIN
    PRINT 'Shifts table exists. Proceeding with safe audit column realignment...';

    -- 1. Create a temporary staging table to hold existing Shifts records and audit metadata
    IF OBJECT_ID('tempdb..#TempShiftsData') IS NOT NULL DROP TABLE #TempShiftsData;
    
    CREATE TABLE #TempShiftsData (
        Id INT PRIMARY KEY,
        Name NVARCHAR(100),
        StartTime NVARCHAR(15) NULL,
        EndTime NVARCHAR(15) NULL,
        GraceInTime NVARCHAR(15) NULL,
        SpanInTime NVARCHAR(15) NULL,
        LunchStart NVARCHAR(15) NULL,
        LunchEnd NVARCHAR(15) NULL,
        IsActive BIT NULL,
        IsDeleted BIT NULL,
        CreatedBy NVARCHAR(MAX) NULL,
        CreatedOn DATETIME2(7) NULL,
        ModifiedBy NVARCHAR(MAX) NULL,
        ModifiedOn DATETIME2(7) NULL
    );

    -- 2. Dynamically select existing columns from [dbo].[Shifts] to populate staging table
    DECLARE @SelectSql NVARCHAR(MAX) = 'INSERT INTO #TempShiftsData (Id, Name, StartTime, EndTime, GraceInTime, SpanInTime, LunchStart, LunchEnd, IsActive, IsDeleted, CreatedBy, CreatedOn, ModifiedBy, ModifiedOn) SELECT Id, Name';

    -- StartTime
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'StartTime')
        SET @SelectSql = @SelectSql + ', StartTime';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- EndTime
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'EndTime')
        SET @SelectSql = @SelectSql + ', EndTime';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- GraceInTime
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'GraceInTime')
        SET @SelectSql = @SelectSql + ', GraceInTime';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- SpanInTime
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'SpanInTime')
        SET @SelectSql = @SelectSql + ', SpanInTime';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- LunchStart
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'LunchStart')
        SET @SelectSql = @SelectSql + ', LunchStart';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- LunchEnd
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'LunchEnd')
        SET @SelectSql = @SelectSql + ', LunchEnd';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- IsActive
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'IsActive')
        SET @SelectSql = @SelectSql + ', IsActive';
    ELSE
        SET @SelectSql = @SelectSql + ', 1';

    -- IsDeleted
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'IsDeleted')
        SET @SelectSql = @SelectSql + ', IsDeleted';
    ELSE
        SET @SelectSql = @SelectSql + ', 0';

    -- CreatedBy
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'CreatedBy')
        SET @SelectSql = @SelectSql + ', CreatedBy';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- CreatedOn
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'CreatedOn')
        SET @SelectSql = @SelectSql + ', CreatedOn';
    ELSE
        SET @SelectSql = @SelectSql + ', GETUTCDATE()';

    -- ModifiedBy
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'ModifiedBy')
        SET @SelectSql = @SelectSql + ', ModifiedBy';
    ELSE
        SET @SelectSql = @SelectSql + ', NULL';

    -- ModifiedOn
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'ModifiedOn')
        SET @SelectSql = @SelectSql + ', ModifiedOn';
    ELSE
        SET @SelectSql = @SelectSql + ', GETUTCDATE()';

    SET @SelectSql = @SelectSql + ' FROM [dbo].[Shifts]';

    PRINT 'Executing data staging query: ' + @SelectSql;
    EXEC sp_executesql @SelectSql;

    -- 3. Drop all dependent default constraints on both audit trail and existing custom columns
    PRINT 'Dropping default constraints...';
    DECLARE @DropConstraintsSql NVARCHAR(MAX) = '';
    SELECT @DropConstraintsSql = @DropConstraintsSql + 'ALTER TABLE [dbo].[Shifts] DROP CONSTRAINT [' + d.name + '];' + CHAR(13) + CHAR(10)
    FROM sys.default_constraints d
    INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
    WHERE d.parent_object_id = OBJECT_ID('dbo.Shifts')
      AND c.name IN ('IsActive', 'IsDeleted', 'CreatedOn', 'ModifiedOn');

    IF @DropConstraintsSql <> ''
    BEGIN
        EXEC sp_executesql @DropConstraintsSql;
    END;

    -- 4. Drop non-primary key columns dynamically to pave path for correctly ordered columns
    PRINT 'Dropping original columns to realign physical structure...';
    DECLARE @DropColumnsSql NVARCHAR(MAX) = 'ALTER TABLE [dbo].[Shifts] DROP COLUMN ';
    DECLARE @ColumnsToDrop NVARCHAR(MAX) = '';

    -- Gather columns that must be dropped and appended back in exact sequential order
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'StartTime') SET @ColumnsToDrop = @ColumnsToDrop + '[StartTime],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'EndTime') SET @ColumnsToDrop = @ColumnsToDrop + '[EndTime],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'GraceInTime') SET @ColumnsToDrop = @ColumnsToDrop + '[GraceInTime],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'SpanInTime') SET @ColumnsToDrop = @ColumnsToDrop + '[SpanInTime],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'LunchStart') SET @ColumnsToDrop = @ColumnsToDrop + '[LunchStart],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'LunchEnd') SET @ColumnsToDrop = @ColumnsToDrop + '[LunchEnd],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'IsActive') SET @ColumnsToDrop = @ColumnsToDrop + '[IsActive],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'IsDeleted') SET @ColumnsToDrop = @ColumnsToDrop + '[IsDeleted],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'CreatedBy') SET @ColumnsToDrop = @ColumnsToDrop + '[CreatedBy],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'CreatedOn') SET @ColumnsToDrop = @ColumnsToDrop + '[CreatedOn],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'ModifiedBy') SET @ColumnsToDrop = @ColumnsToDrop + '[ModifiedBy],';
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'ModifiedOn') SET @ColumnsToDrop = @ColumnsToDrop + '[ModifiedOn],';

    IF @ColumnsToDrop <> ''
    BEGIN
        SET @ColumnsToDrop = LEFT(@ColumnsToDrop, LEN(@ColumnsToDrop) - 1);
        SET @DropColumnsSql = @DropColumnsSql + @ColumnsToDrop;
        EXEC sp_executesql @DropColumnsSql;
    END;

    -- 5. Add custom columns followed directly by the audit trail columns to lock them at the physical end of the block
    PRINT 'Adding columns back in correct architectural order...';
    EXEC('
    ALTER TABLE [dbo].[Shifts] ADD [StartTime] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [EndTime] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [GraceInTime] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [SpanInTime] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [LunchStart] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [LunchEnd] [nvarchar](15) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [IsActive] [bit] NOT NULL CONSTRAINT [DF_Shifts_IsActive] DEFAULT (1);
    ALTER TABLE [dbo].[Shifts] ADD [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Shifts_IsDeleted] DEFAULT (0);
    ALTER TABLE [dbo].[Shifts] ADD [CreatedBy] [nvarchar](max) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Shifts_CreatedOn] DEFAULT (GETUTCDATE());
    ALTER TABLE [dbo].[Shifts] ADD [ModifiedBy] [nvarchar](max) NULL;
    ALTER TABLE [dbo].[Shifts] ADD [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Shifts_ModifiedOn] DEFAULT (GETUTCDATE());
    ');

    -- 6. Restore data back from the temporary staging table perfectly preserving existing values
    PRINT 'Restoring staged data...';
    EXEC('
    UPDATE s SET 
        s.[StartTime] = t.[StartTime],
        s.[EndTime] = t.[EndTime],
        s.[GraceInTime] = t.[GraceInTime],
        s.[SpanInTime] = t.[SpanInTime],
        s.[LunchStart] = t.[LunchStart],
        s.[LunchEnd] = t.[LunchEnd],
        s.[IsActive] = COALESCE(t.[IsActive], 1),
        s.[IsDeleted] = COALESCE(t.[IsDeleted], 0),
        s.[CreatedBy] = t.[CreatedBy],
        s.[CreatedOn] = COALESCE(t.[CreatedOn], GETUTCDATE()),
        s.[ModifiedBy] = t.[ModifiedBy],
        s.[ModifiedOn] = COALESCE(t.[ModifiedOn], GETUTCDATE())
    FROM [dbo].[Shifts] s
    INNER JOIN #TempShiftsData t ON s.Id = t.Id;
    ');

    -- Clean up staging resources
    IF OBJECT_ID('tempdb..#TempShiftsData') IS NOT NULL DROP TABLE #TempShiftsData;
    PRINT 'Audit trail realignment completed successfully for Shifts table.';
END
ELSE
BEGIN
    PRINT 'Shifts table did not exist. It will be created correctly ordered from database.sql instead.';
END;
GO
