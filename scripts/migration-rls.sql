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
-- (INSERT and DELETE are intentionally not allowed from clients;
--  those go through the admin-* edge functions which use the service role)
CREATE POLICY "admin can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Prevent role escalation/demotion via the client UPDATE policy.
-- Only the service role (used by edge functions) can change a profile's role.
CREATE OR REPLACE FUNCTION prevent_role_change_from_client()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'role can only be changed by the service role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_change_from_client ON profiles;
CREATE TRIGGER prevent_role_change_from_client
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_change_from_client();
