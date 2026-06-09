using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ScanID.Api.Data;
using ScanID.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ScanID.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MastersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;

        public MastersController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // --- Generic CRUD Methods ---

        /// <summary>
        /// Clears the master cache for a given type.
        /// </summary>
        private void ClearCache<T>()
        {
            _cache.Remove($"Master_{typeof(T).Name}");
        }

        /// <summary>
        /// Fetches all records from the specified table utilizing IMemoryCache layer.
        /// </summary>
        private async Task<ActionResult<IEnumerable<T>>> GetAll<T>(DbSet<T> dbSet) where T : class
        {
            string cacheKey = $"Master_{typeof(T).Name}";
            if (!_cache.TryGetValue(cacheKey, out List<T>? cachedList))
            {
                // Retrieve using AsNoTracking for optimal EF Core reading performance
                cachedList = await dbSet.AsNoTracking().ToListAsync();
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(15))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(5));
                _cache.Set(cacheKey, cachedList, cacheOptions);
            }
            return Ok(cachedList);
        }

        /// <summary>
        /// Fetches a single record by its primary key using AsNoTracking.
        /// </summary>
        private async Task<ActionResult<T>> GetById<T>(DbSet<T> dbSet, int id) where T : class
        {
            var item = await dbSet.FindAsync(id);
            if (item == null) return NotFound();
            return item;
        }

        /// <summary>
        /// Creates a new record in the specified table. Evicts cache for T.
        /// </summary>
        private async Task<ActionResult<T>> Create<T>(DbSet<T> dbSet, T item) where T : class
        {
            dbSet.Add(item);
            await _context.SaveChangesAsync();
            ClearCache<T>();
            return item;
        }

        /// <summary>
        /// Updates an existing record with concurrency check. Evicts cache for T.
        /// </summary>
        private async Task<IActionResult> Update<T>(int id, T item) where T : BaseEntity
        {
            var existing = await _context.Set<T>().FindAsync(id);
            if (existing == null) return NotFound();

            // Set modified timestamp
            item.ModifiedOn = DateTime.UtcNow;

            // Preserve the original auditing fields to prevent them from being reset to defaults (e.g. 0001-01-01)
            var originalCreatedBy = existing.CreatedBy;
            var originalCreatedOn = existing.CreatedOn;

            // Safe incremental update via EF Core entry current values mapping
            _context.Entry(existing).CurrentValues.SetValues(item);

            // Restore the original auditing fields
            existing.CreatedBy = originalCreatedBy;
            existing.CreatedOn = originalCreatedOn;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ItemExists(id, item)) return NotFound();
                else throw;
            }

            ClearCache<T>();
            return NoContent();
        }

        /// <summary>
        /// Checks if a record exists in the database.
        /// </summary>
        private async Task<bool> ItemExists<T>(int id, T item) where T : class
        {
            var existing = await _context.Set<T>().FindAsync(id);
            return existing != null;
        }

        /// <summary>
        /// Performs a soft delete on the specified record. Evicts cache for T.
        /// </summary>
        private async Task<IActionResult> Delete<T>(DbSet<T> dbSet, int id) where T : BaseEntity
        {
            var item = await dbSet.FindAsync(id);
            if (item == null) return NotFound();

            item.IsDeleted = true;
            item.IsActive = false;
            await _context.SaveChangesAsync();

            ClearCache<T>();
            return NoContent();
        }

        // --- Standards ---
        [HttpGet("standards")]
        public async Task<ActionResult<IEnumerable<Standard>>> GetStandards() => await GetAll(_context.Standards);

        [HttpPost("standards")]
        public async Task<ActionResult<Standard>> CreateStandard(Standard standard) => await Create(_context.Standards, standard);

        [HttpPut("standards/{id}")]
        public async Task<IActionResult> UpdateStandard(int id, Standard standard) => await Update(id, standard);

        [HttpDelete("standards/{id}")]
        public async Task<IActionResult> DeleteStandard(int id) => await Delete(_context.Standards, id);

        // --- Sections ---
        [HttpGet("sections")]
        public async Task<ActionResult<IEnumerable<Section>>> GetSections() => await GetAll(_context.Sections);

        [HttpPost("sections")]
        public async Task<ActionResult<Section>> CreateSection(Section section) => await Create(_context.Sections, section);

        [HttpPut("sections/{id}")]
        public async Task<IActionResult> UpdateSection(int id, Section section) => await Update(id, section);

        [HttpDelete("sections/{id}")]
        public async Task<IActionResult> DeleteSection(int id) => await Delete(_context.Sections, id);

        // --- Academic Years ---
        [HttpGet("academic-years")]
        public async Task<ActionResult<IEnumerable<AcademicYear>>> GetAcademicYears() => await GetAll(_context.AcademicYears);

        [HttpPost("academic-years")]
        public async Task<ActionResult<AcademicYear>> CreateAcademicYear(AcademicYear item) => await Create(_context.AcademicYears, item);

        [HttpPut("academic-years/{id}")]
        public async Task<IActionResult> UpdateAcademicYear(int id, AcademicYear item) => await Update(id, item);

        [HttpDelete("academic-years/{id}")]
        public async Task<IActionResult> DeleteAcademicYear(int id) => await Delete(_context.AcademicYears, id);

        // --- Castes ---
        [HttpGet("castes")]
        public async Task<ActionResult<IEnumerable<Caste>>> GetCastes() => await GetAll(_context.Castes);

        [HttpPost("castes")]
        public async Task<ActionResult<Caste>> CreateCaste(Caste item) => await Create(_context.Castes, item);

        [HttpPut("castes/{id}")]
        public async Task<IActionResult> UpdateCaste(int id, Caste item) => await Update(id, item);

        [HttpDelete("castes/{id}")]
        public async Task<IActionResult> DeleteCaste(int id) => await Delete(_context.Castes, id);

        // --- Sub-Castes ---
        [HttpGet("sub-castes")]
        public async Task<ActionResult<IEnumerable<SubCaste>>> GetSubCastes()
        {
            const string cacheKey = "Master_SubCaste";
            if (!_cache.TryGetValue(cacheKey, out List<SubCaste>? cachedList))
            {
                cachedList = await _context.SubCastes.Include(s => s.Caste).AsNoTracking().ToListAsync();
                _cache.Set(cacheKey, cachedList, TimeSpan.FromMinutes(15));
            }
            return Ok(cachedList);
        }

        [HttpPost("sub-castes")]
        public async Task<ActionResult<SubCaste>> CreateSubCaste(SubCaste item) => await Create(_context.SubCastes, item);

        [HttpPut("sub-castes/{id}")]
        public async Task<IActionResult> UpdateSubCaste(int id, SubCaste item) => await Update(id, item);

        [HttpDelete("sub-castes/{id}")]
        public async Task<IActionResult> DeleteSubCaste(int id) => await Delete(_context.SubCastes, id);

        // --- Religions ---
        [HttpGet("religions")]
        public async Task<ActionResult<IEnumerable<Religion>>> GetReligions() => await GetAll(_context.Religions);

        [HttpPost("religions")]
        public async Task<ActionResult<Religion>> CreateReligion(Religion item) => await Create(_context.Religions, item);

        [HttpPut("religions/{id}")]
        public async Task<IActionResult> UpdateReligion(int id, Religion item) => await Update(id, item);

        [HttpDelete("religions/{id}")]
        public async Task<IActionResult> DeleteReligion(int id) => await Delete(_context.Religions, id);

        // --- School Sections ---
        [HttpGet("school-sections")]
        public async Task<ActionResult<IEnumerable<SchoolSection>>> GetSchoolSections() => await GetAll(_context.SchoolSections);

        [HttpPost("school-sections")]
        public async Task<ActionResult<SchoolSection>> CreateSchoolSection(SchoolSection item) => await Create(_context.SchoolSections, item);

        [HttpPut("school-sections/{id}")]
        public async Task<IActionResult> UpdateSchoolSection(int id, SchoolSection item) => await Update(id, item);

        [HttpDelete("school-sections/{id}")]
        public async Task<IActionResult> DeleteSchoolSection(int id) => await Delete(_context.SchoolSections, id);

        // --- Staff Initials ---
        [HttpGet("staff-initials")]
        public async Task<ActionResult<IEnumerable<StaffInitial>>> GetStaffInitials() => await GetAll(_context.StaffInitials);

        [HttpPost("staff-initials")]
        public async Task<ActionResult<StaffInitial>> CreateStaffInitial(StaffInitial item) => await Create(_context.StaffInitials, item);

        [HttpPut("staff-initials/{id}")]
        public async Task<IActionResult> UpdateStaffInitial(int id, StaffInitial item) => await Update(id, item);

        [HttpDelete("staff-initials/{id}")]
        public async Task<IActionResult> DeleteStaffInitial(int id) => await Delete(_context.StaffInitials, id);

        // --- Attendance Statuses ---
        [HttpGet("attendance-statuses")]
        public async Task<ActionResult<IEnumerable<AttendanceStatus>>> GetAttendanceStatuses() => await GetAll(_context.AttendanceStatuses);

        [HttpPost("attendance-statuses")]
        public async Task<ActionResult<AttendanceStatus>> CreateAttendanceStatus(AttendanceStatus item) => await Create(_context.AttendanceStatuses, item);

        [HttpPut("attendance-statuses/{id}")]
        public async Task<IActionResult> UpdateAttendanceStatus(int id, AttendanceStatus item) => await Update(id, item);

        [HttpDelete("attendance-statuses/{id}")]
        public async Task<IActionResult> DeleteAttendanceStatus(int id) => await Delete(_context.AttendanceStatuses, id);

        // --- States ---
        [HttpGet("states")]
        public async Task<ActionResult<IEnumerable<State>>> GetStates() => await GetAll(_context.States);

        [HttpPost("states")]
        public async Task<ActionResult<State>> CreateState(State item) => await Create(_context.States, item);

        [HttpPut("states/{id}")]
        public async Task<IActionResult> UpdateState(int id, State item) => await Update(id, item);

        [HttpDelete("states/{id}")]
        public async Task<IActionResult> DeleteState(int id) => await Delete(_context.States, id);

        // --- Cities ---
        [HttpGet("cities")]
        public async Task<ActionResult<IEnumerable<City>>> GetCities()
        {
            const string cacheKey = "Master_City";
            if (!_cache.TryGetValue(cacheKey, out List<City>? cachedList))
            {
                cachedList = await _context.Cities.Include(c => c.State).AsNoTracking().ToListAsync();
                _cache.Set(cacheKey, cachedList, TimeSpan.FromMinutes(15));
            }
            return Ok(cachedList);
        }

        [HttpPost("cities")]
        public async Task<ActionResult<City>> CreateCity(City item) => await Create(_context.Cities, item);

        [HttpPut("cities/{id}")]
        public async Task<IActionResult> UpdateCity(int id, City item) => await Update(id, item);

        [HttpDelete("cities/{id}")]
        public async Task<IActionResult> DeleteCity(int id) => await Delete(_context.Cities, id);

        // --- Blood Groups ---
        [HttpGet("blood-groups")]
        public async Task<ActionResult<IEnumerable<BloodGroup>>> GetBloodGroups() => await GetAll(_context.BloodGroups);

        [HttpPost("blood-groups")]
        public async Task<ActionResult<BloodGroup>> CreateBloodGroup(BloodGroup item) => await Create(_context.BloodGroups, item);

        [HttpPut("blood-groups/{id}")]
        public async Task<IActionResult> UpdateBloodGroup(int id, BloodGroup item) => await Update(id, item);

        [HttpDelete("blood-groups/{id}")]
        public async Task<IActionResult> DeleteBloodGroup(int id) => await Delete(_context.BloodGroups, id);

        // --- Houses ---
        [HttpGet("houses")]
        public async Task<ActionResult<IEnumerable<House>>> GetHouses() => await GetAll(_context.Houses);

        [HttpPost("houses")]
        public async Task<ActionResult<House>> CreateHouse(House item) => await Create(_context.Houses, item);

        [HttpPut("houses/{id}")]
        public async Task<IActionResult> UpdateHouse(int id, House item) => await Update(id, item);

        [HttpDelete("houses/{id}")]
        public async Task<IActionResult> DeleteHouse(int id) => await Delete(_context.Houses, id);

        // --- Admission Types ---
        [HttpGet("admission-types")]
        public async Task<ActionResult<IEnumerable<AdmissionType>>> GetAdmissionTypes() => await GetAll(_context.AdmissionTypes);

        [HttpPost("admission-types")]
        public async Task<ActionResult<AdmissionType>> CreateAdmissionType(AdmissionType item) => await Create(_context.AdmissionTypes, item);

        [HttpPut("admission-types/{id}")]
        public async Task<IActionResult> UpdateAdmissionType(int id, AdmissionType item) => await Update(id, item);

        [HttpDelete("admission-types/{id}")]
        public async Task<IActionResult> DeleteAdmissionType(int id) => await Delete(_context.AdmissionTypes, id);

        // --- Categories ---
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories() => await GetAll(_context.Categories);

        [HttpPost("categories")]
        public async Task<ActionResult<Category>> CreateCategory(Category item) => await Create(_context.Categories, item);

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, Category item) => await Update(id, item);

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id) => await Delete(_context.Categories, id);

        // --- Sessions ---
        [HttpGet("sessions")]
        public async Task<ActionResult<IEnumerable<Session>>> GetSessions() => await GetAll(_context.Sessions);

        [HttpPost("sessions")]
        public async Task<ActionResult<Session>> CreateSession(Session item) => await Create(_context.Sessions, item);

        [HttpPut("sessions/{id}")]
        public async Task<IActionResult> UpdateSession(int id, Session item) => await Update(id, item);

        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> DeleteSession(int id) => await Delete(_context.Sessions, id);

        // --- Batches ---
        [HttpGet("batches")]
        public async Task<ActionResult<IEnumerable<Batch>>> GetBatches() => await GetAll(_context.Batches);

        [HttpPost("batches")]
        public async Task<ActionResult<Batch>> CreateBatch(Batch item) => await Create(_context.Batches, item);

        [HttpPut("batches/{id}")]
        public async Task<IActionResult> UpdateBatch(int id, Batch item) => await Update(id, item);

        [HttpDelete("batches/{id}")]
        public async Task<IActionResult> DeleteBatch(int id) => await Delete(_context.Batches, id);

        // --- Shifts ---
        [HttpGet("shifts")]
        public async Task<ActionResult<IEnumerable<Shift>>> GetShifts() => await GetAll(_context.Shifts);

        [HttpPost("shifts")]
        public async Task<ActionResult<Shift>> CreateShift(Shift item) => await Create(_context.Shifts, item);

        [HttpPut("shifts/{id}")]
        public async Task<IActionResult> UpdateShift(int id, Shift item) => await Update(id, item);

        [HttpDelete("shifts/{id}")]
        public async Task<IActionResult> DeleteShift(int id) => await Delete(_context.Shifts, id);

        // --- Weekdays ---
        [HttpGet("weekdays")]
        public async Task<ActionResult<IEnumerable<Weekday>>> GetWeekdays() => await GetAll(_context.Weekdays);

        [HttpPost("weekdays")]
        public async Task<ActionResult<Weekday>> CreateWeekday(Weekday item) => await Create(_context.Weekdays, item);

        [HttpPut("weekdays/{id}")]
        public async Task<IActionResult> UpdateWeekday(int id, Weekday item) => await Update(id, item);

        [HttpDelete("weekdays/{id}")]
        public async Task<IActionResult> DeleteWeekday(int id) => await Delete(_context.Weekdays, id);

        // --- Holidays ---
        [HttpGet("holidays")]
        public async Task<ActionResult<IEnumerable<Holiday>>> GetHolidays() => await GetAll(_context.Holidays);

        [HttpPost("holidays")]
        public async Task<ActionResult<Holiday>> CreateHoliday(Holiday item) => await Create(_context.Holidays, item);

        [HttpPut("holidays/{id}")]
        public async Task<IActionResult> UpdateHoliday(int id, Holiday item) => await Update(id, item);

        [HttpDelete("holidays/{id}")]
        public async Task<IActionResult> DeleteHoliday(int id) => await Delete(_context.Holidays, id);

        // --- Subjects ---
        [HttpGet("subjects")]
        public async Task<ActionResult<IEnumerable<Subject>>> GetSubjects() => await GetAll(_context.Subjects);

        [HttpPost("subjects")]
        public async Task<ActionResult<Subject>> CreateSubject(Subject item) => await Create(_context.Subjects, item);

        [HttpPut("subjects/{id}")]
        public async Task<IActionResult> UpdateSubject(int id, Subject item) => await Update(id, item);

        [HttpDelete("subjects/{id}")]
        public async Task<IActionResult> DeleteSubject(int id) => await Delete(_context.Subjects, id);

        // --- Exam Types ---
        [HttpGet("exam-types")]
        public async Task<ActionResult<IEnumerable<ExamType>>> GetExamTypes() => await GetAll(_context.ExamTypes);

        [HttpPost("exam-types")]
        public async Task<ActionResult<ExamType>> CreateExamType(ExamType item) => await Create(_context.ExamTypes, item);

        [HttpPut("exam-types/{id}")]
        public async Task<IActionResult> UpdateExamType(int id, ExamType item) => await Update(id, item);

        [HttpDelete("exam-types/{id}")]
        public async Task<IActionResult> DeleteExamType(int id) => await Delete(_context.ExamTypes, id);

        // --- Designations ---
        [HttpGet("designations")]
        public async Task<ActionResult<IEnumerable<Designation>>> GetDesignations() => await GetAll(_context.Designations);

        [HttpPost("designations")]
        public async Task<ActionResult<Designation>> CreateDesignation(Designation item) => await Create(_context.Designations, item);

        [HttpPut("designations/{id}")]
        public async Task<IActionResult> UpdateDesignation(int id, Designation item) => await Update(id, item);

        [HttpDelete("designations/{id}")]
        public async Task<IActionResult> DeleteDesignation(int id) => await Delete(_context.Designations, id);

        // --- Occupations ---
        [HttpGet("occupations")]
        public async Task<ActionResult<IEnumerable<Occupation>>> GetOccupations() => await GetAll(_context.Occupations);

        [HttpPost("occupations")]
        public async Task<ActionResult<Occupation>> CreateOccupation(Occupation item) => await Create(_context.Occupations, item);

        [HttpPut("occupations/{id}")]
        public async Task<IActionResult> UpdateOccupation(int id, Occupation item) => await Update(id, item);

        [HttpDelete("occupations/{id}")]
        public async Task<IActionResult> DeleteOccupation(int id) => await Delete(_context.Occupations, id);

        // --- Roles ---
        [HttpGet("roles")]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles() => await GetAll(_context.Roles);

        [HttpPost("roles")]
        public async Task<ActionResult<Role>> CreateRole(Role item) => await Create(_context.Roles, item);

        [HttpPut("roles/{id}")]
        public async Task<IActionResult> UpdateRole(int id, Role item) => await Update(id, item);

        [HttpDelete("roles/{id}")]
        public async Task<IActionResult> DeleteRole(int id) => await Delete(_context.Roles, id);
    }
}
