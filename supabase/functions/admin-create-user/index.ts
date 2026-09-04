import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: authData, error: authError } = await callerClient.auth.getUser()
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401)

    const { data: caller } = await callerClient.from('profiles').select('role').eq('id', authData.user.id).single()
    if (caller?.role !== 'admin') return json({ error: 'Admin access required' }, 403)

    const body = await req.json()
    const fullName = String(body.full_name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const role = body.role === 'admin' ? 'admin' : 'customer'
    if (!fullName || !email || password.length < 8) return json({ error: 'Name, email and password (8+ chars) are required' }, 400)

    const admin = createClient(url, serviceKey)
    let companyId: string | null = null
    if (role === 'customer') {
      companyId = body.company_id || null
      if (!companyId) {
        const companyName = String(body.company_name ?? '').trim()
        if (!companyName) return json({ error: 'A company is required for customer accounts' }, 400)
        const { data: company, error } = await admin.from('companies').insert({ name: companyName }).select().single()
        if (error) throw error
        companyId = company.id
      }
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    })
    if (createError || !created.user) throw createError ?? new Error('Could not create auth user')

    const { error: profileError } = await admin.from('profiles').insert({
      id: created.user.id, email, full_name: fullName, role, company_id: companyId,
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id)
      throw profileError
    }

    return json({ user: { id: created.user.id, email, full_name: fullName, role, company_id: companyId } })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
