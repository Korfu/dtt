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
