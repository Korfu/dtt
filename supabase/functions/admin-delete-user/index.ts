// supabase/functions/admin-delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey     = Deno.env.get('SUPABASE_ANON_KEY')!

  const adminClient = createClient(supabaseUrl, serviceKey)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return json({ error: 'Unauthorized' }, 401)

  const { data: callerProfile } = await adminClient
    .from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  const { userId } = await req.json()

  if (typeof userId !== 'string' || userId.trim() === '') {
    return json({ error: 'Invalid userId' }, 400)
  }
  if (userId === caller.id) return json({ error: 'Cannot delete yourself' }, 400)

  // Refuse to delete other admins via this endpoint — admins are managed by script
  const { data: targetProfile } = await adminClient
    .from('profiles').select('role').eq('id', userId).single()
  if (targetProfile?.role === 'admin') return json({ error: 'Cannot delete admin users' }, 403)

  // Order matters: bookings first, then profile, then auth user
  const { error: bookingsError } = await adminClient
    .from('bookings').delete().eq('user_id', userId)
  if (bookingsError) return json({ error: bookingsError.message }, 400)

  const { error: profileError } = await adminClient
    .from('profiles').delete().eq('id', userId)
  if (profileError) return json({ error: profileError.message }, 400)

  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) return json({ error: authError.message }, 400)

  return json({ success: true })
})
