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
