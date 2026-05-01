import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  const findProfile = (userId) => profiles.find(p => p.id === userId) || null;

  return { profiles, findProfile };
}
