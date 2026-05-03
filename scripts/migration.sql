-- Run this in the Supabase SQL Editor before using create-user.js
-- Adds first_name, last_name, username, and role columns to profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS username   text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS role       text NOT NULL DEFAULT 'user';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_username_key UNIQUE (username);
