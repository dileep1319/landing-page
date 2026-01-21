-- Add finished_at column to games table
-- This column stores the timestamp when a game is marked as finished and a winner is declared

ALTER TABLE games 
ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN games.finished_at IS 'Timestamp when the game was finished and winner was declared';

-- Optional: Create an index for faster queries on finished games
CREATE INDEX idx_games_finished_at ON games(finished_at) WHERE finished_at IS NOT NULL;
