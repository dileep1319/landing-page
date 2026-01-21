-- Remove odds1 and odds2 columns from games table
-- This migration removes the odds columns as they are no longer needed

-- Step 1: Drop the columns
ALTER TABLE games 
DROP COLUMN IF EXISTS odds1,
DROP COLUMN IF EXISTS odds2;

-- Note: This is a destructive operation. 
-- If you have existing data in these columns that you want to preserve,
-- consider backing up the data first with:
-- CREATE TABLE games_backup AS SELECT * FROM games;
