# Database TLS verification strategy

> In the context of removing the hardcoded `rejectUnauthorized: false` on the Postgres pool (security finding #4), facing the fact that the managed-Postgres CA (Supabase) isn't in Node's default trust store, I decided to make TLS verification secure-by-default and driven by env (`DATABASE_CA_CERT` for the CA, `DB_SSL_INSECURE` as an explicit opt-out) to achieve real MITM protection without hardcoding a rotating cert, accepting that deployments must now supply one of those env vars or the connection fails verification.

## Context

`server/index.js` connected with `ssl: { rejectUnauthorized: false }`, disabling certificate verification entirely (MITM exposure on all DB traffic, including password hashes). Simply flipping to `rejectUnauthorized: true` would break the live deploy, because Supabase's CA isn't trusted by Node's default store — which is presumably why verification was disabled in the first place.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Hardcode `rejectUnauthorized: true` | Simplest; secure | Breaks immediately against Supabase (CA not system-trusted); no escape hatch |
| Bundle the Supabase CA `.crt` in the repo | Works out of the box | Cert rotation makes the repo stale; ties the app to one provider; cert-in-VCS smell |
| **Env-driven, secure-by-default** (`DATABASE_CA_CERT` + `DB_SSL_INSECURE` opt-out) | Secure default; provider-agnostic; CA supplied/rotated via env; deliberate, visible insecure opt-out | Deployments must set an env var (operational migration step) |
| `sslmode=verify-full` in the connection string | Standard libpq knob | Still needs the CA available to Node; less explicit than code + documented env |

## Decision

Chosen: **env-driven, secure-by-default**. `databaseSsl()` returns `{ rejectUnauthorized: true, ca }` when `DATABASE_CA_CERT` is set (normalising escaped `\n`), `{ rejectUnauthorized: false }` only when `DB_SSL_INSECURE=true` is explicitly set, and `{ rejectUnauthorized: true }` otherwise. Both vars are documented in `.env.example`.

## Consequences

- No code change needed when the CA rotates — update the env var.
- **Operational migration**: existing deploys relying on the implicit insecure setting must set `DATABASE_CA_CERT` (preferred) or `DB_SSL_INSECURE=true`, or the DB connection will fail verification. Called out in the PR and commit body.
- Insecure mode still exists but is now deliberate and greppable (`DB_SSL_INSECURE`), not the silent default.

## Artifacts

- Fork PR for #4 (Closes #4)
- `server/index.js` `databaseSsl()`, `.env.example`
