import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { toISODate } from '../data';

export function useBookings(weekStart) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = weekStart ? new Date(weekStart) : null;
  if (weekEnd) weekEnd.setDate(weekEnd.getDate() + 6);

  const fetch = useCallback(async () => {
    if (!weekStart) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(id, name, initials, color)')
      .gte('day_date', toISODate(weekStart))
      .lte('day_date', toISODate(weekEnd))
      .order('day_date')
      .order('hour');
    if (!error) setBookings(data || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetch]);

  async function addBooking({ date, hour, duration, partnerName, isRecurring, userId }) {
    const rows = [];
    const weeks = isRecurring ? 4 : 1;
    for (let w = 0; w < weeks; w++) {
      const d = new Date(date);
      d.setDate(d.getDate() + w * 7);
      const slots = duration <= 1 ? 1 : 2; // 1h = 1 slot; 1.5h or 2h = 2 slots
      for (let s = 0; s < slots; s++) {
        rows.push({
          user_id: userId,
          day_date: toISODate(d),
          hour: hour + s,
          duration: s === 0 ? duration : 1,
          partner_name: partnerName || null,
          is_recurring: isRecurring,
        });
      }
    }
    const { error } = await supabase.from('bookings').insert(rows);
    if (error) throw error;
    fetch();
  }

  async function cancelBooking(booking) {
    // Cancel all bookings by this user on this date that are part of the same block
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', booking.user_id)
      .eq('day_date', booking.day_date)
      .gte('hour', booking.hour)
      .lte('hour', booking.hour + 1);
    if (error) throw error;
    fetch();
  }

  return { bookings, loading, addBooking, cancelBooking, refetch: fetch };
}
