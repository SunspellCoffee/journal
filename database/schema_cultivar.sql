-- Add cultivar field to coffees table
ALTER TABLE coffees ADD COLUMN IF NOT EXISTS cultivar TEXT;
