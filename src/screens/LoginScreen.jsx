import { useState } from 'react';
import { T } from '../themes';
import { Field } from '../components/Field';
import { IconBall, IconChevR, IconMail, IconLock } from '../icons';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Podaj e-mail i hasło.'); return; }
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (e) {
      setError('Nieprawidłowy e-mail lub hasło.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: 'max(80px, calc(env(safe-area-inset-top) + 40px)) 28px 40px',
      background: T.bg, color: T.ink, boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 8px 8px',
          border: `1px solid ${T.border}`,
          borderRadius: 100,
          background: T.bgCard,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconBall size={16} color={T.accent} />
          </div>
          <span style={{
            fontFamily: T.mono,
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: T.inkSoft,
          }}>DTT Działdowo</span>
        </div>
      </div>

      <h1 style={{
        fontFamily: T.display,
        fontWeight: 400, fontSize: 40, lineHeight: 1.05,
        margin: 0, letterSpacing: '-0.02em',
        color: T.ink,
      }}>
        Zarezerwuj<br/>
        <span style={{ fontStyle: 'italic', color: T.inkMuted }}>kort.</span>
      </h1>
      <p style={{
        marginTop: 14, marginBottom: 36,
        fontSize: 15, lineHeight: 1.45,
        color: T.inkSoft, maxWidth: 280,
      }}>
        Jeden kort, siedem dni, prosta rezerwacja. Zaloguj się, aby kontynuować.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field
          label="E-mail" value={email} onChange={setEmail}
          icon={<IconMail size={18} stroke={T.inkSoft} />}
        />
        <Field
          label="Hasło" value={password} onChange={setPassword} type="password"
          icon={<IconLock size={18} stroke={T.inkSoft} />}
        />
        {error && (
          <div style={{ fontSize: 13, color: '#C53737', marginTop: 2 }}>{error}</div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <button onClick={handleLogin} disabled={loading} style={{
        height: 56, borderRadius: T.radiusPill, border: 'none',
        background: T.accent, color: T.accentInk,
        fontFamily: T.body,
        fontSize: 16, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Logowanie…' : 'Zaloguj się'}
        {!loading && <IconChevR size={18} stroke={T.accentInk} />}
      </button>
    </div>
  );
}
