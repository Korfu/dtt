# Admin Users Panel — Design Spec

**Date:** 2026-05-03
**Status:** Approved

## Overview

An admin-only user management panel accessible from the Profile tab. Admins (like Marcin Zajaczkowski) can create, view, edit, and delete regular users entirely within the app. Admin accounts can only be created via the `scripts/create-user.js` CLI script — never from the UI.

## Decisions

| Question | Decision |
|---|---|
| Where does the panel live? | Drill-down from Profile tab (not a new bottom tab) |
| How are passwords set? | Admin sets a temporary password; user changes it later |
| What happens to bookings on delete? | Deleted along with the user |
| How is user creation handled securely? | Supabase Edge Functions with service role key |

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/screens/UsersScreen.jsx` | User list with add button |
| `src/screens/UserFormSheet.jsx` | Bottom sheet for create / edit / delete |
| `src/hooks/useUsers.js` | All user CRUD logic |
| `supabase/functions/admin-create-user/index.ts` | Edge Function — create auth user + profile |
| `supabase/functions/admin-update-user-password/index.ts` | Edge Function — reset a user's password |
| `supabase/functions/admin-delete-user/index.ts` | Edge Function — delete bookings + profile + auth user |
| `scripts/migration-rls.sql` | RLS policy for admin profile updates |

### Modified files

| File | Change |
|---|---|
| `src/App.jsx` | Add `'users'` tab value; render `UsersScreen` |
| `src/screens/ProfileScreen.jsx` | Add admin-only "Zarządzaj użytkownikami" row |

### Navigation flow

```
ProfileScreen
  └─ tap "Zarządzaj użytkownikami" (admin only)
       └─ tab = 'users' → UsersScreen (no bottom tab bar)
            ├─ tap regular user → UserFormSheet (edit mode)
            └─ tap + → UserFormSheet (create mode)
```

Back button in `UsersScreen` sets `tab = 'profile'`.

## Edge Functions

Both functions are deployed to Supabase and use the built-in `SUPABASE_SERVICE_ROLE_KEY` environment variable. No manual secrets configuration is required.

### Auth guard (both functions)
1. Read caller JWT from `Authorization` header
2. Look up `profiles.role` for that user ID
3. Reject with HTTP 403 if role is not `'admin'`

### `admin-create-user`

**Input:** `{ email, password, firstName, lastName, username, color }`

**Steps:**
1. Admin guard
2. `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
3. Insert row into `profiles` with `first_name`, `last_name`, `name`, `username`, `initials`, `color`, `role: 'user'`
4. Return `{ id }` of created user

### `admin-update-user-password`

**Input:** `{ userId, newPassword }`

**Steps:**
1. Admin guard
2. `supabase.auth.admin.updateUserById(userId, { password: newPassword })`

Called only when the password field in the edit form is non-empty on save.

### `admin-delete-user`

**Input:** `{ userId }`

**Steps:**
1. Admin guard
2. Delete all rows in `bookings` where `user_id = userId`
3. Delete row in `profiles` where `id = userId`
4. `supabase.auth.admin.deleteUser(userId)`

## Database

### `migration-rls.sql`

```sql
-- Allow admins to update any profile row
CREATE POLICY "admin can update profiles"
ON profiles FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
```

This is the only client-side write that bypasses Edge Functions. Create and delete use the service role via Edge Functions, so RLS does not apply to them.

## Screens

### `UsersScreen`

- Header: monospace label "Użytkownicy", serif title "Członkowie", back chevron (top-left) returning to `'profile'`
- Scrollable list of user cards:
  - Avatar circle (initials + color)
  - Full name (serif, large)
  - Username in monospace
  - Role badge: admins get a locked pill ("Admin"), regular users are tappable
- Floating `+` button (bottom-right, accent `T.accent`) opens `UserFormSheet` in create mode
- No `BottomTab` component

### `UserFormSheet`

Bottom sheet following the same visual pattern as `SlotSheet`.

**Create mode**
- Fields: First name, Last name, Username, Email, Password
- Color picker: 8 circular swatches (same palette as `scripts/create-user.js`)
- All fields required
- Confirm button calls `createUser()`

**Edit mode**
- Fields pre-populated
- Password field: blank = keep existing; placeholder "Zostaw puste, aby nie zmieniać"
- On save: profile fields updated via `updateUser()`; if password field is non-empty, also calls `updateUserPassword()` via the `admin-update-user-password` Edge Function
- Red "Usuń użytkownika" button at bottom
  - First tap: button transforms inline to "Czy na pewno? Usuń" + "Anuluj" (no separate modal)
  - Confirm tap calls `deleteUser()`

**Admin in edit mode**
- All fields are read-only (disabled styling)
- No delete button
- Informational note: "Administratorzy są zarządzani przez skrypt"

## `useUsers` hook

```
state:  users[]          — all profiles, loaded on mount
        loading          — boolean

actions:
  createUser(data)             — POST to admin-create-user Edge Function, append to users[]
  updateUser(id, data)         — UPDATE profiles row, merge into users[]
  updateUserPassword(id, pwd)  — POST to admin-update-user-password Edge Function
  deleteUser(id)               — POST to admin-delete-user Edge Function, remove from users[]
```

Error handling: each action throws on failure; the calling screen shows a `Toast` (reusing the existing toast system).

## Color palette (shared between script and UI)

```js
export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
```

Define in `src/data.js` and import from there in UI components. The CLI script (`scripts/create-user.js`) is a Node.js artefact that cannot import from `src/` — keep the array duplicated there with a comment pointing to `src/data.js` as the source of truth.

## Out of scope

- Password reset by the user themselves (post-login self-service)
- Invite-by-email flow
- Pagination (club is small; load all profiles at once)
- Admin-to-admin promotion via UI
