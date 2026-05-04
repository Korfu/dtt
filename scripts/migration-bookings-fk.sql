-- scripts/migration-bookings-fk.sql
-- Adds a FK from bookings.user_id to profiles.id so PostgREST can
-- embed `profiles` in `bookings` queries (used by useBookings.fetch).
-- The existing FK to auth.users(id) stays — both can coexist.

ALTER TABLE bookings
  ADD CONSTRAINT bookings_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
