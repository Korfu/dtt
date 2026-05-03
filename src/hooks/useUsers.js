// src/hooks/useUsers.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').order('name').then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  async function createUser({ email, password, firstName, lastName, username, color }) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, firstName, lastName, username, color },
    });
    if (error) throw error;
    setUsers(prev => [...prev, {
      id:         data.id,
      first_name: firstName,
      last_name:  lastName,
      name:       `${firstName} ${lastName}`,
      username,
      initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
      color,
      role:       'user',
    }]);
  }

  async function updateUser(id, { firstName, lastName, username, color }) {
    const updates = {
      first_name: firstName,
      last_name:  lastName,
      name:       `${firstName} ${lastName}`,
      username,
      initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
      color,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }

  async function updateUserPassword(id, newPassword) {
    const { error } = await supabase.functions.invoke('admin-update-user-password', {
      body: { userId: id, newPassword },
    });
    if (error) throw error;
  }

  async function deleteUser(id) {
    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: id },
    });
    if (error) throw error;
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  return { users, loading, createUser, updateUser, updateUserPassword, deleteUser };
}
