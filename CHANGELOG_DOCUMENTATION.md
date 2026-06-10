# Code Modification & System Realignment Documentation

This document records the exact database schema adjustments, stored procedure updates, and backend code enhancements implemented to address the outstanding issues in the ScanID Attendance module.

---

## 1. Summary of Changes

### A. Database Schema Upgrades
- **Model / Table Modification**: Added the missing `LeaveType` column to the `LeaveApplications` database table to track leave codes (e.g., `PL`, `PVL`, `D`) for approved leaves.
- **Self-Healing Init**: Appended an automatic check to `Program.cs` at startup to alter `dbo.LeaveApplications` and inject the `LeaveType` column if it is absent in existing deployments.

### B. Stored Procedure Improvements (`sp_ProcessIodataRecord`)
- **Location**: Recreated in `incremental_iodata_support.sql` and registered via raw SQL startup migrations in `Program.cs`.
- **Logic Realignment**: 
  - Eliminated hardcoded strings mapping to raw biometric attendance states inside `sp_ProcessIodataRecord`.
  - Configured dynamic lookup on the `dbo.AttendanceStatuses` table based on structural code mapping (`P` -> Present, `PL` -> Present but Late, `PVL` -> Present but Very Late).
  - Designed fallback states to preserve standard names (`Present`, `Present but Late`, `Present but Very Late`) if database entries are missing.

### C. Services Optimization (`AttendanceService.cs`)
- **Leave Application Alignment (`SubmitLeaveAsync`)**:
  - Automatically query and resolve the corresponding student's or staff's `SchoolId` and `AcademicYearId` if they are omitted by the client.
  - Ensures newly created leave applications are never separated or isolated from standard school-level and year-level data grids.
  - Automatically populate a fallback default `"L"` onto `LeaveType` if unspecified.
- **Thread-safe Dynamic Rescheduling (`ReprocessAttendanceRangeAsync`)**:
  - Queries `dbo.AttendanceStatuses` *once* at task start to build an in-memory mapping dictionary `statusMapping` of up-to-date custom codes to modified names.
  - Refactored `GetStatusNameFromCode` into a local dynamic helper mapping the calculated code to the true mapped database name of that status code.
  - Modified priorities in Student & Staff reprocessing to map custom leave types (`leave.LeaveType` instead of always setting it as static `"L"`).
- **Date Safety Comparisons**:
  - Re-anchored `isSpecial` shift comparisons using `.Value.Date` on nullable dates, avoiding false exclusions caused by time zone offsets.

### D. Biometric Realignment & Isolation (`IodataRecords`)
- **Columns Matching**: Updated `incremental_iodata_support.sql`'s `CREATE TABLE [dbo].[IodataRecords]` and the start-up SQL representation to match the customer's schema screenshot perfectly—ensuring that `SchoolId` (int, null) and `AcademicYearId` (int, null) columns are defined and kept fully intact.
- **Dynamic Retrieval**: Refactored the raw log parser within `sp_ProcessIodataRecord` (in both sql script and start-up migrations) to dynamically query the matched student/staff's `SchoolId` and `AcademicYearId`.
- **Dynamic Master Mapping**: Handled biometric timing results dynamically without hardcoding status strings like `'Present'` or `'Late'`. Instead, the status values are resolved dynamically from the `dbo.AttendanceStatuses` master table matching codes `P`, `PL`, or `PVL` natively.
- **Entity Model Compliance**: Since `IodataRecord` inherits from `BaseEntity`, properties `SchoolId` and `AcademicYearId` are dynamically inherited and tracked in Entity Framework, ensuring seamless database synchronization.

---

## 3. Session 2 High-Precision Realignment & Upgrades

### A. Missing Database Table Addition (`AttendanceLocks`)
- **Schema Insertion**: Created the `[dbo].[AttendanceLocks]` table structure in `/database.sql` to perfectly mirror the backend's C# `AttendanceLock` model definition (utilizing `Id`, `Year`, `Month`, `IsLocked`, `LockedBy`, and `LockedOn` tracking properties).

### B. Unified Sequential Navigation Hierarchy
- **No-Gap Continuations (1 to 53)**: Reconstructed the entire Dynamic Navigation system to use sequential, gapless continuous primary keys starting from `1` up to `53`:
  - **Level 0 Parents**: Standalone parent nodes aligned cleanly with sequential parents (Academic Operations `2`, Staff & HR `13`, Administrative `16`, Masters & Config `20`, System Audit `53`).
  - **Attendance Sub-menus**: Cleanly nested nested children under Parent ID `4` (Roll Call `5`, Manual Upload `6`, Leaves Register `7`, Reprocess Range `8`, Payroll Lock `9`, Correction Audit `10`, Reports `11`).
  - **Script Upgrades**: Rewrote `/update_navigation_v4.sql` with the fully aligned, sequential dataset, ensuring identity insert triggers run flawlessly.
  - **Role Mappings**: Configured foreign-key compliant mapping lines to automatically populate permissions for Roles (SuperAdmin, Admin, Teacher, Student, Parent) in `[dbo].[NavigationRoles]`.
  - **Sync Fallbacks**: Aligned `/server.ts` fallback `navigationItems` to match.

### C. True Dynamic Master Status Lookup
- **Eliminated Hardcoding**: Rewrote `sp_ProcessIodataRecord` inside both `/backend/ScanID.Api/incremental_iodata_support.sql` and `/backend/ScanID.Api/Program.cs` to resolve attendance status dynamically.
- **Master Mapping**: Mapped punch outcomes to status codes (`EG` for Early Goer, `P` for Present, `PL` for Present but Late, and `PVL` for Present but Very Late) and queried display labels dynamically from the `dbo.AttendanceStatuses` table.

---

## 4. Completed Verifications & Testing Logs

- **Solution Compilation**: Ran Vite & TypeScript production compilation checks. Build completed with a 100% success rate.
- **Linter Checks**: Code validations completed successfully with zero syntax, layout, or structural warnings.
- **Dev-Server Live State**: Reloaded the Node developer environment to load, compile, and route all paths stably.

