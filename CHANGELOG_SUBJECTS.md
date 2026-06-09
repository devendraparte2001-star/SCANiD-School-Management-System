# Code Change Documentation - Subject and Standard Mapping Implementation

## Summary of Feature
The user requested adding standard/grade mapping functionality for academic subjects inside the Subject Registry.

## Root Cause & Solution
1. **Database Schema Enhancements**:
   - The original `Subjects` table did not have an explicit foreign key column for standards.
   - **Solution**: Patched the self-healing DB startup routine in `Program.cs` to dynamically check the presence of `StandardId` on the `dbo.Subjects` table, executing `ALTER TABLE [dbo].[Subjects] ADD [StandardId] INT NULL` automatically on startup if missing.
   
2. **C# Model Enrichment**:
   - Upgraded the `Subject` entity inside `backend/ScanID.Api/Models/Models.cs` to declare both foreign identity `StandardId` and the relational navigation property `Standard`.
   - **Solution**: Added property `public int? StandardId { get; set; }` and relational property `[ForeignKey("StandardId")] public Standard? Standard { get; set; }` on the entity model.

3. **Frontend Subject Form & Registry Updates**:
   - The "Add New Subject" modal in `Configuration.tsx` lacked the option to select standard/grade associations.
   - **Solution**:
     - Automatically fetched standards under `dependencies.standards` on opening the "Subjects" master tab.
     - Embedded a beautiful standard selection component (`Select` dropdown UI) into the Add/Edit form layout.
     - Bound the standard selection to form states (`formData.standardId`), handled strict validation controls, and implemented dual-casing support (`standardId` and `StandardId`) within JSON request payloads.
     - Inserted a elegant "Standard Mapping" column status indicator in the visual registry table displaying the mapped standard name or "Not Mapped".

4. **Mock API Sync**:
   - Handled server fallback in `server.ts` by populating the initial mock subjects data array with valid `standardId` properties and mapped identities, maintaining unified visual integrity during offline transitions.

## Verified Files
- `/backend/ScanID.Api/Program.cs` (Self-healing DB schema updates)
- `/backend/ScanID.Api/Models/Models.cs` (C# entity definitions)
- `/src/pages/Configuration.tsx` (Form mapping, validation, layout grid representation)
- `/server.ts` (Mock API dataset defaults alignment)
