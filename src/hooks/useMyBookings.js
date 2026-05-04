import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useMyBookings(userId) {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('day_date')
      .order('hour');
    if (data) setMyBookings(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase
      .channel('my-bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${userId}` },
        fetch
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetch, userId]);

  return { myBookings, loading, refetch: fetch };
}
