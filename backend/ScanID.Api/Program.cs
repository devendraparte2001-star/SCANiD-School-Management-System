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
builder.Services.AddHostedService<IodataBackgroundWorker>();
builder.Services.AddHostedService<IodataFolderWatcherService>();

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

app.Run();

