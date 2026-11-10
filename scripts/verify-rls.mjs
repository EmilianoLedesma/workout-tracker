// Run: node --env-file=.env scripts/verify-rls.mjs
// Checks that an unauthenticated client cannot read or write any user table.
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error(
    'FAIL: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set',
  )
  process.exit(1)
}

const TABLES = ['user_settings', 'routines', 'routine_exercises']
const headers = {
  apikey: key,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}
const ANON_USER = '00000000-0000-0000-0000-000000000000'

for (const table of TABLES) {
  const endpoint = `${url}/rest/v1/${table}`

  const select = await fetch(`${endpoint}?select=*`, { headers })
  if (select.status === 404) {
    console.error(`FAIL: ${table} not found, apply the migration first`)
    process.exit(1)
  }
  // A bad key, paused project or server error must not look like "RLS works".
  if (!select.ok) {
    console.error(`FAIL: ${table} read was rejected with HTTP ${select.status}`)
    process.exit(1)
  }
  const rows = await select.json()
  const insert = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: ANON_USER }),
  })

  const readBlocked = Array.isArray(rows) && rows.length === 0
  const writeBlocked = insert.status === 401 || insert.status === 403
  if (!(readBlocked && writeBlocked)) {
    console.error(
      `FAIL: ${table} readBlocked=${readBlocked} writeBlocked=${writeBlocked}`,
    )
    process.exit(1)
  }
  console.log(`PASS: ${table}: anonymous read empty, anonymous insert rejected`)
}

// The write functions must not be callable without signing in. Revoked execute
// shows up as 401/403 (or 404 when the API hides it); success or a server error
// would mean anonymous clients can reach them.
const FUNCTIONS = {
  save_routine: { p_id: null, p_name: 'x', p_day_label: null, p_items: [] },
  seed_starter_routines: { p_routines: [] },
}
for (const [name, args] of Object.entries(FUNCTIONS)) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
  })
  if (![401, 403, 404].includes(res.status)) {
    console.error(`FAIL: anonymous call to ${name} returned HTTP ${res.status}`)
    process.exit(1)
  }
  console.log(`PASS: ${name}: anonymous call rejected (HTTP ${res.status})`)
}
