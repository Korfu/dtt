-- scripts/migration-bookings-unique.sql
-- Run in Supabase SQL Editor.
-- Prevents two users from booking the same court slot.

-- First, clean up any existing duplicates (keep the oldest)
DELETE FROM bookings a USING bookings b
WHERE a.day_date = b.day_date
  AND a.hour     = b.hour
  AND a.created_at > b.created_at;

-- Then enforce uniqueness on (day_date, hour)
ALTER TABLE bookings
  ADD CONSTRAINT bookings_slot_unique UNIQUE (day_date, hour);
