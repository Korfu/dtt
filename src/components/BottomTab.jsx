import { T } from '../themes';
import { IconCalendar, IconList, IconUser } from '../icons';

const TABS = [
  { id: 'grid', label: 'Grafik', Icon: IconCalendar },
  { id: 'bookings', label: 'Moje', Icon: IconList },
  { id: 'profile', label: 'Profil', Icon: IconUser },
];

export function BottomTab({ active, onTabChange }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
      paddingTop: 6,
      background: `linear-gradient(to top, ${T.bg} 70%, ${T.bg}00)`,
    }}>
      <div style={{
        margin: '0 20px',
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 100,
        padding: 6,
        display: 'flex', gap: 4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}>
        {TABS.map(tab => {
          const sel = active === tab.id;
          return (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
              flex: 1, height: 44, borderRadius: 100,
              border: 'none',
              background: sel ? T.ink : 'transparent',
              color: sel ? T.bg : T.inkSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: 'pointer',
              fontFamily: T.body, fontSize: 13, fontWeight: 500,
            }}>
              <tab.Icon size={17} stroke={sel ? T.bg : T.inkSoft} />
              {sel && tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
