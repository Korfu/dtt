// supabase/functions/admin-create-user/index.ts
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

  // Auth guard: verify caller is an admin
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

  // Create the auth user
  const { email, password, firstName, lastName, username, color } = await req.json()

  // Validate required fields
  for (const [field, value] of Object.entries({ email, password, firstName, lastName, username, color })) {
    if (typeof value !== 'string' || value.trim() === '') {
      return json({ error: `Missing or invalid field: ${field}` }, 400)
    }
  }
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400)

  const { data: { user: newUser }, error: authError } =
    await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
  if (authError) return json({ error: authError.message }, 400)

  // Insert profile — roll back the auth user if this fails
  const { error: profileError } = await adminClient.from('profiles').insert({
    id:         newUser!.id,
    first_name: firstName,
    last_name:  lastName,
    name:       `${firstName} ${lastName}`,
    username,
    initials:   `${firstName[0]}${lastName[0]}`.toUpperCase(),
    color,
    role:       'user',
  })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUser!.id)
    return json({ error: profileError.message }, 400)
  }

  return json({ id: newUser!.id })
})
