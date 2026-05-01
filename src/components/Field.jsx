import { useState } from 'react';
import { T } from '../themes';

export function Field({ label, value, onChange, icon, type = 'text' }) {
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
