import { T } from '../themes';
import { BottomTab } from '../components/BottomTab';
import { IconChevR, IconCheck } from '../icons';
import { DAY_NAMES_SHORT, MONTH_NAMES, fmtRange } from '../data';

export function BookingsScreen({ bookings, user, profile, onTabChange, onSelect }) {
  const now = new Date();
  const myUpcoming = bookings
    .filter(b => {
      if (b.user_id !== user?.id) return false;
      const slotDate = new Date(b.day_date + 'T' + String(b.hour).padStart(2,'0') + ':00:00');
      return slotDate >= now;
    })
    .sort((a, b) => a.day_date.localeCompare(b.day_date) || a.hour - b.hour);

  // Group consecutive slots by same user/date into booking blocks
  const grouped = [];
  myUpcoming.forEach(b => {
    const last = grouped[grouped.length - 1];
    if (last && last.day_date === b.day_date && last.lastHour + 1 === b.hour) {
      last.lastHour = b.hour;
      last.spanLength += 1;
      last.duration = parseFloat(last.duration) + parseFloat(b.duration);
    } else {
      grouped.push({ ...b, lastHour: b.hour, spanLength: 1 });
    }
  });

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.ink, boxSizing: 'border-box', position: 'relative',
    }}>
      <div style={{
        padding: 'max(56px, calc(env(safe-area-inset-top) + 16px)) 20px 4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: T.inkSoft,
          }}>Moje rezerwacje</div>
          <div style={{
            fontFamily: T.display, fontSize: 28, marginTop: 2,
            letterSpacing: '-0.02em',
          }}>{profile?.name?.split(' ')[0] || 'Profil'}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: profile?.color || T.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 500,
        }}>{profile?.initials || '?'}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 100px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          marginBottom: 26,
        }}>
          <Stat value={grouped.length} label="Nadchodzące" />
          <Stat value={Math.round(grouped.reduce((s, b) => s + Number(b.duration), 0) * 10) / 10 + 'h'} label="Łącznie" />
          <Stat value={grouped.filter(b => b.partner_name).length} label="Z partnerem" />
        </div>

        <SundayLotteryCard />

        <SectionHead title="Nadchodzące" count={grouped.length} />
        {grouped.length === 0 && (
          <div style={{
            padding: '32px 20px', borderRadius: 16,
            background: T.bgCard, border: `1px dashed ${T.border}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, color: T.inkSoft }}>Brak rezerwacji.</div>
            <button onClick={() => onTabChange('grid')} style={{
              marginTop: 12, padding: '10px 18px', borderRadius: 100,
              background: T.accent, color: T.accentInk, border: 'none',
              fontSize: 13, cursor: 'pointer', fontFamily: T.body,
            }}>Zarezerwuj kort</button>
          </div>
        )}
        {grouped.map((b, i) => (
          <UpcomingCard key={i} booking={b}
            onClick={() => onSelect({ date: new Date(b.day_date), dateStr: b.day_date, hour: b.hour, booking: b, spanLength: b.spanLength })}
          />
        ))}
      </div>

      <BottomTab active="bookings" onTabChange={onTabChange} />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={{
      padding: '14px 12px', borderRadius: 14,
      background: T.bgCard, border: `1px solid ${T.border}`,
    }}>
      <div style={{
        fontFamily: T.display, fontSize: 26,
        fontWeight: 400, letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{
        fontFamily: T.mono, fontSize: 9,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: T.inkSoft, marginTop: 2,
      }}>{label}</div>
    </div>
  );
}

function SundayLotteryCard() {
  return (
    <div style={{
      padding: 18, borderRadius: 18, marginBottom: 24,
      background: T.accent, color: T.accentInk,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -30, top: -30,
        width: 140, height: 140, borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
      }}/>
      <div style={{
        fontFamily: T.mono, fontSize: 9,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.55)',
      }}>Niedzielny zapis</div>
      <div style={{
        fontFamily: T.display, fontSize: 22,
        fontWeight: 400, letterSpacing: '-0.02em', marginTop: 6,
        maxWidth: 260,
      }}>Każdy członek może zarezerwować{' '}
        <span style={{ fontStyle: 'italic' }}>2 godziny</span>{' '}
        na 2 najbliższe tygodnie.
      </div>
      <div style={{
        marginTop: 12, fontSize: 12,
        color: 'rgba(0,0,0,0.65)', lineHeight: 1.45,
      }}>
        Otwarcie: niedziela 18:00 · Po niedzieli wolne sloty można rezerwować bez limitu.
      </div>
    </div>
  );
}

function SectionHead({ title, count, top = 0 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 8,
      marginTop: top, marginBottom: 12,
    }}>
      <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 400 }}>{title}</div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted }}>{count}</div>
    </div>
  );
}

function UpcomingCard({ booking, onClick }) {
  const date = new Date(booking.day_date);
  const dayShort = DAY_NAMES_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1];
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 16, marginBottom: 8,
      borderRadius: 16, border: `1px solid ${T.border}`,
      background: T.bgCard, color: T.ink,
      cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: T.accent, color: T.accentInk,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 9,
          letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7,
        }}>{dayShort}</div>
        <div style={{ fontFamily: T.display, fontSize: 22, marginTop: -2 }}>{date.getDate()}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          {fmtRange(booking.hour, booking.duration)}
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10,
          letterSpacing: '0.05em', color: T.inkSoft,
          textTransform: 'uppercase', marginTop: 4,
        }}>
          {booking.duration}H · {booking.partner_name ? `Z ${booking.partner_name.split(' ')[0].toUpperCase()}` : 'SOLO'}
        </div>
      </div>
      <IconChevR size={18} stroke={T.inkMuted}/>
    </button>
  );
}
