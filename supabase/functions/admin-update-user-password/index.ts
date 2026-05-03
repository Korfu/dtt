// supabase/functions/admin-update-user-password/index.ts
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

  const { userId, newPassword } = await req.json()

  if (typeof userId !== 'string' || userId.trim() === '') {
    return json({ error: 'Invalid userId' }, 400)
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return json({ error: 'Password must be at least 6 characters' }, 400)
  }

  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return json({ error: error.message }, 400)

  return json({ success: true })
})
