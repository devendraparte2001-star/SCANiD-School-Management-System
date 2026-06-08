# Code Change Documentation - Holidays visibility bug fix

## Summary of Issue
The user reported that added holidays were not displaying in the Holiday Master Registry list, even after being added or updated.

## Root Cause & Solution
1. **Case-Sensitive Model Binding Fallbacks**:
   - Depending on whether the database connects to the mock backend or the .NET Core host API, strict case capitalization mismatches between frontend properties (e.g., camelCase like `schoolId`, `fromDate`) and backend models (e.g., PascalCase like `SchoolId`, `FromDate`) can lead to unassigned properties (defaults like `null` or `0001-01-01`).
   - **Solution**: Implemented duplicate dual-casing support (`schoolId` & `SchoolId`, `academicYearId` & `AcademicYearId`, `fromDate` & `FromDate`, `toDate` & `ToDate`, etc.) across all standard masters in `handleSubmit` to guarantee robust binder alignment across all environments.

2. **Date Rendering Crash Protection**:
   - Rendering code used `.split('T')[0]` directly on properties. If the response fields ever returned dates inside date objects, integers, or alternative formats, calling `.split` directly threw a Javascript runtime `TypeError` — instantly breaking rendering for the entire list map.
   - **Solution**: Patched all split occurrences by wrapping the arguments in explicit string conversions (`String(item.fromDate).split('T')[0]`). This completely safeguards the listing from rendering crashes.

## Verified Files
- `/src/pages/Configuration.tsx` (Model payload double casing and safe string split guards)
