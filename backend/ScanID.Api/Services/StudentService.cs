#pragma warning disable CS8604 // Disable warning for possible null reference argument for parameter 'parameters' in SqlQueryRaw
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using ScanID.Api.Data;
using ScanID.Api.Interfaces;
using ScanID.Api.Models;
using ScanID.Api.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore.Storage;

namespace ScanID.Api.Services
{
    /// <summary>
    /// Decoupled StudentService realization calling high-performance Stored Procedures.
    /// This keeps the domain boundary highly optimized and adheres to SOLID design structures.
    /// Handles database transactions, rollbacks, and deadlock recovery transparently.
    /// </summary>
    public class StudentService : IStudentService
    {
        private readonly ApplicationDbContext _context;

        public StudentService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Executes an operation with transparent retry logic under SQL Server Deadlock (1205) occurrences.
        /// This ensures transient deadlock issues are resolved safely without bubbling errors to end users.
        /// </summary>
        private async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> action, int maxRetries = 3)
        {
            int delay = 150; // Delay in milliseconds
            for (int retry = 0; retry < maxRetries; retry++)
            {
                try
                {
                    return await action();
                }
                catch (SqlException ex) when (ex.Number == 1205) // 1205 is the SQL Server Error code for deadlocks
                {
                    if (retry == maxRetries - 1)
                    {
                        FileLogger.LogError(new Exception($"Database transaction transient deadlock failed after {maxRetries} retry attempts.", ex));
                        throw;
                    }
                    await Task.Delay(delay);
                    delay *= 2; // Exponential backoff
                }
                catch (Exception ex)
                {
                    FileLogger.LogError(ex);
                    throw;
                }
            }
            throw new InvalidOperationException("Execution failed after maximum transient deadlock retries.");
        }

        /// <summary>
        /// Retrieves non-deleted students matching filters via sp_GetStudents.
        /// </summary>
        public async Task<IEnumerable<Student>> GetStudentsAsync(int? schoolId, int? academicYearId)
        {
            // Core optimization: Execute sp_GetStudents containing SQL joins and handle relation mapping in-memory via DbMapper.
            // This is extremely high performing and scales to huge datasets, completely bypassing Entity Framework .Include() overhead.
            return await DbMapper.ExecuteStoredProcedureAsync<Student>(
                _context,
                "dbo.sp_GetStudents",
                ("SchoolId", schoolId),
                ("AcademicYearId", academicYearId)
            );
        }

        /// <summary>
        private static readonly Dictionary<Type, PropertyInfo[]> StudentPropCache = new();

        private static PropertyInfo[] GetStudentProperties(Type type)
        {
            if (!StudentPropCache.TryGetValue(type, out var props))
            {
                props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                            .Where(p => p.CanWrite && (p.PropertyType.IsPrimitive || 
                                                      p.PropertyType == typeof(string) || 
                                                      p.PropertyType == typeof(decimal) || 
                                                      p.PropertyType == typeof(DateTime) || 
                                                      p.PropertyType == typeof(Guid) || 
                                                      p.PropertyType.IsEnum ||
                                                      Nullable.GetUnderlyingType(p.PropertyType) != null))
                            .ToArray();
                StudentPropCache[type] = props;
            }
            return props;
        }

        /// <summary>
        /// Retrieves non-deleted students from SQL Server using server-side pagination, paging, sorting, and caching.
        /// Fully optimized for sets of 50 to 90 lakhs+ records.
        /// </summary>
        public async Task<(IEnumerable<Student> Data, int TotalCount)> GetStudentsPagedAsync(
            int? schoolId, 
            int? academicYearId,
            int page,
            int pageSize,
            string? sortBy,
            string sortOrder,
            string? search,
            int? standardId,
            int? sectionId,
            int? lastId)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var list = new List<Student>();
                int totalCount = 0;

                var connection = _context.Database.GetDbConnection();
                if (connection.State == ConnectionState.Closed)
                {
                    await _context.Database.OpenConnectionAsync();
                }

                using var command = connection.CreateCommand();
                command.CommandText = "dbo.sp_GetStudentsPaged";
                command.CommandType = CommandType.StoredProcedure;

                // Add parameters
                void AddParam(string name, object? val)
                {
                    var param = command.CreateParameter();
                    param.ParameterName = name.StartsWith("@") ? name : "@" + name;
                    param.Value = val ?? DBNull.Value;
                    command.Parameters.Add(param);
                }

                AddParam("SchoolId", schoolId);
                AddParam("AcademicYearId", academicYearId);
                AddParam("Page", page);
                AddParam("PageSize", pageSize);
                AddParam("SortBy", sortBy);
                AddParam("SortOrder", sortOrder);
                AddParam("Search", search);
                AddParam("StandardId", standardId);
                AddParam("SectionId", sectionId);
                AddParam("LastId", lastId);

                using var reader = await command.ExecuteReaderAsync();
                var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    columns.Add(reader.GetName(i));
                }

                var entityType = typeof(Student);
                var props = GetStudentProperties(entityType);

                while (await reader.ReadAsync())
                {
                    var item = new Student();
                    foreach (var prop in props)
                    {
                        if (columns.Contains(prop.Name))
                        {
                            var val = reader[prop.Name];
                            if (val != DBNull.Value)
                            {
                                var underlyingType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                                prop.SetValue(item, Convert.ChangeType(val, underlyingType));
                            }
                        }
                    }

                    // Map navigational entities from joins using the reader
                    if (columns.Contains("StandardName") && reader["StandardName"] != DBNull.Value)
                    {
                        item.Standard = new Standard { Name = reader["StandardName"].ToString() ?? string.Empty };
                    }
                    if (columns.Contains("SectionName") && reader["SectionName"] != DBNull.Value)
                    {
                        item.Section = new Section { Name = reader["SectionName"].ToString() ?? string.Empty };
                    }
                    if (columns.Contains("AcademicYearName") && reader["AcademicYearName"] != DBNull.Value)
                    {
                        item.AcademicYear = new AcademicYear { Name = reader["AcademicYearName"].ToString() ?? string.Empty };
                    }
                    if (columns.Contains("CityName") && reader["CityName"] != DBNull.Value)
                    {
                        item.City = new City { Name = reader["CityName"].ToString() ?? string.Empty };
                    }
                    if (columns.Contains("StateName") && reader["StateName"] != DBNull.Value)
                    {
                        item.State = new State { Name = reader["StateName"].ToString() ?? string.Empty };
                    }

                    // Get total count from TotalCount column
                    if (columns.Contains("TotalCount") && reader["TotalCount"] != DBNull.Value)
                    {
                        totalCount = Convert.ToInt32(reader["TotalCount"]);
                    }

                    list.Add(item);
                }

                return ((IEnumerable<Student>)list, totalCount);
            });
        }

        /// <summary>
        /// Retrieves a single student record via sp_GetStudentById.
        /// </summary>
        public async Task<Student?> GetStudentByIdAsync(int id)
        {
            var list = await _context.Students
                .FromSqlInterpolated($"EXEC dbo.sp_GetStudentById {id}")
                .IgnoreQueryFilters()
                .AsNoTracking()
                .ToListAsync();
            return list.FirstOrDefault();
        }

        /// <summary>
        /// Registers a single student with auditing properties. Handles deadlocks resiliently.
        /// </summary>
        public async Task<Student> CreateStudentAsync(Student student)
        {
            student.Status = student.Status ?? "Active";

            return await ExecuteWithRetryAsync(async () =>
            {
                // Validate GrNo uniqueness from overall academics
                if (!string.IsNullOrEmpty(student.GrNo))
                {
                    bool grNoExists = await _context.Students.AnyAsync(s => s.GrNo == student.GrNo && !s.IsDeleted);
                    if (grNoExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: GrNo '{student.GrNo}' already exists.");
                    }
                }

                // Validate RFID uniqueness if entered
                if (!string.IsNullOrEmpty(student.Rfid))
                {
                    bool rfidExists = await _context.Students.AnyAsync(s => s.Rfid == student.Rfid && !s.IsDeleted);
                    if (rfidExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: RFID '{student.Rfid}' already exists.");
                    }
                }

                // Validate Roll No uniqueness per combination of school, standard, division
                if (student.StandardId.HasValue && student.SectionId.HasValue)
                {
                    bool rollExists = await _context.Students.AnyAsync(s => 
                        s.SchoolId == student.SchoolId && 
                        s.StandardId == student.StandardId && 
                        s.SectionId == student.SectionId && 
                        s.RollNumber == student.RollNumber && 
                        !s.IsDeleted);
                    if (rollExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: Roll No '{student.RollNumber}' already exists for this combination of Standard and Division.");
                    }
                }

                // Execute the sp_ManageStudent stored procedure safely using high-performance ADO.NET DbMapper 
                // to retrieve the newly generated identity, completely avoiding EF Core query wrapping issues.
                student.Id = await DbMapper.ExecuteScalarStoredProcedureAsync(
                    _context,
                    "dbo.sp_ManageStudent",
                    ("Action", "INSERT"),
                    ("Id", null),
                    ("Name", student.Name),
                    ("FirstName", student.FirstName),
                    ("MiddleName", student.MiddleName),
                    ("LastName", student.LastName),
                    ("SchoolId", student.SchoolId),
                    ("StandardId", student.StandardId),
                    ("SectionId", student.SectionId),
                    ("AcademicYearId", student.AcademicYearId),
                    ("RollNumber", student.RollNumber),
                    ("GrNo", student.GrNo),
                    ("Gender", student.Gender),
                    ("DateOfBirth", student.DateOfBirth),
                    ("CategoryId", student.CategoryId),
                    ("ReligionId", student.ReligionId),
                    ("CasteId", student.CasteId),
                    ("SubCasteId", student.SubCasteId),
                    ("Status", student.Status),
                    ("FatherContactNo", student.FatherContactNo),
                    ("Address", student.Address),
                    ("MotherName", student.MotherName),
                    ("AadharCard", student.AadharCard),
                    ("Rfid", student.Rfid),
                    ("ShiftId", student.ShiftId),
                    ("BloodGroupId", student.BloodGroupId),
                    ("HouseId", student.HouseId),
                    ("AdmissionTypeId", student.AdmissionTypeId),
                    ("Sms", student.Sms),
                    ("UniformId", student.UniformId),
                    ("MotherContactNo", student.MotherContactNo),
                    ("ProfilePhotoPath", student.ProfilePhotoPath),
                    ("SchoolSectionId", student.SchoolSectionId),
                    ("AdmissionDate", student.AdmissionDate),
                    ("Email", student.Email),
                    ("CityId", student.CityId),
                    ("StateId", student.StateId),
                    ("IsStateBoard", student.IsStateBoard),
                    ("DigitalUniform", student.DigitalUniform),
                    ("DigitalNotebook", student.DigitalNotebook),
                    ("OptedForBus", student.OptedForBus),
                    ("CreatedBy", student.CreatedBy),
                    ("ModifiedBy", student.CreatedBy)
                );

                return student;
            });
        }

        /// <summary>
        /// Updates an edited student with deadlock retry safety.
        /// </summary>
        public async Task<bool> UpdateStudentAsync(Student student)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                // Validate GrNo uniqueness from overall academics
                if (!string.IsNullOrEmpty(student.GrNo))
                {
                    bool grNoExists = await _context.Students.AnyAsync(s => s.GrNo == student.GrNo && s.Id != student.Id && !s.IsDeleted);
                    if (grNoExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: GrNo '{student.GrNo}' already exists.");
                    }
                }

                // Validate RFID uniqueness if entered
                if (!string.IsNullOrEmpty(student.Rfid))
                {
                    bool rfidExists = await _context.Students.AnyAsync(s => s.Rfid == student.Rfid && s.Id != student.Id && !s.IsDeleted);
                    if (rfidExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: RFID '{student.Rfid}' already exists.");
                    }
                }

                // Validate Roll No uniqueness per combination of school, standard, division
                if (student.StandardId.HasValue && student.SectionId.HasValue)
                {
                    bool rollExists = await _context.Students.AnyAsync(s => 
                        s.SchoolId == student.SchoolId && 
                        s.StandardId == student.StandardId && 
                        s.SectionId == student.SectionId && 
                        s.RollNumber == student.RollNumber && 
                        s.Id != student.Id && 
                        !s.IsDeleted);
                    if (rollExists)
                    {
                        throw new InvalidOperationException($"Student validation failed: Roll No '{student.RollNumber}' already exists for this combination of Standard and Division.");
                    }
                }

                await DbMapper.ExecuteScalarStoredProcedureAsync(
                    _context,
                    "dbo.sp_ManageStudent",
                    ("Action", "UPDATE"),
                    ("Id", student.Id),
                    ("Name", student.Name),
                    ("FirstName", student.FirstName),
                    ("MiddleName", student.MiddleName),
                    ("LastName", student.LastName),
                    ("SchoolId", student.SchoolId),
                    ("StandardId", student.StandardId),
                    ("SectionId", student.SectionId),
                    ("AcademicYearId", student.AcademicYearId),
                    ("RollNumber", student.RollNumber),
                    ("GrNo", student.GrNo),
                    ("Gender", student.Gender),
                    ("DateOfBirth", student.DateOfBirth),
                    ("CategoryId", student.CategoryId),
                    ("ReligionId", student.ReligionId),
                    ("CasteId", student.CasteId),
                    ("SubCasteId", student.SubCasteId),
                    ("Status", student.Status),
                    ("FatherContactNo", student.FatherContactNo),
                    ("Address", student.Address),
                    ("MotherName", student.MotherName),
                    ("AadharCard", student.AadharCard),
                    ("Rfid", student.Rfid),
                    ("ShiftId", student.ShiftId),
                    ("BloodGroupId", student.BloodGroupId),
                    ("HouseId", student.HouseId),
                    ("AdmissionTypeId", student.AdmissionTypeId),
                    ("Sms", student.Sms),
                    ("UniformId", student.UniformId),
                    ("MotherContactNo", student.MotherContactNo),
                    ("ProfilePhotoPath", student.ProfilePhotoPath),
                    ("SchoolSectionId", student.SchoolSectionId),
                    ("AdmissionDate", student.AdmissionDate),
                    ("Email", student.Email),
                    ("CityId", student.CityId),
                    ("StateId", student.StateId),
                    ("IsStateBoard", student.IsStateBoard),
                    ("DigitalUniform", student.DigitalUniform),
                    ("DigitalNotebook", student.DigitalNotebook),
                    ("OptedForBus", student.OptedForBus),
                    ("ModifiedBy", student.ModifiedBy)
                );
                return true;
            });
        }

        /// <summary>
        /// Validates unique fields and bulk creates multiple students within safe transactions.
        /// High performance SqlBulkCopy is coupled with an automatic row-by-row fallback rollback handler to preserve partial successes.
        /// </summary>
        public async Task<object> CreateBulkStudentsAsync(IEnumerable<Student> students)
        {
            if (students == null || !students.Any())
                throw new ArgumentException("No student data provided.");

            var responseDto = new BulkUploadResponseDto();
            
            // Track 1-based indices to match row indices in Excel sheet 
            var studentListWithIndex = students.Select((s, idx) => new { Student = s, RowIndex = idx + 1 }).ToList();

            // Sets for unique values validation within the uploaded file itself across all processed batches
            var cumulativeGrNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cumulativeAadhars = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cumulativeRfids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cumulativeUniforms = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cumulativeRollKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var batchSize = 2500;
            var connection = (SqlConnection)_context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            for (int batchOffset = 0; batchOffset < studentListWithIndex.Count; batchOffset += batchSize)
            {
                var batchItems = studentListWithIndex.Skip(batchOffset).Take(batchSize).ToList();

                // 1. Optimize lookup parameters - retrieve database records matching only target identifiers inside this batch
                var incomingGrNos = batchItems.Select(s => s.Student.GrNo).Where(g => !string.IsNullOrEmpty(g)).Distinct().ToList();
                var incomingAadhars = batchItems.Select(s => s.Student.AadharCard).Where(a => !string.IsNullOrEmpty(a)).Distinct().ToList();
                var incomingRfids = batchItems.Select(s => s.Student.Rfid).Where(r => !string.IsNullOrEmpty(r)).Distinct().ToList();
                var incomingUniforms = batchItems.Select(s => s.Student.UniformId).Where(u => !string.IsNullOrEmpty(u)).Distinct().ToList();

                var dbGrNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var dbAadhars = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var dbRfids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                var dbUniforms = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                if (incomingGrNos.Any() || incomingAadhars.Any() || incomingRfids.Any() || incomingUniforms.Any())
                {
                    var dbConflictingStudents = await _context.Students
                        .AsNoTracking()
                        .Where(s => !s.IsDeleted && (
                            (s.GrNo != null && incomingGrNos.Contains(s.GrNo)) ||
                            (s.AadharCard != null && incomingAadhars.Contains(s.AadharCard)) ||
                            (s.Rfid != null && incomingRfids.Contains(s.Rfid)) ||
                            (s.UniformId != null && incomingUniforms.Contains(s.UniformId))
                        ))
                        .Select(s => new { s.GrNo, s.AadharCard, s.Rfid, s.UniformId })
                        .ToListAsync();

                    foreach (var dbs in dbConflictingStudents)
                    {
                        if (!string.IsNullOrEmpty(dbs.GrNo)) dbGrNos.Add(dbs.GrNo.Trim());
                        if (!string.IsNullOrEmpty(dbs.AadharCard)) dbAadhars.Add(dbs.AadharCard.Trim());
                        if (!string.IsNullOrEmpty(dbs.Rfid)) dbRfids.Add(dbs.Rfid.Trim());
                        if (!string.IsNullOrEmpty(dbs.UniformId)) dbUniforms.Add(dbs.UniformId.Trim());
                    }
                }

                // Query DB active roll numbers for combos matching the current batch offset
                var schoolIds = batchItems.Select(s => s.Student.SchoolId).Distinct().ToList();
                var standardIds = batchItems.Select(s => s.Student.StandardId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
                var sectionIds = batchItems.Select(s => s.Student.SectionId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

                var dbRollKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (schoolIds.Any() && standardIds.Any() && sectionIds.Any())
                {
                    var dbActiveRolls = await _context.Students
                        .AsNoTracking()
                        .Where(s => !s.IsDeleted && s.StandardId != null && s.SectionId != null &&
                                    schoolIds.Contains(s.SchoolId) &&
                                    standardIds.Contains(s.StandardId.Value) &&
                                    sectionIds.Contains(s.SectionId.Value))
                        .Select(s => new { s.SchoolId, s.StandardId, s.SectionId, s.RollNumber })
                        .ToListAsync();

                    foreach (var r in dbActiveRolls)
                    {
                        dbRollKeys.Add($"{r.SchoolId}-{r.StandardId}-{r.SectionId}-{r.RollNumber}");
                    }
                }

                var batchValidStudentsWithIndex = new List<(Student Student, int RowIndex)>();

                // 2. Row validations
                foreach (var item in batchItems)
                {
                    var s = item.Student;
                    var rowIndex = item.RowIndex;
                    string? rowError = null;

                    // Student name check
                    if (string.IsNullOrEmpty(s.Name))
                    {
                        rowError = "Student Name is required.";
                    }

                    // GrNo validation and uniqueness check
                    var grno = (s.GrNo ?? "").Trim();
                    if (rowError == null)
                    {
                        if (string.IsNullOrEmpty(grno))
                        {
                            rowError = "GR Number (GrNo) is required.";
                        }
                        else if (cumulativeGrNos.Contains(grno))
                        {
                            rowError = $"Duplicate GR Number '{grno}' within the uploaded file.";
                        }
                        else if (dbGrNos.Contains(grno))
                        {
                            rowError = $"GR Number '{grno}' already exists in the database.";
                        }
                    }

                    // AadharCard validations
                    var aadhar = (s.AadharCard ?? "").Trim();
                    if (rowError == null && !string.IsNullOrEmpty(aadhar))
                    {
                        if (cumulativeAadhars.Contains(aadhar))
                        {
                            rowError = $"Duplicate Aadhar Card '{aadhar}' within the uploaded file.";
                        }
                        else if (dbAadhars.Contains(aadhar))
                        {
                            rowError = $"Aadhar Card '{aadhar}' already exists in the database.";
                        }
                    }

                    // RFID validations
                    var rfid = (s.Rfid ?? "").Trim();
                    if (rowError == null && !string.IsNullOrEmpty(rfid))
                    {
                        if (cumulativeRfids.Contains(rfid))
                        {
                            rowError = $"Duplicate RFID '{rfid}' within the uploaded file.";
                        }
                        else if (dbRfids.Contains(rfid))
                        {
                            rowError = $"RFID '{rfid}' already exists in the database.";
                        }
                    }

                    // UniformID validations
                    var uniform = (s.UniformId ?? "").Trim();
                    if (rowError == null && !string.IsNullOrEmpty(uniform))
                    {
                        if (cumulativeUniforms.Contains(uniform))
                        {
                            rowError = $"Duplicate Uniform ID '{uniform}' within the uploaded file.";
                        }
                        else if (dbUniforms.Contains(uniform))
                        {
                            rowError = $"Uniform ID '{uniform}' already exists in the database.";
                        }
                    }

                    // Composite School + Standard + Section + RollNumber checks
                    if (rowError == null && s.StandardId.HasValue && s.SectionId.HasValue)
                    {
                        var rollKey = $"{s.SchoolId}-{s.StandardId}-{s.SectionId}-{s.RollNumber}";
                        if (cumulativeRollKeys.Contains(rollKey))
                        {
                            rowError = $"Duplicate Roll Number '{s.RollNumber}' for this combination of School, Standard and Division in the uploaded file.";
                        }
                        else if (dbRollKeys.Contains(rollKey))
                        {
                            rowError = $"Roll Number '{s.RollNumber}' already exists for this combination of School, Standard and Division in the database.";
                        }
                    }

                    if (rowError != null)
                    {
                        responseDto.ErrorRows.Add(new BulkUploadErrorDetail
                        {
                            RowIndex = rowIndex,
                            Name = s.Name ?? string.Empty,
                            GrNo = grno,
                            Error = rowError
                        });
                        responseDto.ErrorCount++;
                    }
                    else
                    {
                        // Save attributes inside cumulative tracking so other records inside this upload stream validate against it
                        if (!string.IsNullOrEmpty(grno)) cumulativeGrNos.Add(grno);
                        if (!string.IsNullOrEmpty(aadhar)) cumulativeAadhars.Add(aadhar);
                        if (!string.IsNullOrEmpty(rfid)) cumulativeRfids.Add(rfid);
                        if (!string.IsNullOrEmpty(uniform)) cumulativeUniforms.Add(uniform);
                        
                        if (s.StandardId.HasValue && s.SectionId.HasValue)
                        {
                            var rollKey = $"{s.SchoolId}-{s.StandardId}-{s.SectionId}-{s.RollNumber}";
                            cumulativeRollKeys.Add(rollKey);
                        }

                        batchValidStudentsWithIndex.Add((s, rowIndex));
                    }
                }

                // 3. Execution of SqlBulkCopy for valid batch records
                if (batchValidStudentsWithIndex.Any())
                {
                    var validStudentsOnly = batchValidStudentsWithIndex.Select(x => x.Student).ToList();

                    try
                    {
                        // Wrap SqlBulkCopy in its own transaction
                        using var transaction = await _context.Database.BeginTransactionAsync();
                        var dbTransaction = (SqlTransaction)transaction.GetDbTransaction();

                        using var table = BuildStudentDataTable(validStudentsOnly);

                        using (var bulkCopy = new SqlBulkCopy(connection, SqlBulkCopyOptions.Default, dbTransaction))
                        {
                            bulkCopy.DestinationTableName = "[dbo].[Students]";
                            bulkCopy.BulkCopyTimeout = 600; // 10 minutes limit
                            bulkCopy.BatchSize = 5000;

                            foreach (DataColumn col in table.Columns)
                            {
                                bulkCopy.ColumnMappings.Add(col.ColumnName, col.ColumnName);
                            }

                            await bulkCopy.WriteToServerAsync(table);
                        }

                        await transaction.CommitAsync();

                        // Add successfully bulk inserted rows
                        foreach (var stWithIdx in batchValidStudentsWithIndex)
                        {
                            responseDto.InsertedRows.Add(new StudentRowDto
                            {
                                Name = stWithIdx.Student.Name,
                                GrNo = stWithIdx.Student.GrNo,
                                Status = stWithIdx.Student.Status,
                                RollNumber = stWithIdx.Student.RollNumber
                            });
                            responseDto.InsertedCount++;
                        }
                    }
                    catch (Exception bulkEx)
                    {
                        FileLogger.LogError(new Exception($"High-speed BulkCopy failed for offset batch size {validStudentsOnly.Count}. Falling back to row-by-row fallback handler to preserve all valid rows.", bulkEx));

                        // 4. Robust row-by-row fallback so valid rows are not lost!
                        foreach (var stWithIdx in batchValidStudentsWithIndex)
                        {
                            var singleStudent = stWithIdx.Student;
                            var singleRowIndex = stWithIdx.RowIndex;

                            try
                            {
                                // Direct SQL to bypass any Entity Framework Tracking cache blocks
                                using var cmd = connection.CreateCommand();
                                cmd.CommandText = @"
                                    INSERT INTO [dbo].[Students] (
                                        Name, SchoolId, Status, RollNumber, FirstName, MiddleName, LastName, GrNo, Gender, DateOfBirth, 
                                        Address, MotherName, FatherContactNo, MotherContactNo, AadharCard, UniformId, Rfid, SchoolSectionId, 
                                        AdmissionDate, Email, StandardId, SectionId, AcademicYearId, CasteId, SubCasteId, ReligionId, 
                                        BloodGroupId, HouseId, AdmissionTypeId, CityId, StateId, ShiftId, CategoryId, Sms, IsStateBoard, 
                                        ProfilePhotoPath, DigitalUniform, DigitalNotebook, OptedForBus, IsActive, IsDeleted, CreatedBy, 
                                        CreatedOn, ModifiedBy, ModifiedOn
                                    ) VALUES (
                                        @Name, @SchoolId, @Status, @RollNumber, @FirstName, @MiddleName, @LastName, @GrNo, @Gender, @DateOfBirth, 
                                        @Address, @MotherName, @FatherContactNo, @MotherContactNo, @AadharCard, @UniformId, @Rfid, @SchoolSectionId, 
                                        @AdmissionDate, @Email, @StandardId, @SectionId, @AcademicYearId, @CasteId, @SubCasteId, @ReligionId, 
                                        @BloodGroupId, @HouseId, @AdmissionTypeId, @CityId, @StateId, @ShiftId, @CategoryId, @Sms, @IsStateBoard, 
                                        @ProfilePhotoPath, @DigitalUniform, @DigitalNotebook, @OptedForBus, @IsActive, @IsDeleted, @CreatedBy, 
                                        @CreatedOn, @ModifiedBy, @ModifiedOn
                                    )";

                                AddStudentParameters(cmd, singleStudent);

                                await cmd.ExecuteNonQueryAsync();

                                responseDto.InsertedRows.Add(new StudentRowDto
                                {
                                    Name = singleStudent.Name,
                                    GrNo = singleStudent.GrNo,
                                    Status = singleStudent.Status,
                                    RollNumber = singleStudent.RollNumber
                                });
                                responseDto.InsertedCount++;
                            }
                            catch (Exception rowEx)
                            {
                                var innerMsg = rowEx.InnerException?.Message ?? rowEx.Message;
                                responseDto.ErrorRows.Add(new BulkUploadErrorDetail
                                {
                                    RowIndex = singleRowIndex,
                                    Name = singleStudent.Name ?? string.Empty,
                                    GrNo = singleStudent.GrNo ?? "",
                                    Error = $"Database insert error: {innerMsg}"
                                });
                                responseDto.ErrorCount++;
                            }
                        }
                    }
                }
            }

            return responseDto;
        }

        private DataTable BuildStudentDataTable(List<Student> students)
        {
            var table = new DataTable();
            table.Columns.Add("Name", typeof(string));
            table.Columns.Add("SchoolId", typeof(int));
            table.Columns.Add("Status", typeof(string));
            table.Columns.Add("RollNumber", typeof(int));
            table.Columns.Add("FirstName", typeof(string));
            table.Columns.Add("MiddleName", typeof(string));
            table.Columns.Add("LastName", typeof(string));
            table.Columns.Add("GrNo", typeof(string));
            table.Columns.Add("Gender", typeof(string));
            table.Columns.Add("DateOfBirth", typeof(DateTime));
            table.Columns.Add("Address", typeof(string));
            table.Columns.Add("MotherName", typeof(string));
            table.Columns.Add("FatherContactNo", typeof(string));
            table.Columns.Add("MotherContactNo", typeof(string));
            table.Columns.Add("AadharCard", typeof(string));
            table.Columns.Add("UniformId", typeof(string));
            table.Columns.Add("Rfid", typeof(string));
            table.Columns.Add("SchoolSectionId", typeof(int));
            table.Columns.Add("AdmissionDate", typeof(DateTime));
            table.Columns.Add("Email", typeof(string));
            table.Columns.Add("StandardId", typeof(int));
            table.Columns.Add("SectionId", typeof(int));
            table.Columns.Add("AcademicYearId", typeof(int));
            table.Columns.Add("CasteId", typeof(int));
            table.Columns.Add("SubCasteId", typeof(int));
            table.Columns.Add("ReligionId", typeof(int));
            table.Columns.Add("BloodGroupId", typeof(int));
            table.Columns.Add("HouseId", typeof(int));
            table.Columns.Add("AdmissionTypeId", typeof(int));
            table.Columns.Add("CityId", typeof(int));
            table.Columns.Add("StateId", typeof(int));
            table.Columns.Add("ShiftId", typeof(int));
            table.Columns.Add("CategoryId", typeof(int));
            table.Columns.Add("Sms", typeof(bool));
            table.Columns.Add("IsStateBoard", typeof(bool));
            table.Columns.Add("ProfilePhotoPath", typeof(string));
            table.Columns.Add("DigitalUniform", typeof(bool));
            table.Columns.Add("DigitalNotebook", typeof(bool));
            table.Columns.Add("OptedForBus", typeof(bool));
            table.Columns.Add("IsActive", typeof(bool));
            table.Columns.Add("IsDeleted", typeof(bool));
            table.Columns.Add("CreatedBy", typeof(string));
            table.Columns.Add("CreatedOn", typeof(DateTime));
            table.Columns.Add("ModifiedBy", typeof(string));
            table.Columns.Add("ModifiedOn", typeof(DateTime));

            foreach (var s in students)
            {
                table.Rows.Add(
                    s.Name ?? string.Empty,
                    s.SchoolId,
                    s.Status ?? "Active",
                    s.RollNumber,
                    (object?)s.FirstName ?? DBNull.Value,
                    (object?)s.MiddleName ?? DBNull.Value,
                    (object?)s.LastName ?? DBNull.Value,
                    (object?)s.GrNo ?? DBNull.Value,
                    (object?)s.Gender ?? DBNull.Value,
                    (object?)s.DateOfBirth ?? DBNull.Value,
                    (object?)s.Address ?? DBNull.Value,
                    (object?)s.MotherName ?? DBNull.Value,
                    (object?)s.FatherContactNo ?? DBNull.Value,
                    (object?)s.MotherContactNo ?? DBNull.Value,
                    (object?)s.AadharCard ?? DBNull.Value,
                    (object?)s.UniformId ?? DBNull.Value,
                    (object?)s.Rfid ?? DBNull.Value,
                    (object?)s.SchoolSectionId ?? DBNull.Value,
                    (object?)s.AdmissionDate ?? DBNull.Value,
                    (object?)s.Email ?? DBNull.Value,
                    (object?)s.StandardId ?? DBNull.Value,
                    (object?)s.SectionId ?? DBNull.Value,
                    (object?)s.AcademicYearId ?? DBNull.Value,
                    (object?)s.CasteId ?? DBNull.Value,
                    (object?)s.SubCasteId ?? DBNull.Value,
                    (object?)s.ReligionId ?? DBNull.Value,
                    (object?)s.BloodGroupId ?? DBNull.Value,
                    (object?)s.HouseId ?? DBNull.Value,
                    (object?)s.AdmissionTypeId ?? DBNull.Value,
                    (object?)s.CityId ?? DBNull.Value,
                    (object?)s.StateId ?? DBNull.Value,
                    (object?)s.ShiftId ?? DBNull.Value,
                    (object?)s.CategoryId ?? DBNull.Value,
                    s.Sms,
                    s.IsStateBoard,
                    (object?)s.ProfilePhotoPath ?? DBNull.Value,
                    s.DigitalUniform,
                    s.DigitalNotebook,
                    s.OptedForBus,
                    s.IsActive,
                    s.IsDeleted,
                    (object?)s.CreatedBy ?? "SYSTEM",
                    s.CreatedOn == default ? DateTime.UtcNow : s.CreatedOn,
                    (object?)s.ModifiedBy ?? "SYSTEM",
                    s.ModifiedOn == default ? DateTime.UtcNow : s.ModifiedOn
                );
            }

            return table;
        }

        private void AddStudentParameters(DbCommand cmd, Student s)
        {
            cmd.Parameters.Add(new SqlParameter("@Name", s.Name ?? string.Empty));
            cmd.Parameters.Add(new SqlParameter("@SchoolId", s.SchoolId));
            cmd.Parameters.Add(new SqlParameter("@Status", s.Status ?? "Active"));
            cmd.Parameters.Add(new SqlParameter("@RollNumber", s.RollNumber));
            cmd.Parameters.Add(new SqlParameter("@FirstName", (object?)s.FirstName ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@MiddleName", (object?)s.MiddleName ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@LastName", (object?)s.LastName ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@GrNo", (object?)s.GrNo ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Gender", (object?)s.Gender ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@DateOfBirth", (object?)s.DateOfBirth ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Address", (object?)s.Address ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@MotherName", (object?)s.MotherName ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@FatherContactNo", (object?)s.FatherContactNo ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@MotherContactNo", (object?)s.MotherContactNo ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@AadharCard", (object?)s.AadharCard ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@UniformId", (object?)s.UniformId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Rfid", (object?)s.Rfid ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@SchoolSectionId", (object?)s.SchoolSectionId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@AdmissionDate", (object?)s.AdmissionDate ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Email", (object?)s.Email ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@StandardId", (object?)s.StandardId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@SectionId", (object?)s.SectionId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@AcademicYearId", (object?)s.AcademicYearId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@CasteId", (object?)s.CasteId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@SubCasteId", (object?)s.SubCasteId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@ReligionId", (object?)s.ReligionId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@BloodGroupId", (object?)s.BloodGroupId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@HouseId", (object?)s.HouseId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@AdmissionTypeId", (object?)s.AdmissionTypeId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@CityId", (object?)s.CityId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@StateId", (object?)s.StateId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@ShiftId", (object?)s.ShiftId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@CategoryId", (object?)s.CategoryId ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@Sms", s.Sms));
            cmd.Parameters.Add(new SqlParameter("@IsStateBoard", s.IsStateBoard));
            cmd.Parameters.Add(new SqlParameter("@ProfilePhotoPath", (object?)s.ProfilePhotoPath ?? DBNull.Value));
            cmd.Parameters.Add(new SqlParameter("@DigitalUniform", s.DigitalUniform));
            cmd.Parameters.Add(new SqlParameter("@DigitalNotebook", s.DigitalNotebook));
            cmd.Parameters.Add(new SqlParameter("@OptedForBus", s.OptedForBus));
            cmd.Parameters.Add(new SqlParameter("@IsActive", s.IsActive));
            cmd.Parameters.Add(new SqlParameter("@IsDeleted", s.IsDeleted));
            cmd.Parameters.Add(new SqlParameter("@CreatedBy", (object?)s.CreatedBy ?? "SYSTEM"));
            cmd.Parameters.Add(new SqlParameter("@CreatedOn", s.CreatedOn == default ? DateTime.UtcNow : s.CreatedOn));
            cmd.Parameters.Add(new SqlParameter("@ModifiedBy", (object?)s.ModifiedBy ?? "SYSTEM"));
            cmd.Parameters.Add(new SqlParameter("@ModifiedOn", s.ModifiedOn == default ? DateTime.UtcNow : s.ModifiedOn));
        }

        /// <summary>
        /// Soft deletes student record using sp_ManageStudent with deadlock retry safety.
        /// </summary>
        public async Task<bool> DeleteStudentAsync(int id)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"EXEC dbo.sp_ManageStudent 'DELETE', {id}"
                );
                return rowsAffected > 0;
            });
        }

        /// <summary>
        /// Loads student coupled with relationships for photo uploads.
        /// </summary>
        public async Task<Student?> GetStudentWithPhotoDetailsAsync(int id)
        {
            // Core optimization: Execute sp_GetStudentWithPhotoDetails with pre-compiled joins and map dynamically in-memory.
            var list = await DbMapper.ExecuteStoredProcedureAsync<Student>(
                _context,
                "dbo.sp_GetStudentWithPhotoDetails",
                ("Id", id)
            );
            return list.FirstOrDefault();
        }

        /// <summary>
        /// Retrieves students definition for exports.
        /// </summary>
        public async Task<IEnumerable<Student>> GetStudentsForExportAsync(int? schoolId)
        {
            // Core optimization: Execute sp_GetStudentsForExport containing the full set of joins, mapping relations via DbMapper for extreme scale.
            return await DbMapper.ExecuteStoredProcedureAsync<Student>(
                _context,
                "dbo.sp_GetStudentsForExport",
                ("SchoolId", schoolId)
            );
        }

        public async Task<bool> SavePhotoPathAsync(int id, string path)
        {
            return await ExecuteWithRetryAsync(async () =>
            {
                // Execute a direct parameterized raw SQL query to update the photo path, 
                // avoiding any EF Core change tracking issues with disconnected entities.
                var rowsAffected = await _context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE [dbo].[Students] SET [ProfilePhotoPath] = {path}, [ModifiedOn] = GETUTCDATE() WHERE [Id] = {id}"
                );
                return rowsAffected > 0;
            });
        }

        public async Task<bool> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        private static string UPPER_RAND_STRING()
        {
            return Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
        }
    }
}
