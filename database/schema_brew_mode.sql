-- Add brew_mode to coffees: 'concurrent' (default rotation) or 'stretch' (spaced across peak window)
ALTER TABLE coffees ADD COLUMN IF NOT EXISTS brew_mode TEXT NOT NULL DEFAULT 'concurrent'
  CHECK (brew_mode IN ('concurrent', 'stretch'));
