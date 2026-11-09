# Supabase

SQL migrations live in `supabase/migrations/`, numbered in order.

## Apply

- Supabase dashboard: SQL Editor, paste the file, run. Or
- Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`. Or
- the Supabase MCP server (see `.mcp.json`), which can apply migrations directly.

## Rules

- Every table must enable Row Level Security and have policies scoped to `auth.uid()`.
  The publishable key ships to every browser, so RLS is the only protection for your data.
- Never put the service-role / secret key in this repo or in any `VITE_` variable.

## Verify RLS

```
node --env-file=.env scripts/verify-rls.mjs
```

It calls the REST API without a session and expects no rows back and a rejected insert.
