import { T } from '../themes';
import { BottomTab } from '../components/BottomTab';
import { IconChevR } from '../icons';

export function ProfileScreen({ user, profile, onTabChange, onLogout }) {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.ink, boxSizing: 'border-box', position: 'relative',
    }}>
      <div style={{
        padding: 'max(60px, calc(env(safe-area-inset-top) + 20px)) 20px 24px',
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.inkSoft,
        }}>Profil</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 100px' }}>
        <div style={{
          padding: 20, borderRadius: 18,
          background: T.bgCard, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: profile?.color || T.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 500,
          }}>{profile?.initials || '?'}</div>
          <div>
            <div style={{
              fontFamily: T.display, fontSize: 22, letterSpacing: '-0.02em',
            }}>{profile?.name || user?.email}</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{user?.email}</div>
            <div style={{
              marginTop: 8, padding: '3px 10px', borderRadius: 100,
              background: T.accentSoft, color: T.accentInk,
              border: `1px solid ${T.accentLine}`,
              fontFamily: T.mono, fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              display: 'inline-block',
            }}>Członek DTT</div>
          </div>
        </div>

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

        <button onClick={onLogout} style={{
          width: '100%', marginTop: 24,
          padding: '16px', borderRadius: 100,
          background: T.bgCard, border: `1px solid ${T.border}`,
          fontFamily: T.body, fontSize: 14, cursor: 'pointer',
          color: T.inkSoft,
        }}>Wyloguj</button>
      </div>

      <BottomTab active="profile" onTabChange={onTabChange} />
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div style={{
      padding: '16px 18px', marginBottom: 6,
      borderRadius: 14, background: T.bgCard,
      border: `1px solid ${T.borderSoft}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 14, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, color: T.ink }}>
        {value}
        <IconChevR size={14} stroke={T.inkMuted}/>
      </span>
    </div>
  );
}
