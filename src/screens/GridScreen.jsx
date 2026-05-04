import { useState } from 'react';
import { T } from '../themes';
import { BottomTab } from '../components/BottomTab';
import { IconPlus, IconRepeat, IconChevL, IconChevR } from '../icons';
import { HOURS, DAY_NAMES_SHORT, DAY_NAMES_FULL, MONTH_NAMES, getWeekDays, fmtHour, fmtRange, isToday } from '../data';

export function GridScreen({ bookings, user, profile, weekStart, onWeekChange, onSelect, onTabChange }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const days = getWeekDays(weekStart);
    const idx = days.findIndex(d => isToday(d));
    return idx >= 0 ? idx : 0;
  });

  const days = getWeekDays(weekStart);

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.ink, boxSizing: 'border-box', position: 'relative',
    }}>
      <Header profile={profile} weekStart={weekStart} onWeekChange={onWeekChange} onTabChange={onTabChange} />
      <DayStrip days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} bookings={bookings} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <WeeklyGrid bookings={bookings} day={days[selectedDay]} dayIdx={selectedDay} user={user} viewerProfile={profile} onSelect={onSelect} />
      </div>
      <BottomTab active="grid" onTabChange={onTabChange} />
    </div>
  );
}

function Header({ profile, weekStart, onWeekChange, onTabChange }) {
  const month = MONTH_NAMES[weekStart.getMonth()];
  const year = weekStart.getFullYear();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const endMonth = MONTH_NAMES[weekEnd.getMonth()];

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    onWeekChange(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    onWeekChange(d);
  }

  return (
    <div style={{
      padding: 'max(56px, calc(env(safe-area-inset-top) + 16px)) 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: T.mono,
          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: T.inkSoft,
        }}>Działdowskie Towarzystwo Tenisowe</div>
        <div style={{
          fontFamily: T.display, fontWeight: 400,
          fontSize: 26, letterSpacing: '-0.02em',
          color: T.ink, marginTop: 2,
        }}>
          Kort Centralny
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={prevWeek} style={{ ...navBtn }}>
          <IconChevL size={16} stroke={T.inkSoft} />
        </button>
        <button onClick={nextWeek} style={{ ...navBtn }}>
          <IconChevR size={16} stroke={T.inkSoft} />
        </button>
        <button onClick={() => onTabChange('profile')} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: profile?.color || T.accent, color: '#fff',
          border: 'none', cursor: 'pointer',
          fontFamily: T.body, fontSize: 13, fontWeight: 500,
        }}>{profile?.initials || '?'}</button>
      </div>
    </div>
  );
}

const navBtn = {
  width: 32, height: 32, borderRadius: '50%',
  border: `1px solid rgba(26,26,23,0.1)`,
  background: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
};

function DayStrip({ days, selectedDay, setSelectedDay, bookings }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '6px 16px 16px',
      overflowX: 'auto',
    }}>
      {days.map((date, idx) => {
        const sel = selectedDay === idx;
        const today = isToday(date);
        const dayBookings = bookings.filter(b => b.day_date === date.toISOString().slice(0, 10)).length;
        return (
          <button key={idx} onClick={() => setSelectedDay(idx)}
            style={{
              flex: 1, minWidth: 44,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 4px',
              border: 'none',
              borderRadius: 14,
              background: sel ? T.accent : 'transparent',
              color: sel ? T.accentInk : T.ink,
              cursor: 'pointer',
            }}>
            <span style={{
              fontFamily: T.mono,
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              opacity: sel ? 0.7 : 0.5,
            }}>{DAY_NAMES_SHORT[idx]}</span>
            <span style={{
              fontFamily: T.display,
              fontSize: 22, fontWeight: 400, marginTop: 2,
              fontStyle: today ? 'italic' : 'normal',
            }}>{date.getDate()}</span>
            {dayBookings > 0 && (
              <div style={{ marginTop: 4, display: 'flex', gap: 2 }}>
                {Array.from({ length: Math.min(dayBookings, 3) }).map((_, i) => (
                  <div key={i} style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: sel ? 'rgba(0,0,0,0.5)' : T.inkMuted,
                  }}/>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WeeklyGrid({ bookings, day, dayIdx, user, viewerProfile, onSelect }) {
  const dateStr = day.toISOString().slice(0, 10);
  const dayBookings = bookings.filter(b => b.day_date === dateStr);

  const slotMap = {};
  HOURS.forEach(h => {
    slotMap[h] = dayBookings.find(b => b.hour === h) || null;
  });

  const slots = HOURS.map((h, i) => {
    const b = slotMap[h];
    const prev = slotMap[h - 1];
    const isContinuation = b && prev && prev.user_id === b.user_id;
    const isStart = b && (!prev || prev.user_id !== b.user_id);
    const spanLength = (() => {
      if (!isStart) return 1;
      let n = 1;
      while (slotMap[h + n] && slotMap[h + n].user_id === b.user_id) n++;
      return n;
    })();
    return { h, b, isContinuation, isStart, spanLength, i };
  });

  const dayBookingCount = dayBookings.length;

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <div style={{
            fontFamily: T.display,
            fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em',
          }}>{DAY_NAMES_FULL[dayIdx]}</div>
          <div style={{
            fontFamily: T.mono,
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: T.inkSoft, marginTop: 2,
          }}>
            {day.getDate()} {MONTH_NAMES[day.getMonth()]} · {dayBookingCount}/15 zajęte
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr',
        background: T.bgCard,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}>
        {slots.map(({ h, b, isContinuation, isStart, spanLength, i }) => {
          if (isContinuation) return null;
          const profile = b?.profiles || null;
          return (
            <SlotRow
              key={h}
              h={h} b={b} spanLength={spanLength || 1} isFirst={i === 0}
              profile={profile} user={user} viewerProfile={viewerProfile}
              onClick={() => onSelect({ date: day, dateStr, hour: h, booking: b, spanLength: spanLength || 1 })}
            />
          );
        })}
      </div>

      <div style={{
        marginTop: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
        fontSize: 10, fontFamily: T.mono,
        color: T.inkSoft, letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        <LegendDot dot={T.bgCard} border={T.border} label="Wolne" />
        <LegendDot dot={T.mine} border={T.mine} label="Twoja" />
        <LegendDot dot={T.bg} border={T.border} label="Zajęte" />
      </div>
    </div>
  );
}

function LegendDot({ dot, border, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 12, height: 12, borderRadius: 3, background: dot, border: `1px solid ${border}`,
      }}/>
      <span>{label}</span>
    </div>
  );
}

function SlotRow({ h, b, spanLength, isFirst, profile, user, viewerProfile, onClick }) {
  const isMine = b && b.user_id === user?.id;
  const isViewerAdmin = viewerProfile?.role === 'admin';
  const isPast = b && (() => {
    const slotDate = new Date(b.day_date + 'T' + String(h).padStart(2,'0') + ':00:00');
    return slotDate < new Date();
  })();

  const baseHeight = T.hourHeight;
  const height = baseHeight * spanLength + (spanLength - 1);

  const borderTop = isFirst ? 'none' : `1px solid ${T.borderSoft}`;

  if (!b) {
    return (
      <>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: '0.05em',
          color: T.inkMuted,
          padding: '12px 0 0 12px',
          borderTop,
        }}>{fmtHour(h)}</div>
        <button onClick={onClick} style={{
          height: baseHeight, border: 'none', borderTop,
          background: T.bgCard,
          padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ fontFamily: T.body, fontSize: 14, color: T.inkMuted }}>Wolne</span>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: `1px dashed ${T.inkMuted}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconPlus size={14} stroke={T.inkMuted} />
          </div>
        </button>
      </>
    );
  }

  return (
    <>
      <div style={{
        fontFamily: T.mono, fontSize: 10, letterSpacing: '0.05em',
        color: T.inkMuted,
        padding: '12px 0 0 12px',
        gridRow: `span ${spanLength}`,
        borderTop,
      }}>{fmtHour(h)}</div>
      <button onClick={onClick} style={{
        height,
        border: 'none', borderTop,
        background: isMine ? T.mine : T.bg,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer', textAlign: 'left',
        position: 'relative',
        opacity: isPast ? 0.5 : 1,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isMine ? 'rgba(0,0,0,0.12)' : (profile?.color || '#aaa'),
          color: isMine ? T.mineInk : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.body, fontSize: 11, fontWeight: 500,
          border: isMine ? '1px solid rgba(0,0,0,0.15)' : 'none',
          flexShrink: 0,
        }}>{profile?.initials || '?'}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.body, fontSize: 14, fontWeight: 500,
            color: isMine ? T.mineInk : T.ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isMine
              ? 'Twoja rezerwacja'
              : (isViewerAdmin
                  ? (profile?.name?.split(' ')[0] + ' ' + (profile?.name?.split(' ')[1]?.[0] || '') + '.')
                  : 'Zajęte')}
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 10,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            color: isMine ? 'rgba(0,0,0,0.6)' : T.inkSoft,
            marginTop: 3,
          }}>
            {fmtRange(h, b.duration)}
            {b.partner_name && (isMine || isViewerAdmin) && ` · z ${b.partner_name}`}
          </div>
        </div>

        {spanLength > 1 && (
          <div style={{
            position: 'absolute', right: 12, top: 12,
            fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em',
            padding: '2px 6px', borderRadius: 4,
            background: isMine ? 'rgba(0,0,0,0.1)' : T.borderSoft,
            color: isMine ? 'rgba(0,0,0,0.7)' : T.inkSoft,
          }}>{b.duration}H</div>
        )}
      </button>
    </>
  );
}
