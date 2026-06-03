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

