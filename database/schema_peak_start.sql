-- Add peak_start_days default to roasters table
ALTER TABLE roasters ADD COLUMN IF NOT EXISTS default_peak_start_days INTEGER;
