# Store the session JWT in an httpOnly cookie

> In the context of eliminating the XSS-token-theft vector (security finding #5), facing a session JWT kept in localStorage and sent via an Authorization header, I decided to move the token into an httpOnly + SameSite cookie set by the server (keeping the Bearer header as a fallback) to achieve a token that JavaScript can't read, accepting a new dependency on cross-origin cookie configuration (CORS credentials, an explicit FRONTEND_URL, and SameSite=None;Secure in production).

## Context

The 7-day session JWT lived in `localStorage` and was attached as `Authorization: Bearer` on every request (`frontend/lib/api.js`, `layout.js`, several pages). Any XSS anywhere in the app could read `localStorage` and exfiltrate the token (finding #5). The Google OAuth callback also delivered the token as a URL query parameter (history/Referer/proxy-log leak). The frontend and API are deployed on different origins.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **httpOnly cookie (chosen)** | JS can't read it → XSS can't steal it; browser sends it automatically; also fixes the OAuth-token-in-URL leak | Needs CORS credentials + explicit origin; cross-origin requires SameSite=None;Secure (HTTPS); introduces CSRF surface (mitigated by SameSite) |
| Keep localStorage + strict CSP | Small change; no auth rewrite | Token still readable by JS; CSP is defense-in-depth, not elimination; the audit listed this as the "accept the risk" fallback |
| In-memory token (JS variable) + silent refresh | Not in persistent storage | Lost on reload without a refresh-token flow; larger rebuild; refresh token then needs secure storage anyway |
| Web Worker / encrypted storage | Obscures the token | Still exfiltratable by capable XSS; complexity without a real boundary |

## Decision

Chosen: **httpOnly cookie**. The server sets the JWT as `httpOnly`, `SameSite` (`none` in production for the cross-origin frontend/API, `lax` in dev), `Secure` in production, on login / register / OAuth callback. `authenticateToken` reads the cookie first and falls back to the `Authorization` header (backward compatibility for non-browser clients). A `POST /api/auth/logout` clears the cookie. CORS allows credentials with `FRONTEND_URL` as the explicit origin. `cookie-parser` is added.

## Consequences

- The token is no longer reachable from JavaScript — the #5 XSS-theft vector is closed, and the OAuth-token-in-URL leak is closed as a side effect.
- **Deployment requirements**: `FRONTEND_URL` must be the exact frontend origin; `NODE_ENV=production` so the cookie is `Secure`+`SameSite=None`; frontend and API must both be HTTPS in production. Local dev needs same-origin (e.g. a Next.js proxy) or the Bearer fallback.
- **CSRF**: cookies are auto-sent, so a CSRF surface appears. `SameSite` mitigates it for the cross-site case; a dedicated CSRF token is a recommended follow-up if any state-changing route is ever made `SameSite=Lax`/same-site.
- New dependency: `cookie-parser`.
- Needs end-to-end local + staging verification (login, refresh, moderation, OAuth) before production — could not be exercised in the authoring environment.

## Artifacts

- Fork PR for #5 (Closes #5)
- `server/middleware/auth.js` (cookie helpers + cookie-or-header read), `server/index.js` (CORS + cookie-parser), `server/routes/auth.js`, `frontend/lib/api.js`, `frontend/app/*`
