using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace ScanID.Api.Utilities
{
    /// <summary>
    /// High-performance custom DbMapper to safely bypass EF Core .Include() translations.
    /// Uses direct ADO.NET DataReader and cached reflection-based property assignments,
    /// with manual instantiation of master entities from the SQL procedures' JOIN outputs.
    /// This resolves slow performance with very large tables (e.g., 50 lakh records).
    /// </summary>
    public static class DbMapper
    {
        private static readonly Dictionary<Type, PropertyInfo[]> PropCache = new();

        private static PropertyInfo[] GetProperties(Type type)
        {
            if (!PropCache.TryGetValue(type, out var props))
            {
                props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                            .Where(p => p.CanWrite && IsSimpleType(p.PropertyType))
                            .ToArray();
                PropCache[type] = props;
            }
            return props;
        }

        private static bool IsSimpleType(Type type)
        {
            var underlyingType = Nullable.GetUnderlyingType(type) ?? type;
            return underlyingType.IsPrimitive || 
                   underlyingType == typeof(string) || 
                   underlyingType == typeof(decimal) || 
                   underlyingType == typeof(DateTime) || 
                   underlyingType == typeof(Guid) || 
                   underlyingType.IsEnum;
        }

        /// <summary>
        /// Executes a store procedure and returns list of mapped elements.
        /// </summary>
        public static async Task<List<T>> ExecuteStoredProcedureAsync<T>(DbContext context, string spName, params (string Name, object? Value)[] parameters) where T : class, new()
        {
            var list = new List<T>();
            var connection = context.Database.GetDbConnection();
            
            if (connection.State == ConnectionState.Closed)
            {
                await context.Database.OpenConnectionAsync();
            }

            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;

            // Associate command with EF Core transaction, if any is active
            var currentTx = context.Database.CurrentTransaction?.GetDbTransaction();
            if (currentTx != null)
            {
                command.Transaction = currentTx;
            }

            foreach (var p in parameters)
            {
                var parameter = command.CreateParameter();
                parameter.ParameterName = p.Name.StartsWith("@") ? p.Name : "@" + p.Name;
                parameter.Value = p.Value ?? DBNull.Value;
                command.Parameters.Add(parameter);
            }

            using var reader = await command.ExecuteReaderAsync();
            var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < reader.FieldCount; i++)
            {
                columns.Add(reader.GetName(i));
            }

            var props = GetProperties(typeof(T));

            while (await reader.ReadAsync())
            {
                var item = new T();
                foreach (var prop in props)
                {
                    if (columns.Contains(prop.Name))
                    {
                        var val = reader[prop.Name];
                        if (val != DBNull.Value)
                        {
                            prop.SetValue(item, ConvertValue(val, prop.PropertyType));
                        }
                    }
                }

                // Inject joined master properties directly into the navigation entities
                HandleNavigationMappings(item, reader, columns);

                list.Add(item);
            }

            return list;
        }

        private static object? ConvertValue(object val, Type targetType)
        {
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;
            if (underlyingType == typeof(Guid))
            {
                return Guid.Parse(val.ToString() ?? string.Empty);
            }
            if (underlyingType.IsEnum)
            {
                return Enum.Parse(underlyingType, val.ToString() ?? string.Empty, true);
            }
            return Convert.ChangeType(val, underlyingType);
        }

        private static void HandleNavigationMappings<T>(T item, DbDataReader reader, HashSet<string> columns)
        {
            if (item == null) return;

            // Student Custom Joins mapping
            if (item is Models.Student student)
            {
                if (columns.Contains("StandardName") && reader["StandardName"] != DBNull.Value)
                {
                    student.Standard = new Models.Standard { Name = reader["StandardName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("SectionName") && reader["SectionName"] != DBNull.Value)
                {
                    student.Section = new Models.Section { Name = reader["SectionName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("AcademicYearName") && reader["AcademicYearName"] != DBNull.Value)
                {
                    student.AcademicYear = new Models.AcademicYear { Name = reader["AcademicYearName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("CasteName") && reader["CasteName"] != DBNull.Value)
                {
                    student.Caste = new Models.Caste { Name = reader["CasteName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("ReligionName") && reader["ReligionName"] != DBNull.Value)
                {
                    student.Religion = new Models.Religion { Name = reader["ReligionName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("CategoryName") && reader["CategoryName"] != DBNull.Value)
                {
                    student.Category = new Models.Category { Name = reader["CategoryName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("BloodGroupName") && reader["BloodGroupName"] != DBNull.Value)
                {
                    student.BloodGroup = new Models.BloodGroup { Name = reader["BloodGroupName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("HouseName") && reader["HouseName"] != DBNull.Value)
                {
                    student.House = new Models.House { Name = reader["HouseName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("ShiftName") && reader["ShiftName"] != DBNull.Value)
                {
                    student.Shift = new Models.Shift { Name = reader["ShiftName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("SchoolName") && reader["SchoolName"] != DBNull.Value)
                {
                    student.School = new Models.School 
                    { 
                        Id = student.SchoolId ?? 0,
                        Name = reader["SchoolName"].ToString() ?? string.Empty 
                    };
                }
                if (columns.Contains("CityName") && reader["CityName"] != DBNull.Value)
                {
                    student.City = new Models.City { Name = reader["CityName"].ToString() ?? string.Empty };
                }
                if (columns.Contains("StateName") && reader["StateName"] != DBNull.Value)
                {
                    student.State = new Models.State { Name = reader["StateName"].ToString() ?? string.Empty };
                }
            }

            // User Custom Joins mapping
            if (item is Models.User user)
            {
                if (columns.Contains("SchoolName") && reader["SchoolName"] != DBNull.Value)
                {
                    user.School = new Models.School { Name = reader["SchoolName"].ToString() ?? string.Empty };
                }
            }

            // Staff Custom Joins mapping
            if (item is Models.Staff staff)
            {
                if ((columns.Contains("UserName") && reader["UserName"] != DBNull.Value) || 
                    (columns.Contains("UserEmail") && reader["UserEmail"] != DBNull.Value))
                {
                    staff.User = new Models.User
                    {
                        Name = columns.Contains("UserName") && reader["UserName"] != DBNull.Value ? reader["UserName"].ToString() : null,
                        Email = columns.Contains("UserEmail") && reader["UserEmail"] != DBNull.Value ? reader["UserEmail"].ToString() : null
                    };
                }
                if (columns.Contains("SchoolName") && reader["SchoolName"] != DBNull.Value)
                {
                    staff.School = new Models.School { Name = reader["SchoolName"].ToString() ?? string.Empty };
                }
            }

            // Attendance Custom Joins mapping
            if (item is Models.Attendance attendance)
            {
                if (columns.Contains("StudentName") && reader["StudentName"] != DBNull.Value)
                {
                    attendance.Student = new Models.Student { Name = reader["StudentName"].ToString() ?? string.Empty };
                }
            }

            // Fee Custom Joins mapping
            if (item is Models.Fee fee)
            {
                if (columns.Contains("StudentName") && reader["StudentName"] != DBNull.Value)
                {
                    fee.Student = new Models.Student { Name = reader["StudentName"].ToString() ?? string.Empty };
                }
            }

            // Mark Custom Joins mapping
            if (item is Models.Mark mark)
            {
                if (columns.Contains("StudentName") && reader["StudentName"] != DBNull.Value)
                {
                    mark.Student = new Models.Student { Name = reader["StudentName"].ToString() ?? string.Empty };
                }
            }
        }

        /// <summary>
        /// Executes a stored procedure that returns a single scalar value.
        /// Bypasses EF query composition limits for non-composable stored procedure calls.
        /// </summary>
        public static async Task<int> ExecuteScalarStoredProcedureAsync(DbContext context, string spName, params (string Name, object? Value)[] parameters)
        {
            var connection = context.Database.GetDbConnection();
            
            if (connection.State == ConnectionState.Closed)
            {
                await context.Database.OpenConnectionAsync();
            }

            using var command = connection.CreateCommand();
            command.CommandText = spName;
            command.CommandType = CommandType.StoredProcedure;

            // Associate command with EF Core transaction, if any is active
            var currentTx = context.Database.CurrentTransaction?.GetDbTransaction();
            if (currentTx != null)
            {
                command.Transaction = currentTx;
            }

            foreach (var p in parameters)
            {
                var parameter = command.CreateParameter();
                parameter.ParameterName = p.Name.StartsWith("@") ? p.Name : "@" + p.Name;
                parameter.Value = p.Value ?? DBNull.Value;
                command.Parameters.Add(parameter);
            }

            var result = await command.ExecuteScalarAsync();
            return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }
    }
}
