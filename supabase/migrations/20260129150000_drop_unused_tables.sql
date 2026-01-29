-- GetCareKorea: Drop unused tables
-- Migration: drop_unused_tables
-- Created: 2026-01-29
-- Purpose: Remove bookings, interpreters, reviews tables and related views that are not used

-- Drop views first
DROP VIEW IF EXISTS interpreter_profiles CASCADE;
DROP VIEW IF EXISTS interpreter_listings CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_interpreter_rating_trigger ON reviews;

-- Drop functions that depend on interpreters table
DROP FUNCTION IF EXISTS update_interpreter_rating() CASCADE;

-- Drop bookings table (no UI, API only - dead code)
DROP TABLE IF EXISTS bookings CASCADE;

-- Drop interpreters table (replaced by author_personas)
DROP TABLE IF EXISTS interpreters CASCADE;

-- Drop reviews table (review system not implemented)
DROP TABLE IF EXISTS reviews CASCADE;

-- Clean up any orphaned RLS policies (if they exist)
-- These will fail silently if tables don't exist

-- Note: The following tables are kept:
-- - author_personas: Used for interpreter profiles
-- - hospitals: Used for hospital listings
-- - doctors: Used for hospital detail pages (minimal usage but linked to hospitals)
-- - procedures: Used for procedure pages
-- - inquiries: Used for customer inquiries
-- - All other active tables
