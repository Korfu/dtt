import { useState } from 'react';
import { T } from '../themes';
import { DAY_NAMES_FULL, MONTH_NAMES, fmtRange } from '../data';
import { IconClose, IconCheck, IconRepeat, IconClock, IconTrash } from '../icons';

export function SlotSheet({ selection, user, viewerProfile, onClose, onConfirm, onCancel }) {
  const { date, hour, booking, spanLength } = selection;
  const isMine = booking && booking.user_id === user?.id;
  const isViewerAdmin = viewerProfile?.role === 'admin';
  const isPast = booking && (() => {
    const slotDate = new Date(booking.day_date + 'T' + String(hour).padStart(2,'0') + ':00:00');
    return slotDate < new Date();
  })();
  const profile = booking?.profiles || null;

  const [duration, setDuration] = useState(1);
  const [partner, setPartner] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const dayName = DAY_NAMES_FULL[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const monthName = MONTH_NAMES[date.getMonth()];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 0.18s ease-out',
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
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
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: T.border, margin: '0 auto 18px',
        }}/>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: T.inkSoft,
            }}>{dayName} · {date.getDate()} {monthName}</div>
            <div style={{
              fontFamily: T.display, fontSize: 32,
              fontWeight: 400, letterSpacing: '-0.02em', marginTop: 4,
            }}>{fmtRange(hour, booking ? spanLength : duration)}</div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${T.border}`, background: T.bgCard,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}><IconClose size={16} stroke={T.ink}/></button>
        </div>

        {!booking && (
          <BookingForm
            duration={duration} setDuration={setDuration}
            partner={partner} setPartner={setPartner}
            recurring={recurring} setRecurring={setRecurring}
            onConfirm={() => onConfirm({ date, hour, duration, partnerName: partner, isRecurring: recurring })}
          />
        )}
        {booking && isMine && !isPast && (
          <MyBookingDetail
            booking={booking} hour={hour} spanLength={spanLength}
            confirmCancel={confirmCancel} setConfirmCancel={setConfirmCancel}
            onCancel={() => onCancel(booking)}
          />
        )}
        {booking && !isMine && <OtherBookingDetail profile={profile} booking={booking} isViewerAdmin={isViewerAdmin} />}
        {booking && isPast && isMine && <PastBookingNote />}
      </div>
    </div>
  );
}

function BookingForm({ duration, setDuration, partner, setPartner, recurring, setRecurring, onConfirm }) {
  return (
    <div>
      <SectionLabel>Czas trwania</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        marginBottom: 22,
      }}>
        {[1, 1.5, 2].map(d => {
          const sel = duration === d;
          return (
            <button key={d} onClick={() => setDuration(d)} style={{
              padding: '14px 0', borderRadius: 14,
              border: `1px solid ${sel ? T.ink : T.border}`,
              background: sel ? T.ink : T.bgCard,
              color: sel ? T.bg : T.ink,
              cursor: 'pointer', fontFamily: T.body,
            }}>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{d}h</div>
              <div style={{
                fontFamily: T.mono, fontSize: 9,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                opacity: 0.6, marginTop: 3,
              }}>{d * 60} min</div>
            </button>
          );
        })}
      </div>

      <SectionLabel>
        Partner do gry{' '}
        <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0, fontFamily: T.body }}>
          (opcjonalnie)
        </span>
      </SectionLabel>
      <div style={{ marginBottom: 22 }}>
        <input
          value={partner} onChange={(e) => setPartner(e.target.value)}
          placeholder="np. Marek Nowak"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px 16px', borderRadius: 14,
            border: `1px solid ${T.border}`, background: T.bgCard,
            color: T.ink, fontFamily: T.body, fontSize: 15, outline: 'none',
          }}
        />
      </div>

      <div aria-disabled style={{
        width: '100%', padding: '14px 16px', borderRadius: 14,
        border: `1px solid ${T.border}`, background: T.bgCard,
        display: 'flex', alignItems: 'center', gap: 12,
        textAlign: 'left', marginBottom: 24,
        opacity: 0.5, cursor: 'not-allowed',
      }}>
        <IconRepeat size={18} stroke={T.inkMuted}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.inkSoft }}>Powtarzaj co tydzień</div>
          <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 2 }}>
            Tymczasowo niedostępne (sloty są czyszczone w niedzielę)
          </div>
        </div>
        <div style={{
          width: 44, height: 26, borderRadius: 100,
          background: T.border, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: 3,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}/>
        </div>
      </div>

      <button onClick={onConfirm} style={{
        width: '100%', height: 56, borderRadius: T.radiusPill, border: 'none',
        background: T.accent, color: T.accentInk,
        fontFamily: T.body, fontSize: 16, fontWeight: 500,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        <IconCheck size={18} stroke={T.accentInk}/>
        Potwierdź rezerwację
      </button>
    </div>
  );
}

function MyBookingDetail({ booking, hour, spanLength, confirmCancel, setConfirmCancel, onCancel }) {
  return (
    <div>
      <div style={{
        padding: '16px 18px', borderRadius: 16,
        background: T.mine, color: T.mineInk, marginBottom: 16,
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 9,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}>Twoja rezerwacja</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginTop: 6 }}>
          {booking.duration}h · {fmtRange(hour, booking.duration)}
        </div>
        {booking.partner_name && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            fontSize: 13, color: 'rgba(255,255,255,0.7)',
          }}>Partner: {booking.partner_name}</div>
        )}
      </div>

      <Row icon={<IconClock size={16} stroke={T.ink}/>} label="Cykliczna" value={booking.is_recurring ? 'Tak' : 'Nie'} />

      {!confirmCancel ? (
        <button onClick={() => setConfirmCancel(true)} style={{
          width: '100%', marginTop: 18,
          padding: '14px 16px', borderRadius: 14,
          background: T.bgCard, border: '1px solid rgba(180,40,40,0.25)',
          color: '#C53737',
          fontFamily: T.body, fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <IconTrash size={16} stroke="#C53737"/>
          Anuluj rezerwację
        </button>
      ) : (
        <div style={{
          marginTop: 18, padding: 16, borderRadius: 16,
          border: '1px solid rgba(180,40,40,0.25)',
          background: '#FBF3F3',
        }}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
            Anulować tę rezerwację?
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14 }}>
            Slot zostanie zwolniony i będzie dostępny dla innych członków klubu.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirmCancel(false)} style={{
              flex: 1, height: 44, borderRadius: 100,
              border: `1px solid ${T.border}`, background: T.bgCard, color: T.ink,
              fontFamily: T.body, fontSize: 14, cursor: 'pointer',
            }}>Wróć</button>
            <button onClick={onCancel} style={{
              flex: 1, height: 44, borderRadius: 100,
              border: 'none', background: '#C53737', color: '#fff',
              fontFamily: T.body, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>Tak, anuluj</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OtherBookingDetail({ profile, booking, isViewerAdmin }) {
  return (
    <div>
      <div style={{
        padding: 16, borderRadius: 16,
        background: T.bgCard, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: profile?.color || '#aaa', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.body, fontSize: 16, fontWeight: 500,
        }}>{profile?.initials || '?'}</div>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 9,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: T.inkSoft,
          }}>Zarezerwowane przez</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
            {isViewerAdmin ? profile?.name : (profile?.initials || 'Inny członek')}
          </div>
          {booking.partner_name && isViewerAdmin && (
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
              z {booking.partner_name}
            </div>
          )}
        </div>
      </div>
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: T.borderSoft,
        fontSize: 12, color: T.inkSoft,
        textAlign: 'center', lineHeight: 1.45,
      }}>
        Ten slot jest zajęty. Wybierz inny termin lub poczekaj na zwolnienie.
      </div>
    </div>
  );
}

function PastBookingNote() {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: T.borderSoft,
      fontSize: 13, color: T.inkSoft, textAlign: 'center',
    }}>Ta rezerwacja już się zakończyła.</div>
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

function Row({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderTop: `1px solid ${T.border}`,
    }}>
      {icon}
      <span style={{ flex: 1, fontSize: 14, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
