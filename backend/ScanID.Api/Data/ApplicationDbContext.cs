using Microsoft.EntityFrameworkCore;
using ScanID.Api.Models;
using System.Text.Json;

namespace ScanID.Api.Data
{
    /// <summary>
    /// Database context for the ScanID application, handles audit logging and soft deletes.
    /// </summary>
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<School> Schools { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Attendance> Attendance { get; set; }
        public DbSet<Fee> Fees { get; set; }
        public DbSet<Mark> Marks { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ErrorLog> ErrorLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NavigationItem> NavigationItems { get; set; }
        public DbSet<NavigationRole> NavigationRoles { get; set; }
        public DbSet<IodataRecord> IodataRecords { get; set; }

        // Master Data Sets
        public DbSet<Standard> Standards { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<AcademicYear> AcademicYears { get; set; }
        public DbSet<Caste> Castes { get; set; }
        public DbSet<SubCaste> SubCastes { get; set; }
        public DbSet<Religion> Religions { get; set; }
        public DbSet<State> States { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<BloodGroup> BloodGroups { get; set; }
        public DbSet<House> Houses { get; set; }
        public DbSet<AdmissionType> AdmissionTypes { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Batch> Batches { get; set; }
        public DbSet<Shift> Shifts { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<ExamType> ExamTypes { get; set; }
        public DbSet<Designation> Designations { get; set; }
        public DbSet<Occupation> Occupations { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<SchoolSection> SchoolSections { get; set; }
        public DbSet<StaffInitial> StaffInitials { get; set; }
        public DbSet<Weekday> Weekdays { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<AttendanceStatus> AttendanceStatuses { get; set; }

        /// <summary>
        /// Configures the model, including global query filters for soft deletion.
        /// </summary>
        /// <param name="modelBuilder">The model builder.</param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure global query filter for IsDeleted
            modelBuilder.Entity<School>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<User>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Student>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Attendance>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Fee>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Mark>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Staff>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Message>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Notification>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<IodataRecord>().HasQueryFilter(x => !x.IsDeleted);

            // Configure NavigationRole composite key
            modelBuilder.Entity<NavigationRole>()
                .HasKey(nr => new { nr.NavigationItemId, nr.RoleId });

            // Master Data Query Filters
            modelBuilder.Entity<Standard>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Section>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<AcademicYear>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Caste>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<SubCaste>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Religion>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<State>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<City>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<BloodGroup>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<House>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<AdmissionType>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Category>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Session>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Batch>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Shift>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Subject>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<ExamType>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Designation>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Occupation>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Role>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<SchoolSection>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Weekday>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Holiday>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<AttendanceStatus>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<NavigationItem>().HasQueryFilter(x => !x.IsDeleted);

            // Configuration to ignore the inherited AcademicYearId column on the AcademicYears master table (already represented by primary key Id)
            modelBuilder.Entity<AcademicYear>().Ignore(ay => ay.AcademicYearId);
        }

        /// <summary>
        /// Saves changes to the database, automatically populating audit fields and generating audit logs.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The number of state entries written to the database.</returns>
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            OnBeforeSaveChanges();
            return await base.SaveChangesAsync(cancellationToken);
        }

        /// <summary>
        /// Internal method to process entities before saving, handling audit trail properties.
        /// </summary>
        private void OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.Entity is ErrorLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry);
                auditEntry.TableName = entry.Entity.GetType().Name;
                auditEntries.Add(auditEntry);

                if (entry.Entity is BaseEntity entity)
                {
                    var now = DateTime.Now;
                    if (entry.State == EntityState.Added)
                    {
                        entity.CreatedOn = now;
                        entity.ModifiedOn = now;
                    }
                    else if (entry.State == EntityState.Modified)
                    {
                        entity.ModifiedOn = now;
                    }
                }

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.AuditType = "Create";
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;

                        case EntityState.Deleted:
                            auditEntry.AuditType = "Delete";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.ChangedColumns.Add(propertyName);
                                auditEntry.AuditType = "Update";
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                            }
                            break;
                    }
                }
            }

            foreach (var auditEntry in auditEntries)
            {
                AuditLogs.Add(auditEntry.ToAudit());
            }
        }
    }

    /// <summary>
    /// Helper class to track audit entry details during the change process.
    /// </summary>
    internal class AuditEntry
    {
        public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            Entry = entry;
        }
        public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
        public string? TableName { get; set; }
        public Dictionary<string, object?> KeyValues { get; } = new Dictionary<string, object?>();
        public Dictionary<string, object?> OldValues { get; } = new Dictionary<string, object?>();
        public Dictionary<string, object?> NewValues { get; } = new Dictionary<string, object?>();
        public string? AuditType { get; set; }
        public List<string> ChangedColumns { get; } = new List<string>();

        public AuditLog ToAudit()
        {
            var audit = new AuditLog();
            audit.Type = AuditType;
            audit.TableName = TableName;
            audit.DateTime = DateTime.Now;
            audit.PrimaryKey = JsonSerializer.Serialize(KeyValues);
            audit.OldValues = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues);
            audit.NewValues = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues);
            audit.AffectedColumns = ChangedColumns.Count == 0 ? null : JsonSerializer.Serialize(ChangedColumns);

            // Dynamically propagate SchoolId and AcademicYearId to AuditLogs from the source entity if present
            if (Entry.Entity is BaseEntity baseEntity)
            {
                audit.SchoolId = baseEntity.SchoolId;
                audit.AcademicYearId = baseEntity.AcademicYearId;
            }
            else if (Entry.Entity is NavigationItem navItem)
            {
                audit.SchoolId = navItem.SchoolId;
                audit.AcademicYearId = navItem.AcademicYearId;
            }
            return audit;
        }
    }
}

