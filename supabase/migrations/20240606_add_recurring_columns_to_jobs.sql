-- Add recurring_type enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurring_type') THEN
        CREATE TYPE recurring_type AS ENUM ('none', 'weekly', 'biweekly', 'monthly');
    END IF;
END$$;

-- Add columns to the jobs table if they don't exist
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS recurring_type recurring_type NOT NULL DEFAULT 'none';

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS recurring_day integer; 