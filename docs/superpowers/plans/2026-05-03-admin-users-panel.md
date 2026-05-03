# Admin Users Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only Users panel (accessible from the Profile tab) where Marcin can create, edit, and delete regular club members entirely within the app.

**Architecture:** Three Supabase Edge Functions (Deno/TypeScript) handle privileged auth operations (create user, update password, delete user) using the built-in service role key. Profile field updates go through the regular Supabase client with an RLS policy that allows admins to write any profile row. The React UI follows the app's existing inline-style patterns: `UsersScreen` renders the member list, `UserFormSheet` is a bottom sheet for create/edit/delete, and a `useUsers` hook owns all CRUD state.

**Tech Stack:** React 19, Supabase JS v2, Supabase Edge Functions (Deno), Supabase CLI, existing `Field` component, existing icon set from `src/icons.jsx`

---

### Task 1: RLS migration

**Files:**
- Create: `scripts/migration-rls.sql`

- [ ] **Step 1: Create the migration file**

```sql
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
```

- [ ] **Step 2: Run it in Supabase**

Open Supabase dashboard → SQL Editor → paste the file contents → Run.

Expected: "Success. No rows returned"

Note: if you get "policy already exists" errors the policies are already in place — that's fine.

- [ ] **Step 3: Commit**

```bash
git add scripts/migration-rls.sql
git commit -m "chore: add RLS policies for profiles table"
```

---

### Task 2: Supabase CLI setup

**Files:** none (tooling setup)

- [ ] **Step 1: Install Supabase CLI**

```bash
brew install supabase/tap/supabase
supabase --version
```

Expected: a version string like `2.x.x`

- [ ] **Step 2: Log in**

```bash
supabase login
```

This opens a browser for OAuth. Complete the login flow.

- [ ] **Step 3: Initialise the supabase directory**

```bash
supabase init
```

Expected: creates `supabase/` directory with `config.toml`. If it already exists, skip this step.

- [ ] **Step 4: Link to your project**

Find your project ref in the Supabase dashboard URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`.

```bash
supabase link --project-ref <PROJECT_REF>
```

Expected: "Finished supabase link."

- [ ] **Step 5: Commit the supabase config**

```bash
git add supabase/config.toml
git commit -m "chore: add supabase project config"
```

---

### Task 3: Edge Function — admin-create-user

**Files:**
- Create: `supabase/functions/admin-create-user/index.ts`

- [ ] **Step 1: Create the function**

```typescript
// supabase/functions/admin-create-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

  const adminClient = createClient(supabaseUrl, serviceKey)

  // Auth guard: verify caller is an admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  // Create the auth user
  const { email, password, firstName, lastName, username, color } = await req.json()

  const { data: { user: newUser }, error: authError } =
    await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
  if (authError) return json({ error: authError.message }, 400)

  // Insert profile — roll back the auth user if this fails
  const { error: profileError } = await adminClient.from('profiles').insert({
    id:         newUser!.id,
    first_name: firstName,
    last_name:  lastName,
    name:       `${firstName} ${lastName}`,
    username,
    initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
    color,
    role:       'user',
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser!.id)
    return json({ error: profileError.message }, 400)
  }

  return json({ id: newUser!.id })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/admin-create-user/index.ts
git commit -m "feat(functions): add admin-create-user edge function"
```

---

### Task 4: Edge Function — admin-update-user-password

**Files:**
- Create: `supabase/functions/admin-update-user-password/index.ts`

- [ ] **Step 1: Create the function**

```typescript
// supabase/functions/admin-update-user-password/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

  const adminClient = createClient(supabaseUrl, serviceKey)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  const { userId, newPassword } = await req.json()

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return json({ error: error.message }, 400)

  return json({ success: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/admin-update-user-password/index.ts
git commit -m "feat(functions): add admin-update-user-password edge function"
```

---

### Task 5: Edge Function — admin-delete-user

**Files:**
- Create: `supabase/functions/admin-delete-user/index.ts`

- [ ] **Step 1: Create the function**

```typescript
// supabase/functions/admin-delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

  const adminClient = createClient(supabaseUrl, serviceKey)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  const { userId } = await req.json()

  // Order matters: bookings first, then profile, then auth user
  const { error: bookingsError } = await adminClient
    .from('bookings').delete().eq('user_id', userId)
  if (bookingsError) return json({ error: bookingsError.message }, 400)

  const { error: profileError } = await adminClient
    .from('profiles').delete().eq('id', userId)
  if (profileError) return json({ error: profileError.message }, 400)

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) return json({ error: authError.message }, 400)

  return json({ success: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/admin-delete-user/index.ts
git commit -m "feat(functions): add admin-delete-user edge function"
```

---

### Task 6: Deploy all Edge Functions

**Files:** none (deployment step)

- [ ] **Step 1: Deploy admin-create-user**

```bash
supabase functions deploy admin-create-user
```

Expected: "Deployed Function admin-create-user on project ..."

- [ ] **Step 2: Deploy admin-update-user-password**

```bash
supabase functions deploy admin-update-user-password
```

Expected: "Deployed Function admin-update-user-password on project ..."

- [ ] **Step 3: Deploy admin-delete-user**

```bash
supabase functions deploy admin-delete-user
```

Expected: "Deployed Function admin-delete-user on project ..."

- [ ] **Step 4: Verify in dashboard**

Open Supabase dashboard → Edge Functions. You should see all three functions listed with green status indicators.

---

### Task 7: `useUsers` hook

**Files:**
- Create: `src/hooks/useUsers.js`

- [ ] **Step 1: Create the hook**

```js
// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  async function createUser({ email, password, firstName, lastName, username, color }) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, firstName, lastName, username, color },
    });
    if (error) throw error;
    setUsers(prev => [...prev, {
      id:         data.id,
      first_name: firstName,
      last_name:  lastName,
      name:       `${firstName} ${lastName}`,
      username,
      initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
      color,
      role:       'user',
    }]);
  }

  async function updateUser(id, { firstName, lastName, username, color }) {
    const updates = {
      first_name: firstName,
      last_name:  lastName,
      name:       `${firstName} ${lastName}`,
      username,
      initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
      color,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }

  async function updateUserPassword(id, newPassword) {
    const { error } = await supabase.functions.invoke('admin-update-user-password', {
      body: { userId: id, newPassword },
    });
    if (error) throw error;
  }

  async function deleteUser(id) {
    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: id },
    });
    if (error) throw error;
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return { users, loading, createUser, updateUser, updateUserPassword, deleteUser };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useUsers.js
git commit -m "feat(hooks): add useUsers hook for admin CRUD"
```

---

### Task 8: Extend `Field` component with `placeholder` prop

**Files:**
- Modify: `src/components/Field.jsx`

- [ ] **Step 1: Add `placeholder` prop**

Replace the entire contents of `src/components/Field.jsx` with:

```jsx
import { useState } from 'react';
import { T } from '../themes';

export function Field({ label, value, onChange, icon, type = 'text', placeholder = '' }) {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      borderRadius: T.radius - 4,
      background: T.bgCard,
      border: `1px solid ${focused ? T.ink : T.border}`,
      transition: 'border-color 0.15s',
      cursor: 'text',
    }}>
      {icon}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontFamily: T.mono,
          fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.inkMuted,
        }}>{label}</span>
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            border: 'none', outline: 'none', padding: 0,
            background: 'transparent',
            fontFamily: T.body,
            fontSize: 15, color: T.ink, marginTop: 2,
          }}
        />
      </div>
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Field.jsx
git commit -m "feat(components): add placeholder prop to Field"
```

---

### Task 9: `UserFormSheet`

**Files:**
- Create: `src/screens/UserFormSheet.jsx`

Note: create this before Task 10 (`UsersScreen`) because `UsersScreen` imports it.

- [ ] **Step 1: Create the sheet**

```jsx
// src/screens/UserFormSheet.jsx
import { useState } from 'react';
import { T } from '../themes';
import { USER_COLORS } from '../data';
import { Field } from '../components/Field';
import { IconClose, IconCheck, IconTrash, IconMail, IconUser, IconLock } from '../icons';

export function UserFormSheet({ mode, user, onClose, onCreate, onUpdate, onDelete }) {
  const isAdmin  = user?.role === 'admin';
  const isCreate = mode === 'create';

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName,  setLastName]  = useState(user?.last_name  || '');
  const [username,  setUsername]  = useState(user?.username   || '');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [color,     setColor]     = useState(user?.color || USER_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (isCreate) {
        await onCreate({ firstName, lastName, username, email, password, color });
      } else {
        await onUpdate(user.id, { firstName, lastName, username, color }, password || null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete(user.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.18s ease-out',
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }              to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: T.bg, color: T.ink,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '8px 24px max(32px, calc(env(safe-area-inset-bottom) + 16px))',
        boxSizing: 'border-box',
        animation: 'slideUp 0.22s ease-out',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: T.border, margin: '0 auto 18px',
        }}/>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 22,
        }}>
          <div style={{
            fontFamily: T.display, fontSize: 26,
            fontWeight: 400, letterSpacing: '-0.02em',
          }}>
            {isCreate ? 'Nowy użytkownik' : (user?.name || 'Edytuj')}
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${T.border}`, background: T.bgCard,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <IconClose size={16} stroke={T.ink} />
          </button>
        </div>

        {isAdmin ? <AdminReadOnly user={user} /> : (
          <EditableForm
            isCreate={isCreate}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName}   setLastName={setLastName}
            username={username}   setUsername={setUsername}
            email={email}         setEmail={setEmail}
            password={password}   setPassword={setPassword}
            color={color}         setColor={setColor}
            confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
            saving={saving}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

function AdminReadOnly({ user }) {
  return (
    <div>
      <div style={{
        padding: '14px 16px', borderRadius: T.radius,
        background: T.accentSoft, border: `1px solid ${T.accentLine}`,
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16,
        fontFamily: T.body, fontSize: 13, color: T.accentInk,
      }}>
        <IconLock size={15} stroke={T.accentInk} />
        Administratorzy są zarządzani przez skrypt
      </div>
      <div style={{
        padding: '14px 16px', borderRadius: T.radius,
        background: T.bgCard, border: `1px solid ${T.border}`,
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 9,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: T.inkMuted,
        }}>Imię i nazwisko</div>
        <div style={{ fontSize: 15, marginTop: 3 }}>{user?.name}</div>
      </div>
      <div style={{
        padding: '14px 16px', borderRadius: T.radius,
        background: T.bgCard, border: `1px solid ${T.border}`,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 9,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: T.inkMuted,
        }}>Nazwa użytkownika</div>
        <div style={{ fontSize: 15, marginTop: 3 }}>@{user?.username}</div>
      </div>
    </div>
  );
}

function EditableForm({
  isCreate,
  firstName, setFirstName, lastName, setLastName,
  username, setUsername, email, setEmail,
  password, setPassword, color, setColor,
  confirmDelete, setConfirmDelete,
  saving, onSave, onDelete,
}) {
  return (
    <div>
      <SectionLabel>Dane osobowe</SectionLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <Field label="Imię" value={firstName} onChange={setFirstName}
            icon={<IconUser size={16} stroke={T.inkMuted} />} />
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Nazwisko" value={lastName} onChange={setLastName} />
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <Field label="Nazwa użytkownika" value={username} onChange={setUsername} />
      </div>

      {isCreate && (
        <>
          <SectionLabel>Dane logowania</SectionLabel>
          <div style={{ marginBottom: 8 }}>
            <Field label="Email" value={email} onChange={setEmail}
              type="email" icon={<IconMail size={16} stroke={T.inkMuted} />} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Field label="Hasło" value={password} onChange={setPassword} type="password" />
          </div>
        </>
      )}

      {!isCreate && (
        <>
          <SectionLabel>Zmiana hasła</SectionLabel>
          <div style={{ marginBottom: 20 }}>
            <Field
              label="Nowe hasło" value={password} onChange={setPassword}
              type="password" placeholder="Zostaw puste, aby nie zmieniać"
            />
          </div>
        </>
      )}

      <SectionLabel>Kolor awatara</SectionLabel>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {USER_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: c,
            border: color === c ? `3px solid ${T.ink}` : '3px solid transparent',
            cursor: 'pointer', padding: 0, boxSizing: 'border-box',
          }}/>
        ))}
      </div>

      <button onClick={onSave} disabled={saving} style={{
        width: '100%', height: 56, borderRadius: T.radiusPill, border: 'none',
        background: T.accent, color: T.accentInk,
        fontFamily: T.body, fontSize: 16, fontWeight: 500,
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginBottom: 12,
      }}>
        <IconCheck size={18} stroke={T.accentInk} />
        {isCreate ? 'Dodaj użytkownika' : 'Zapisz zmiany'}
      </button>

      {!isCreate && !confirmDelete && (
        <button onClick={() => setConfirmDelete(true)} style={{
          width: '100%', padding: '14px', borderRadius: T.radiusPill,
          background: T.bgCard, border: '1px solid rgba(180,40,40,0.25)',
          color: '#C53737', fontFamily: T.body, fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <IconTrash size={16} stroke="#C53737" />
          Usuń użytkownika
        </button>
      )}

      {!isCreate && confirmDelete && (
        <div style={{
          padding: 16, borderRadius: T.radius,
          border: '1px solid rgba(180,40,40,0.25)', background: '#FBF3F3',
        }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
            Usunąć tego użytkownika?
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14 }}>
            Konto i wszystkie rezerwacje zostaną trwale usunięte.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmDelete(false)} style={{
              flex: 1, height: 44, borderRadius: 100,
              border: `1px solid ${T.border}`, background: T.bgCard, color: T.ink,
              fontFamily: T.body, fontSize: 14, cursor: 'pointer',
            }}>Anuluj</button>
            <button onClick={onDelete} disabled={saving} style={{
              flex: 1, height: 44, borderRadius: 100,
              border: 'none', background: '#C53737', color: '#fff',
              fontFamily: T.body, fontSize: 14, fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>Tak, usuń</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: 10,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: T.inkSoft, marginBottom: 10,
    }}>{children}</div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/UserFormSheet.jsx
git commit -m "feat(screens): add UserFormSheet for create/edit/delete users"
```

---

### Task 10: `UsersScreen`

**Files:**
- Create: `src/screens/UsersScreen.jsx`

- [ ] **Step 1: Create the screen**

```jsx
// src/screens/UsersScreen.jsx
import { useState } from 'react';
import { T } from '../themes';
import { IconChevL, IconPlus, IconLock } from '../icons';
import { useUsers } from '../hooks/useUsers';
import { UserFormSheet } from './UserFormSheet';

export function UsersScreen({ onTabChange, onToast }) {
  const { users, loading, createUser, updateUser, updateUserPassword, deleteUser } = useUsers();
  const [sheet, setSheet] = useState(null); // null | { mode: 'create' } | { mode: 'edit', user }

  async function handleCreate(data) {
    try {
      await createUser(data);
      setSheet(null);
      onToast({ type: 'success', text: 'Użytkownik dodany' });
    } catch (err) {
      onToast({ type: 'error', text: err.message || 'Nie udało się dodać użytkownika' });
    }
  }

  async function handleUpdate(id, data, newPassword) {
    try {
      await updateUser(id, data);
      if (newPassword) await updateUserPassword(id, newPassword);
      setSheet(null);
      onToast({ type: 'success', text: 'Zapisano zmiany' });
    } catch (err) {
      onToast({ type: 'error', text: err.message || 'Nie udało się zapisać zmian' });
    }
  }

  async function handleDelete(id) {
    try {
      await deleteUser(id);
      setSheet(null);
      onToast({ type: 'neutral', text: 'Użytkownik usunięty' });
    } catch (err) {
      onToast({ type: 'error', text: err.message || 'Nie udało się usunąć użytkownika' });
    }
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.ink, boxSizing: 'border-box', position: 'relative',
    }}>
      <div style={{
        padding: 'max(60px, calc(env(safe-area-inset-top) + 20px)) 20px 20px',
      }}>
        <button onClick={() => onTabChange('profile')} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: T.mono, fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.inkSoft, padding: 0, marginBottom: 8,
        }}>
          <IconChevL size={12} stroke={T.inkSoft} />
          Profil
        </button>
        <div style={{
          fontFamily: T.display, fontSize: 28,
          fontWeight: 400, letterSpacing: '-0.02em',
        }}>Członkowie</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `2px solid ${T.border}`, borderTopColor: T.accent,
              animation: 'spin 0.7s linear infinite',
            }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : users.map(u => (
          <UserCard key={u.id} user={u} onTap={() => setSheet({ mode: 'edit', user: u })} />
        ))}
      </div>

      {/* Floating action button */}
      <button onClick={() => setSheet({ mode: 'create' })} style={{
        position: 'absolute',
        bottom: 'max(32px, calc(env(safe-area-inset-bottom) + 20px))',
        right: 20,
        width: 56, height: 56, borderRadius: '50%',
        background: T.accent, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        <IconPlus size={22} stroke={T.accentInk} />
      </button>

      {sheet && (
        <UserFormSheet
          mode={sheet.mode}
          user={sheet.user || null}
          onClose={() => setSheet(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function UserCard({ user, onTap }) {
  const isAdmin = user.role === 'admin';
  return (
    <button onClick={onTap} style={{
      width: '100%', marginBottom: 8,
      padding: '14px 16px', borderRadius: T.radius,
      background: T.bgCard, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: user.color || T.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: T.body, fontSize: 14, fontWeight: 500,
      }}>{user.initials || '?'}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: T.display, fontSize: 17,
          letterSpacing: '-0.01em', color: T.ink,
        }}>{user.name}</div>
        <div style={{
          fontFamily: T.mono, fontSize: 10,
          letterSpacing: '0.06em', color: T.inkSoft, marginTop: 2,
        }}>@{user.username}</div>
      </div>

      {isAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 100,
          background: T.accentSoft, border: `1px solid ${T.accentLine}`,
          fontFamily: T.mono, fontSize: 9,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.accentInk, flexShrink: 0,
        }}>
          <IconLock size={9} stroke={T.accentInk} />
          Admin
        </div>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/UsersScreen.jsx
git commit -m "feat(screens): add UsersScreen for admin user management"
```

---

### Task 11: Wire `UsersScreen` into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import**

After the existing screen imports (around line 10), add:

```jsx
import { UsersScreen } from './screens/UsersScreen';
```

- [ ] **Step 2: Add the `'users'` case**

Find this block (around line 91):

```jsx
  } else {
    screen = (
      <ProfileScreen
        user={user} profile={profile}
        onTabChange={setTab}
        onLogout={logout}
      />
    );
  }
```

Replace with:

```jsx
  } else if (tab === 'users') {
    screen = (
      <UsersScreen
        onTabChange={setTab}
        onToast={setToast}
      />
    );
  } else {
    screen = (
      <ProfileScreen
        user={user} profile={profile}
        onTabChange={setTab}
        onLogout={logout}
      />
    );
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat(app): wire UsersScreen into tab navigation"
```

---

### Task 12: Add admin entry point to `ProfileScreen`

**Files:**
- Modify: `src/screens/ProfileScreen.jsx`

- [ ] **Step 1: Add the admin button**

Find this block (around line 49):

```jsx
        <ProfileRow label="Klub" value="DTT Działdowo" />
        <ProfileRow label="Język" value="Polski" />
        <ProfileRow label="Powiadomienia" value="Włączone" />
```

Replace with:

```jsx
        {profile?.role === 'admin' && (
          <button onClick={() => onTabChange('users')} style={{
            width: '100%', marginBottom: 18,
            padding: '16px 18px', borderRadius: 14,
            background: T.bgCard, border: `1px solid ${T.accentLine}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>
              Zarządzaj użytkownikami
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 100,
              background: T.accentSoft, color: T.accentInk,
              border: `1px solid ${T.accentLine}`,
              fontFamily: T.mono, fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Admin</span>
          </button>
        )}

        <ProfileRow label="Klub" value="DTT Działdowo" />
        <ProfileRow label="Język" value="Polski" />
        <ProfileRow label="Powiadomienia" value="Włączone" />
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ProfileScreen.jsx
git commit -m "feat(screens): add admin entry point to ProfileScreen"
```

---

### Task 13: Smoke test

No automated tests exist in this project. Verify the feature manually in the browser.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Log in as Marcin (admin)**

Use the credentials from `scripts/create-user.js`. Navigate to the Profile tab — you should see a "Zarządzaj użytkownikami" button with the "Admin" badge above the other profile rows.

- [ ] **Step 3: Create a regular user**

Tap "Zarządzaj użytkownikami" → tap the `+` FAB → fill in all fields → tap "Dodaj użytkownika". Expected: toast "Użytkownik dodany", new card appears in the list.

- [ ] **Step 4: Verify the new user can log in**

Log out → log in with the email and password you just created. Expected: normal app access with no "Zarządzaj użytkownikami" button in the Profile tab.

- [ ] **Step 5: Log back in as Marcin and edit the user**

Tap the user card → change the first name → tap "Zapisz zmiany". Expected: toast "Zapisano zmiany", card name updates.

- [ ] **Step 6: Reset the user's password**

Open the same user → enter a new password → save. Log out → log in as the user with the new password. Expected: login succeeds.

- [ ] **Step 7: Delete the user**

Log back in as Marcin → open the user card → tap "Usuń użytkownika" → tap "Tak, usuń". Expected: toast "Użytkownik usunięty", card disappears. Verify in Supabase dashboard → Authentication → Users that the auth user is also gone.

- [ ] **Step 8: Verify admin read-only view**

Tap Marcin's own card in the Users list. Expected: sheet opens with the lock notice "Administratorzy są zarządzani przez skrypt", read-only name/username display, no editable fields, no delete button.
