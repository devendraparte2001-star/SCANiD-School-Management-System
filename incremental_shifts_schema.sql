-- INTERMEDIATE ALTER SCRIPT FOR SCHOOL SHIFTS
-- Adds standard, industrial shift columns to support modern attendance tracking

ALTER TABLE [dbo].[Shifts] ADD [StartTime] [nvarchar](15) NULL;
ALTER TABLE [dbo].[Shifts] ADD [EndTime] [nvarchar](15) NULL;
ALTER TABLE [dbo].[Shifts] ADD [GraceInTime] [nvarchar](15) NULL;
ALTER TABLE [dbo].[Shifts] ADD [SpanInTime] [nvarchar](15) NULL;
ALTER TABLE [dbo].[Shifts] ADD [LunchStart] [nvarchar](15) NULL;
ALTER TABLE [dbo].[Shifts] ADD [LunchEnd] [nvarchar](15) NULL;
GO
