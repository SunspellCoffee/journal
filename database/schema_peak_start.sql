-- Add peak window start (days from roast) to roasters and coffees
ALTER TABLE roasters ADD COLUMN IF NOT EXISTS default_peak_start_days INTEGER;
ALTER TABLE coffees ADD COLUMN IF NOT EXISTS peak_start_days INTEGER;
