import { useState, useEffect } from 'react';
import { T } from './themes';
import { getWeekStart } from './data';
import { useAuth } from './hooks/useAuth';
import { useBookings } from './hooks/useBookings';
import { LoginScreen } from './screens/LoginScreen';
import { GridScreen } from './screens/GridScreen';
import { SlotSheet } from './screens/SlotSheet';
import { BookingsScreen } from './screens/BookingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Toast } from './components/Toast';

export default function App() {
  const { user, profile, login, logout, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('grid');
  const [selection, setSelection] = useState(null);
  const [weekStart, setWeekStart] = useState(getWeekStart);
  const [toast, setToast] = useState(null);

  const { bookings, addBooking, cancelBooking } = useBookings(user ? weekStart : null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleConfirm({ date, hour, duration, partnerName, isRecurring }) {
    try {
      await addBooking({ date, hour, duration, partnerName, isRecurring, userId: user.id });
      setSelection(null);
      setToast({ type: 'success', text: `Zarezerwowano ${duration}h${isRecurring ? ' (cykliczne)' : ''}` });
    } catch {
      setToast({ type: 'error', text: 'Nie udało się zarezerwować.' });
    }
  }

  async function handleCancel(booking) {
    try {
      await cancelBooking(booking);
      setSelection(null);
      setToast({ type: 'neutral', text: 'Rezerwacja anulowana' });
    } catch {
      setToast({ type: 'error', text: 'Nie udało się anulować.' });
    }
  }

  if (authLoading) {
    return (
      <div style={{
        width: '100%', minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.page,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `2px solid ${T.border}`,
          borderTopColor: T.accent,
          animation: 'spin 0.7s linear infinite',
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <LoginScreen onLogin={login} />
      </AppShell>
    );
  }

  let screen;
  if (tab === 'grid') {
    screen = (
      <GridScreen
        bookings={bookings} user={user} profile={profile}
        weekStart={weekStart} onWeekChange={setWeekStart}
        onSelect={setSelection} onTabChange={setTab}
      />
    );
  } else if (tab === 'bookings') {
    screen = (
      <BookingsScreen
        bookings={bookings} user={user} profile={profile}
        onTabChange={setTab} onSelect={setSelection}
      />
    );
  } else {
    screen = (
      <ProfileScreen
        user={user} profile={profile}
        onTabChange={setTab}
        onLogout={logout}
      />
    );
  }

  return (
    <AppShell>
      {screen}
      {selection && (
        <SlotSheet
          selection={selection} user={user}
          onClose={() => setSelection(null)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {toast && <Toast toast={toast} />}
    </AppShell>
  );
}

function AppShell({ children }) {
  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      display: 'flex', justifyContent: 'center',
      background: T.page,
    }}>
      <div style={{
        width: '100%', maxWidth: 430, minHeight: '100dvh',
        background: T.bg,
        position: 'relative', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}
