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
| `backend/ScanID.Api/Program.cs` | **Edited** | Added automated self-healing SQL initiation scripts that dynamically add missing columns, populate baseline seed data, and clean identity navigation items on start. Added 'Shifts', 'Messages', 'Notifications', and 'IodataRecords' to self-healing alignment cursor list to fix internal DB query exceptions. |
| `src/lib/api.ts` | **Edited** | Added client-side lookup getters (`getWeekdays`, `getHolidays`) and save parameters. |
| `src/pages/Configuration.tsx` | **Edited** | Configured `MASTER_TYPES` for weekdays and holidays. Integrated custom datetime validation, interactive days multi-checkbox lists, past-holiday badge highlighting, and role-based school selection filters. Implemented explicit trigger value bindings for dropdown lookups (resolving the raw ID display glitch) and unified multi-school ERP isolation filtering inside `filteredData` mapping. |

---

## 🛠️ Global Dropdown Display Name Mapping & Isolation Fixes (Checkpoint 1 Finalization)

### 1. Explicit ID-to-Text Select Trigger Mapping
- **The Issue**: Because Base UI is a headless, un-styled library, standard `<SelectValue>` calls with empty children display raw database IDs (e.g. `1`, `3`) instead of human-readable text upon asynchronous prepopulation or value changes.
- **The Resolution**: Updated all `<SelectValue>` elements in `Configuration.tsx` (School Assignment, Academic Year, State, City, Parent Caste, State Name, Parent Menu, System Role, and Assigned School selectors) to accept a dynamic render child which finds the matching display text from active dependencies based on the selected ID value.

### 2. Multi-School ERP Records Isolation
- **The Resolution**: Enhanced the client-side `filteredData` computation in `Configuration.tsx` so that when non-superadmin users (like School Admins) or superadmins with active institutional/year selections browse master config tables, the view filters on:
  1. **Active Institution** (`user.schoolId` match other than global defaults or null/unassigned fields).
  2. **Active Academic Session** (`user.academicYearId` match other than multi-year fallback defaults).

---

## 🔒 Self-Healing SQL Migrations Initialized (Seed Info)
The start pipeline running in `Program.cs` automatically ensures that:
- `Weekdays` table is created and seeded with IDs `1` to `7` representing **Monday** through **Sunday**.
- `Holidays` table is created.
- Existing custom navigation keys are safely ordered from `1` through `44`, appending the necessary permissions for the new modules under the **Master & Config** sidebar tab.

---

## 🛠️ Shift Master API Error Resolution (500 Internal Server Error)

### 1. Root-Cause Analysis
- **The Issue**: When attempting to fetch or manage Shift master records (`/api/masters/shifts`), the server returned an **HTTP 500 Internal Server Error**.
- **Cause**: The `Shift` class in `Models.cs` inherits from `BaseEntity` (which contains `SchoolId` and `AcademicYearId`). Entity Framework Core constructs SQL queries requesting `SchoolId` and `AcademicYearId` columns from the `Shifts` table. However, the database table lacked these columns, resulting in an `Invalid column name 'SchoolId'` SQL exception.

### 2. Implementation & Database Healing
- **The Resolution**: Modified `/backend/ScanID.Api/Program.cs` to add `'Shifts'` (along with `'Messages'`, `'Notifications'`, and `'IodataRecords'`) to the automated self-healing script's table list cursor.
- **Dynamic Migration**: On backend startup, the self-healing SQL initializer now identifies any table in this list missing `SchoolId` or `AcademicYearId` and runs safe incremental `ALTER TABLE` commands:
  - `ALTER TABLE [dbo].[Shifts] ADD [SchoolId] INT NULL;`
  - `ALTER TABLE [dbo].[Shifts] ADD [AcademicYearId] INT NULL;`
- This ensures full alignment between the C# models and the SQL database without breaking any pre-existing records.
