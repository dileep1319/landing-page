-- ============================================
-- COMPLETE SQL MIGRATION SCRIPT
-- Remove odds columns from games table
-- ============================================

-- Step 1: Add finished_at column (if not already added)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Remove odds1 and odds2 columns
ALTER TABLE games 
DROP COLUMN IF EXISTS odds1,
DROP COLUMN IF EXISTS odds2;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN games.finished_at IS 'Timestamp when the game was finished and winner was declared';

-- Step 4: Create index for finished games (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_games_finished_at ON games(finished_at) WHERE finished_at IS NOT NULL;

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify the changes
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games' 
ORDER BY ordinal_position;
