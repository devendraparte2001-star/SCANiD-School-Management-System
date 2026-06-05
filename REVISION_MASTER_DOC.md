# School ERP Masters & Configurations Revision Documentation

This document lists all modifications, bug fixes, database schema updates, and UI/UX design enhancements implemented globally across the application. All updates are made following production standards, with built-in role-based security configurations.

---

## 🚀 Key Improvements & Architecture Updates

### 1. Unified Institutional Audit Fields (`BaseEntity`)
- **Modifications**: Added `SchoolId` and `AcademicYearId` as global parameters on the `BaseEntity` level to tie all child masters to specific institutions seamlessly.
- **Deduplication**: Removed redundant custom `SchoolId` and `AcademicYearId` definitions from individual model entities (such as `User`, `Student`, and `Staff`) to resolve potential database mapping conflicts.

### 2. High-Fidelity Shift Master Enhancements
- **Dynamic Weekdays Assignment**: Stores selected weekday IDs from the `Weekdays` master as a comma-separated list of references.
- **Special Shift Mode**: Implemented a `"Is Special Shift"` configuration to handle temporary/exam shifts. 
- **Date Constraints**: Displays adaptive **From Date** and **To Date** pickers with deep visual validation (preventing back-dated ranges or invalid chronological ordering).

### 3. All-New Weekdays Master & Holidays Master
- **Weekdays Master**: Enables custom settings for institutional active days.
- **Holidays Master**: Implemented to easily track school and staff off-periods. Past holidays are dynamically highlighted on the list view using a soft eye-safe neutral gray badge (`"Passed Holiday"`), while future ones appear as active green badges.

### 4. Adaptive School & Academic Year Filtering on All Masters
- **RBAC Specific Dropdowns**: Form views dynamically check the current user's role. **Superadmins** are presented with a complete school dropdown selector, while **Admins** only see their assigned institution.
- **Payload Automation**: All master creation/modifications automatically bundle and submit the active `schoolId` and `academicYearId` based on headers and fallback global filters.

---

## 🛠️ Complete Summary of Edited Files

| File Path | Operations | Purpose |
| :--- | :--- | :--- |
| `backend/ScanID.Api/Models/Models.cs` | **Edited** | Modified `BaseEntity` to hold school and academic year references. Added `Weekday` and `Holiday` structural tables. Configured extended Shift parameter properties. |
| `backend/ScanID.Api/Data/ApplicationDbContext.cs` | **Edited** | Registered `Weekday` and `Holiday` DbSets. Enabled automatic soft-delete query filters for query isolation. |
| `backend/ScanID.Api/Controllers/MastersController.cs` | **Edited** | Implemented high-level generic CRUD endpoints for `Weekday` and `Holiday`. |
| `backend/ScanID.Api/Controllers/NavigationController.cs` | **Edited** | Added fallback menu configurations for both Weekday and Holiday masters under ID `43` and `44`. |
| `backend/ScanID.Api/Controllers/StaffController.cs` | **Edited** | Safe assignment of the nullable `SchoolId` field using C# null-coalescing operator (`staff.SchoolId ?? 0`) inside object factory projection method to prevent CS0266 compiler failure. |
| `backend/ScanID.Api/Controllers/StudentsController.cs` | **Edited** | Checked for type safety of the nullable `SchoolId` field in `ToDto` projection, and secured folder name sanitization flow by introducing compile-time non-null parameter resolution indicators (`student.SchoolId!.Value` and `schoolIdVal ?? "1"`), eliminating static analysis warning CS8604. |
| `backend/ScanID.Api/Utilities/DbMapper.cs` | **Edited** | Guaranteed nullable `SchoolId` conversion safety on entity mapping bindings by using safe fallback coalescing assignments when constructing connected custom joins. |
| `backend/ScanID.Api/Program.cs` | **Edited** | Added automated self-healing SQL initiation scripts that dynamically add missing columns, populate baseline seed data, and clean identity navigation items on start. |
| `src/lib/api.ts` | **Edited** | Added client-side lookup getters (`getWeekdays`, `getHolidays`) and save parameters. |
| `src/pages/Configuration.tsx` | **Edited** | Configured `MASTER_TYPES` for weekdays and holidays. Integrated custom datetime validation, interactive days multi-checkbox lists, past-holiday badge highlighting, and role-based school selection filters. |

---

## 🔒 Self-Healing SQL Migrations Initialized (Seed Info)
The start pipeline running in `Program.cs` automatically ensures that:
- `Weekdays` table is created and seeded with IDs `1` to `7` representing **Monday** through **Sunday**.
- `Holidays` table is created.
- Existing custom navigation keys are safely ordered from `1` through `44`, appending the necessary permissions for the new modules under the **Master & Config** sidebar tab.
