-- scripts/migration-rls.sql
-- Run in Supabase SQL Editor: Project → SQL Editor → New query

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read all profiles
-- (needed so the booking grid can show other users' avatars)
CREATE POLICY "profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Allow admins to update any profile row
CREATE POLICY "admin can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
