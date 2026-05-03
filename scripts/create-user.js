/**
 * Create Supabase users with profiles.
 *
 * Prerequisites:
 *   1. Run scripts/migration.sql in the Supabase SQL Editor.
 *   2. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-user.js
 */

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Users to create — edit this list to add more users
// ---------------------------------------------------------------------------
const USERS = [
  {
    email: 'marcin.zajaczkowski@dtt.pl',
    password: 'Dtt123!',
    firstName: 'Marcin',
    lastName: 'Zajaczkowski',
    username: 'marcin.zajaczkowski',
    role: 'admin',
  },
];
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Run: node --env-file=.env.local scripts/create-user.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

function pickColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

async function createUser({ email, password, firstName, lastName, username, role }, index) {
  // 1. Create the auth user (email already confirmed)
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Auth error for ${email}: ${authError.message}`);
  }

  // 2. Insert the profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    name: `${firstName} ${lastName}`,
    username,
    initials: `${firstName[0]}${lastName[0]}`.toUpperCase(),
    color: pickColor(index),
    role,
  });

  if (profileError) {
    throw new Error(`Profile error for ${email}: ${profileError.message}`);
  }

  console.log(`✓ ${firstName} ${lastName} — ${email} — role: ${role}`);
}

console.log(`Creating ${USERS.length} user(s)...\n`);

for (let i = 0; i < USERS.length; i++) {
  try {
    await createUser(USERS[i], i);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
}

console.log('\nDone.');
