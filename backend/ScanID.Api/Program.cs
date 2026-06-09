using Microsoft.EntityFrameworkCore;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Services;
using ScanID.Api.Utilities;

var builder = WebApplication.CreateBuilder(args);

// CORS origins are environment specific. Read them from configuration first,
// then allow deployment slots to override with SCANID_CORS_ORIGINS=origin1,origin2.
var configuredCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();
var corsOriginsOverride = Environment.GetEnvironmentVariable("SCANID_CORS_ORIGINS");
var allowedCorsOrigins = !string.IsNullOrWhiteSpace(corsOriginsOverride)
    ? corsOriginsOverride.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    : configuredCorsOrigins;

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.Configure<RouteOptions>(options => 
{
    options.LowercaseUrls = true;
    options.LowercaseQueryStrings = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "ScanID School Management API",
        Version = "v1",
        Description = "API for student monitoring, attendance, and fee management."
    });
});

// Configure SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Decoupled Abstractions & Implementation services (SOLID, SRP, OCP, DIP)
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IErrorLogService, ErrorLogService>();
builder.Services.AddScoped<ISchoolService, SchoolService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFeeService, FeeService>();
builder.Services.AddScoped<IMarkService, MarkService>();

// Register Singleton queue service and hosted background worker for raw card scan (iodata) processing
builder.Services.AddSingleton<IIodataQueueService, IodataQueueService>();

bool enableIodataWorker = builder.Configuration.GetValue<bool>("BackgroundServices:EnableIodataWorker", true);
bool enableIodataFolderWatcher = builder.Configuration.GetValue<bool>("BackgroundServices:EnableIodataFolderWatcher", true);

if (enableIodataWorker)
{
    builder.Services.AddHostedService<IodataBackgroundWorker>();
}
if (enableIodataFolderWatcher)
{
    builder.Services.AddHostedService<IodataFolderWatcherService>();
}

// Configure CORS for React Frontend from appsettings/env instead of hard-coded origins.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(allowedCorsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();


// Global Exception Handler Middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        // Log to Filesystem
        FileLogger.LogError(ex);

        // Log to Database (optional, don't crash if DB is down)
        try 
        {
            var db = context.RequestServices.GetRequiredService<ApplicationDbContext>();
            db.ErrorLogs.Add(new ErrorLog
            {
                Message = ex.Message,
                Exception = ex.ToString(),
                Level = "Error",
                Timestamp = DateTime.Now,
                Properties = $"Path: {context.Request.Path}"
            });
            await db.SaveChangesAsync();
        }
        catch (Exception dbEx)
        {
            FileLogger.LogError(new Exception("Failed to log error to database. " + dbEx.Message, dbEx));
        }
        
        // Return a cleaner 500 error instead of throwing a raw exception that might leak info
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { 
            error = "Internal Server Error", 
            message = ex.Message,
            details = "Check server logs for more information."
        });
    }
});

// Enable Swagger UI always for easier local testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    //c.SwaggerEndpoint("/swagger/v1/swagger.json", "ScanID API v1");
    c.SwaggerEndpoint("/scanid_erp_api/swagger/v1/swagger.json", "ScanID API v1");
    c.RoutePrefix = "swagger"; // Keep it at /swagger
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // In development, we might not have SSL certificates configured locally, 
    // so we skip redirection to prevent "Empty Response" errors.
}
else 
{
    //app.UseHttpsRedirection();
}
app.UseStaticFiles(); // Enable serving of static files from wwwroot
app.UseCors("AllowReactApp");

app.MapGet("/", () => Results.Content("<h1>ScanID API is running!</h1><p>Visit <a href='/swagger'>Swagger UI</a> for endpoints.</p>", "text/html"));

app.UseAuthorization();
app.MapControllers();

// =========================================================================
// SELF-HEALING DATABASE INITIALIZER
// Automatically patches and aligns tables, constraints, and stored procedures
// to prevent any schema mismatch issues on startup.
// =========================================================================
try
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // 0. SELF-HEALING SCHEMA UPGRADE: Create Weekdays and Holidays, update Shifts columns, and alter Master Tables to include SchoolId/AcademicYearId
        _ = await context.Database.ExecuteSqlRawAsync(@"
            -- Create Weekdays table if not exists
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Weekdays]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[Weekdays](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [Name] [nvarchar](100) NOT NULL,
                    [SchoolId] [int] NULL,
                    [AcademicYearId] [int] NULL,
                    [IsActive] [bit] NOT NULL CONSTRAINT [DF_Weekdays_IsActive] DEFAULT (1),
                    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Weekdays_IsDeleted] DEFAULT (0),
                    [CreatedBy] [nvarchar](max) NULL,
                    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Weekdays_CreatedOn] DEFAULT (GETUTCDATE()),
                    [ModifiedBy] [nvarchar](max) NULL,
                    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Weekdays_ModifiedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_Weekdays] PRIMARY KEY CLUSTERED ([Id] ASC)
                );

                INSERT INTO [dbo].[Weekdays] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES 
                (N'Monday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Tuesday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Wednesday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Thursday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Friday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Saturday', 1, GETUTCDATE(), GETUTCDATE()),
                (N'Sunday', 1, GETUTCDATE(), GETUTCDATE());
            END

            -- Create Holidays table if not exists
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Holidays]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[Holidays](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [Name] [nvarchar](150) NOT NULL,
                    [FromDate] [datetime2](7) NOT NULL,
                    [ToDate] [datetime2](7) NOT NULL,
                    [Description] [nvarchar](max) NULL,
                    [SchoolId] [int] NULL,
                    [AcademicYearId] [int] NULL,
                    [IsActive] [bit] NOT NULL CONSTRAINT [DF_Holidays_IsActive] DEFAULT (1),
                    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_Holidays_IsDeleted] DEFAULT (0),
                    [CreatedBy] [nvarchar](max) NULL,
                    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Holidays_CreatedOn] DEFAULT (GETUTCDATE()),
                    [ModifiedBy] [nvarchar](max) NULL,
                    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_Holidays_ModifiedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_Holidays] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END

            -- Create AttendanceStatuses table if not exists
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AttendanceStatuses]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[AttendanceStatuses](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [Code] [nvarchar](20) NOT NULL,
                    [Name] [nvarchar](100) NOT NULL,
                    [SchoolId] [int] NULL,
                    [AcademicYearId] [int] NULL,
                    [IsActive] [bit] NOT NULL CONSTRAINT [DF_AttendanceStatuses_IsActive] DEFAULT (1),
                    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_AttendanceStatuses_IsDeleted] DEFAULT (0),
                    [CreatedBy] [nvarchar](max) NULL,
                    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_AttendanceStatuses_CreatedOn] DEFAULT (GETUTCDATE()),
                    [ModifiedBy] [nvarchar](max) NULL,
                    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_AttendanceStatuses_ModifiedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_AttendanceStatuses] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END

            -- Seed and Align AttendanceStatuses exactly to official FRS spec
            MERGE [dbo].[AttendanceStatuses] AS target
            USING (SELECT * FROM (VALUES
                (N'P', N'Present'),
                (N'PL', N'Present but Late'),
                (N'PVL', N'Present but Very Late'),
                (N'A', N'Absent'),
                (N'H', N'Holiday'),
                (N'EG', N'Early Goer'),
                (N'D', N'Discrepancy'),
                (N'L', N'Leave'),
                (N'WO', N'Weekly Off'),
                (N'HDP', N'Half Day Present'),
                (N'HDA', N'Half Day Absent')
            ) AS s(Code, Name)) AS source
            ON (target.Code = source.Code)
            WHEN MATCHED THEN
                UPDATE SET Name = source.Name, IsDeleted = 0, IsActive = 1, ModifiedOn = GETUTCDATE()
            WHEN NOT MATCHED THEN
                INSERT (Code, Name, IsActive, IsDeleted, CreatedOn, ModifiedOn)
                VALUES (source.Code, source.Name, 1, 0, GETUTCDATE(), GETUTCDATE());

            -- Create LeaveApplications table if not exists (Enterprise leave integration)
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LeaveApplications]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[LeaveApplications](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [StudentId] [int] NULL,
                    [StaffId] [int] NULL,
                    [FromDate] [datetime2](7) NOT NULL,
                    [ToDate] [datetime2](7) NOT NULL,
                    [Status] [nvarchar](50) NOT NULL CONSTRAINT [DF_LeaveApplications_Status] DEFAULT ('Approved'),
                    [Remarks] [nvarchar](max) NULL,
                    [SchoolId] [int] NULL,
                    [AcademicYearId] [int] NULL,
                    [IsActive] [bit] NOT NULL CONSTRAINT [DF_LeaveApplications_IsActive] DEFAULT (1),
                    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_LeaveApplications_IsDeleted] DEFAULT (0),
                    [CreatedBy] [nvarchar](max) NULL,
                    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_LeaveApplications_CreatedOn] DEFAULT (GETUTCDATE()),
                    [ModifiedBy] [nvarchar](max) NULL,
                    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_LeaveApplications_ModifiedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_LeaveApplications] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END

            -- Create AttendanceAuditLogs table if not exists (Enterprise full audit trail)
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AttendanceAuditLogs]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[AttendanceAuditLogs](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [AttendanceId] [int] NOT NULL,
                    [OldStatus] [nvarchar](20) NOT NULL,
                    [NewStatus] [nvarchar](20) NOT NULL,
                    [Remarks] [nvarchar](500) NULL,
                    [ChangedBy] [int] NOT NULL,
                    [ChangedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_AttendanceAuditLogs_ChangedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_AttendanceAuditLogs] PRIMARY KEY CLUSTERED ([Id] ASC)
                );
            END

            -- Add new Shift columns if they do not exist
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND type in (N'U'))
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'Weekdays')
                    ALTER TABLE [dbo].[Shifts] ADD [Weekdays] NVARCHAR(MAX) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'IsSpecialShift')
                    ALTER TABLE [dbo].[Shifts] ADD [IsSpecialShift] BIT NOT NULL CONSTRAINT [DF_Shifts_IsSpecialShift] DEFAULT (0);
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'FromDate')
                    ALTER TABLE [dbo].[Shifts] ADD [FromDate] DATETIME2(7) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND name = 'ToDate')
                    ALTER TABLE [dbo].[Shifts] ADD [ToDate] DATETIME2(7) NULL;
            END

            -- Add StandardId column to Subjects if not exists
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Subjects]') AND type in (N'U'))
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Subjects]') AND name = 'StandardId')
                BEGIN
                    ALTER TABLE [dbo].[Subjects] ADD [StandardId] INT NULL;
                END
            END

            -- Remove the extra column AcademicYearId from AcademicYears table if it got added previously
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AcademicYears]') AND type in (N'U'))
            BEGIN
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AcademicYears]') AND name = 'AcademicYearId')
                BEGIN
                    -- Drop any default constraints on AcademicYearId before dropping the column
                    DECLARE @constraint_name_ay NVARCHAR(256);
                    SELECT @constraint_name_ay = d.name 
                    FROM sys.default_constraints d
                    JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                    WHERE d.parent_object_id = OBJECT_ID(N'[dbo].[AcademicYears]') AND c.name = 'AcademicYearId';

                    IF @constraint_name_ay IS NOT NULL
                    BEGIN
                        EXEC('ALTER TABLE [dbo].[AcademicYears] DROP CONSTRAINT [' + @constraint_name_ay + ']');
                    END

                    ALTER TABLE [dbo].[AcademicYears] DROP COLUMN [AcademicYearId];
                END
            END

            -- Gracefully append SchoolId and AcademicYearId columns where required and realign audit columns to the end
            DECLARE @tableName NVARCHAR(256)
            DECLARE @sql NVARCHAR(MAX)

            DECLARE table_cursor CURSOR FOR
            SELECT name FROM sys.tables 
            WHERE name IN (
                'Standards', 'Sections', 'Castes', 'SubCastes', 
                'Religions', 'States', 'Cities', 'BloodGroups', 'Houses', 
                'AdmissionTypes', 'Categories', 'Sessions', 'Batches', 'Subjects', 
                'ExamTypes', 'Designations', 'Occupations', 'Roles', 'SchoolSections', 
                'StaffInitials', 'Shifts', 'Messages', 'Notifications', 'IodataRecords',
                'Attendance', 'AuditLogs', 'ErrorLogs', 'Fees', 'Marks', 'NavigationItems',
                'Users', 'Staff', 'Students', 'Weekdays', 'Holidays', 'AcademicYears', 'Schools', 'AttendanceStatuses', 'LeaveApplications'
            )

            OPEN table_cursor
            FETCH NEXT FROM table_cursor INTO @tableName

            WHILE @@FETCH_STATUS = 0
            BEGIN
                -- 1. Remove AcademicYearId from AcademicYears table if it got added previously
                IF @tableName = 'AcademicYears'
                BEGIN
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AcademicYears]') AND name = 'AcademicYearId')
                    BEGIN
                        DECLARE @constraint_ay NVARCHAR(256);
                        SELECT @constraint_ay = d.name 
                        FROM sys.default_constraints d
                        JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                        WHERE d.parent_object_id = OBJECT_ID(N'[dbo].[AcademicYears]') AND c.name = 'AcademicYearId';

                        IF @constraint_ay IS NOT NULL
                        BEGIN
                            EXEC('ALTER TABLE [dbo].[AcademicYears] DROP CONSTRAINT [' + @constraint_ay + ']');
                        END

                        ALTER TABLE [dbo].[AcademicYears] DROP COLUMN [AcademicYearId];
                    END
                END

                -- 2. Check and add SchoolId to all tables except 'Schools'
                IF @tableName <> 'Schools'
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'SchoolId')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' ADD [SchoolId] INT NULL;'
                        EXEC sp_executesql @sql
                    END
                END

                -- 3. Check and add AcademicYearId to all tables except 'Schools' and 'AcademicYears'
                IF @tableName <> 'Schools' AND @tableName <> 'AcademicYears'
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'AcademicYearId')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' ADD [AcademicYearId] INT NULL;'
                        EXEC sp_executesql @sql
                    END
                END

                -- Check and add IsDeleted for structures inheriting from BaseEntity like NavigationItems
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'IsDeleted')
                   AND @tableName = 'NavigationItems'
                BEGIN
                    SET @sql = 'ALTER TABLE [dbo].[NavigationItems] ADD [IsDeleted] BIT NOT NULL CONSTRAINT [DF_NavigationItems_IsDeleted] DEFAULT (0);'
                    EXEC sp_executesql @sql
                END

                -- 4. Now, let's realign audit columns if they are not at the end of the table
                -- That is, if any of [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn] columns
                -- have lower column_id than any non-audit columns (which indicates a misalignment)
                IF EXISTS (
                    SELECT 1 
                    FROM sys.columns c_audit
                    JOIN sys.columns c_new ON c_audit.object_id = c_new.object_id
                    WHERE c_audit.object_id = OBJECT_ID(@tableName)
                      AND c_audit.name IN ('IsActive', 'IsDeleted', 'CreatedBy', 'CreatedOn', 'ModifiedBy', 'ModifiedOn')
                      AND c_new.name NOT IN ('IsActive', 'IsDeleted', 'CreatedBy', 'CreatedOn', 'ModifiedBy', 'ModifiedOn', 'Id')
                      AND c_audit.column_id < c_new.column_id
                )
                BEGIN
                    -- A misalignment has been detected! Let's dynamically reposition the audit columns to the absolute end.
                    -- Drop parent default constraints for audit columns first
                    DECLARE @auditColName NVARCHAR(128)
                    DECLARE @constraintName NVARCHAR(256)
                    DECLARE constraint_cursor CURSOR FOR
                    SELECT c.name, d.name
                    FROM sys.default_constraints d
                    JOIN sys.columns c ON d.parent_column_id = c.column_id AND d.parent_object_id = c.object_id
                    WHERE d.parent_object_id = OBJECT_ID(@tableName) 
                      AND c.name IN ('IsActive', 'IsDeleted', 'CreatedOn', 'ModifiedOn')

                    OPEN constraint_cursor
                    FETCH NEXT FROM constraint_cursor INTO @auditColName, @constraintName
                    WHILE @@FETCH_STATUS = 0
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP CONSTRAINT ' + QUOTENAME(@constraintName)
                        EXEC sp_executesql @sql
                        FETCH NEXT FROM constraint_cursor INTO @auditColName, @constraintName
                    END
                    CLOSE constraint_cursor
                    DEALLOCATE constraint_cursor

                    -- Drop audit trail columns to re-append them at the end
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'IsActive')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [IsActive];'
                        EXEC sp_executesql @sql
                    END
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'IsDeleted')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [IsDeleted];'
                        EXEC sp_executesql @sql
                    END
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'CreatedBy')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [CreatedBy];'
                        EXEC sp_executesql @sql
                    END
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'CreatedOn')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [CreatedOn];'
                        EXEC sp_executesql @sql
                    END
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'ModifiedBy')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [ModifiedBy];'
                        EXEC sp_executesql @sql
                    END
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(@tableName) AND name = 'ModifiedOn')
                    BEGIN
                        SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' DROP COLUMN [ModifiedOn];'
                        EXEC sp_executesql @sql
                    END

                    -- Now re-add them beautifully at the end!
                    SET @sql = 'ALTER TABLE ' + QUOTENAME(@tableName) + ' ADD 
                        [IsActive] BIT NOT NULL DEFAULT (1), 
                        [IsDeleted] BIT NOT NULL DEFAULT (0), 
                        [CreatedBy] NVARCHAR(MAX) NULL, 
                        [CreatedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE()), 
                        [ModifiedBy] NVARCHAR(MAX) NULL, 
                        [ModifiedOn] DATETIME2(7) NOT NULL DEFAULT (GETUTCDATE());'
                    EXEC sp_executesql @sql
                END

                FETCH NEXT FROM table_cursor INTO @tableName
            END

            CLOSE table_cursor
            DEALLOCATE table_cursor

            -- Create Navigation entries for Weekday Master (43) and Holiday Master (44) if NavigationItems has items and they are missing
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NavigationItems]') AND type in (N'U'))
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM [dbo].[NavigationItems] WHERE [Id] = 43)
                BEGIN
                    SET IDENTITY_INSERT [dbo].[NavigationItems] ON;
                    INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [SchoolId], [AcademicYearId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
                    (43, N'Weekday Master', N'Calendar', N'/configuration/weekdays', 25, 18, NULL, NULL, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
                    SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;
                    
                    -- Assign to SuperAdmin (1) and Admin (2) fallback paths
                    IF EXISTS (SELECT 1 FROM [dbo].[NavigationRoles] WHERE [RoleId] = 1)
                        INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (43, 1);
                    IF EXISTS (SELECT 1 FROM [dbo].[NavigationRoles] WHERE [RoleId] = 2)
                        INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (43, 2);
                END

                IF NOT EXISTS (SELECT 1 FROM [dbo].[NavigationItems] WHERE [Id] = 44)
                BEGIN
                    SET IDENTITY_INSERT [dbo].[NavigationItems] ON;
                    INSERT INTO [dbo].[NavigationItems] ([Id], [Title], [Icon], [Path], [ParentId], [SortOrder], [SchoolId], [AcademicYearId], [IsActive], [IsDeleted], [CreatedBy], [CreatedOn], [ModifiedBy], [ModifiedOn]) VALUES
                    (44, N'Holiday Master', N'CalendarCheck', N'/configuration/holidays', 25, 19, NULL, NULL, 1, 0, N'SYSTEM', GETUTCDATE(), N'SYSTEM', GETUTCDATE());
                    SET IDENTITY_INSERT [dbo].[NavigationItems] OFF;

                    -- Assign to SuperAdmin (1) and Admin (2) fallback paths
                    IF EXISTS (SELECT 1 FROM [dbo].[NavigationRoles] WHERE [RoleId] = 1)
                        INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (44, 1);
                    IF EXISTS (SELECT 1 FROM [dbo].[NavigationRoles] WHERE [RoleId] = 2)
                        INSERT INTO [dbo].[NavigationRoles] ([NavigationItemId], [RoleId]) VALUES (44, 2);
                END
            END
        ");

        // 1. Ensure StaffInitials table exists and is populated
        _ = await context.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StaffInitials]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[StaffInitials](
                    [Id] [int] IDENTITY(1,1) NOT NULL,
                    [Name] [nvarchar](100) NOT NULL,
                    [IsActive] [bit] NOT NULL CONSTRAINT [DF_StaffInitials_IsActive] DEFAULT (1),
                    [IsDeleted] [bit] NOT NULL CONSTRAINT [DF_StaffInitials_IsDeleted] DEFAULT (0),
                    [CreatedBy] [nvarchar](max) NULL,
                    [CreatedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_StaffInitials_CreatedOn] DEFAULT (GETUTCDATE()),
                    [ModifiedBy] [nvarchar](max) NULL,
                    [ModifiedOn] [datetime2](7) NOT NULL CONSTRAINT [DF_StaffInitials_ModifiedOn] DEFAULT (GETUTCDATE()),
                 CONSTRAINT [PK_StaffInitials] PRIMARY KEY CLUSTERED ([Id] ASC)
                );

                INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'Mr.', 1, GETUTCDATE(), GETUTCDATE());
                INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'Mrs.', 1, GETUTCDATE(), GETUTCDATE());
                INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'Ms.', 1, GETUTCDATE(), GETUTCDATE());
                INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'Dr.', 1, GETUTCDATE(), GETUTCDATE());
                INSERT INTO [dbo].[StaffInitials] ([Name], [IsActive], [CreatedOn], [ModifiedOn]) VALUES (N'Prof.', 1, GETUTCDATE(), GETUTCDATE());
            END
        ");

        // 2. Clear old constraints on Teachers table and DROP Teachers table if Staff table already exists
        _ = await context.Database.ExecuteSqlRawAsync(@"
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
            BEGIN
                IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Teachers]') AND type in (N'U'))
                BEGIN
                    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Teachers_Users_UserId' AND parent_object_id = OBJECT_ID('dbo.Teachers'))
                        ALTER TABLE [dbo].[Teachers] DROP CONSTRAINT [FK_Teachers_Users_UserId];
                    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Teachers_Schools_SchoolId' AND parent_object_id = OBJECT_ID('dbo.Teachers'))
                        ALTER TABLE [dbo].[Teachers] DROP CONSTRAINT [FK_Teachers_Schools_SchoolId];
                    
                    DROP TABLE [dbo].[Teachers];
                END
            END
        ");

        // 3. Re-align and update sp_ManageUser stored procedure dynamically to support @ModifiedBy (11 parameters)
        _ = await context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.sp_ManageUser', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ManageUser;");
        _ = await context.Database.ExecuteSqlRawAsync(@"
            CREATE PROCEDURE dbo.sp_ManageUser
                @Action NVARCHAR(10),
                @Id INT = NULL,
                @Username NVARCHAR(100) = NULL,
                @PasswordHash NVARCHAR(255) = NULL,
                @Name NVARCHAR(100) = NULL,
                @Email NVARCHAR(100) = NULL,
                @Role NVARCHAR(50) = NULL,
                @RoleId INT = NULL,
                @SchoolId INT = NULL,
                @CreatedBy NVARCHAR(100) = NULL,
                @ModifiedBy NVARCHAR(100) = NULL
            AS
            BEGIN
                SET NOCOUNT ON;
                IF @Action = 'INSERT'
                BEGIN
                    IF @PasswordHash IS NULL OR @PasswordHash = ''
                    BEGIN
                        SET @PasswordHash = 'password123';
                    END

                    INSERT INTO [dbo].[Users] (
                        Username, PasswordHash, Name, Email, Role, RoleId, SchoolId, IsActive, IsDeleted, CreatedOn, ModifiedOn, CreatedBy, ModifiedBy
                    ) VALUES (
                        @Username, @PasswordHash, @Name, @Email, @Role, @RoleId, @SchoolId, 1, 0, GETUTCDATE(), GETUTCDATE(), @CreatedBy, @ModifiedBy
                    );
                    SELECT SCOPE_IDENTITY();
                END
                ELSE IF @Action = 'UPDATE'
                BEGIN
                    UPDATE [dbo].[Users] SET
                        Username = ISNULL(@Username, Username),
                        PasswordHash = ISNULL(@PasswordHash, PasswordHash),
                        Name = ISNULL(@Name, Name),
                        Email = ISNULL(@Email, Email),
                        Role = ISNULL(@Role, Role),
                        RoleId = ISNULL(@RoleId, RoleId),
                        SchoolId = ISNULL(@SchoolId, SchoolId),
                        ModifiedBy = ISNULL(@ModifiedBy, ModifiedBy),
                        ModifiedOn = GETUTCDATE()
                    WHERE Id = @Id;
                END
                ELSE IF @Action = 'DELETE'
                BEGIN
                    UPDATE [dbo].[Users] SET IsDeleted = 1, IsActive = 0, ModifiedOn = GETUTCDATE() WHERE Id = @Id;
                END
            END
        ");

        // 4. Drop redundant Temp_ columns from Staff table if they exist
        _ = await context.Database.ExecuteSqlRawAsync(@"
            IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND type in (N'U'))
            BEGIN
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_IsActive')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_IsActive];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_IsDeleted')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_IsDeleted];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_CreatedBy')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_CreatedBy];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_CreatedOn')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_CreatedOn];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_ModifiedBy')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_ModifiedBy];
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Staff]') AND name = 'Temp_ModifiedOn')
                    ALTER TABLE [dbo].[Staff] DROP COLUMN [Temp_ModifiedOn];
            END
        ");
    }
}
catch (Exception ex)
{
    FileLogger.LogError(new Exception("Database self-healing initializer failed: " + ex.Message, ex));
}

app.Run();

