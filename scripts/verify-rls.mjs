// Run: node --env-file=.env scripts/verify-rls.mjs
// Checks that an unauthenticated client cannot read or write user_settings.
const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error(
    'FAIL: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set',
  )
  process.exit(1)
}

const headers = {
  apikey: key,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}
const endpoint = `${url}/rest/v1/user_settings`

const select = await fetch(`${endpoint}?select=*`, { headers })
if (select.status === 404) {
  console.error('FAIL: user_settings not found, apply the migration first')
  process.exit(1)
}
const rows = select.ok ? await select.json() : null
const insert = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000' }),
})

const readBlocked = !select.ok || (Array.isArray(rows) && rows.length === 0)
const writeBlocked = !insert.ok

if (readBlocked && writeBlocked) {
  console.log('PASS: anonymous read returns no rows, anonymous insert rejected')
} else {
  console.error(`FAIL: readBlocked=${readBlocked} writeBlocked=${writeBlocked}`)
  process.exit(1)
}
