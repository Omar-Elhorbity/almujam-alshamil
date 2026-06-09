# Use express-rate-limit for API rate limiting

> In the context of hardening the auth endpoints and the unauthenticated AI chat proxy (security finding #3), facing the need to throttle abusive request volume, I decided to use express-rate-limit with its default in-memory store to achieve a minimal, standard mitigation, accepting that the in-memory store is per-process and will need a shared store if the API is ever horizontally scaled.

## Context

The security audit (#3) found no rate limiting on `login`, `register`, `forgot-password`, `reset-password`, or the unauthenticated `/api/chat` (which proxies to a paid Groq LLM). These are exposed to brute force, credential stuffing, reset-token guessing, and cost-amplification abuse. The app is a single Express service deployed on Render in front of Supabase.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **express-rate-limit** | De-facto standard Express middleware; tiny API; zero-config in-memory store; actively maintained; 0 reported vulns | In-memory store is per-process — won't share counters across multiple instances |
| rate-limiter-flexible | Backend-agnostic (Redis/Mongo/Postgres); battle-tested at scale | Heavier API and setup; overkill for a single-instance app with no Redis yet |
| Hand-rolled in-memory limiter | No dependency | Reinventing a solved problem; easy to get window/cleanup logic wrong |
| Gateway/proxy-level (Render/Cloudflare) | No app code | Not available/configured here; less granular (can't key per-route with app semantics) |

## Decision

Chosen: **express-rate-limit**, because it is the smallest, most idiomatic way to add per-route throttling to this Express app today, and the default memory store is adequate while the service runs as a single instance. `authLimiter` (20 / 15 min / IP) is applied per-route to the sensitive auth POSTs (not `GET /me`), and `chatLimiter` (15 / min / IP) fronts `/api/chat`. `trust proxy` is set to 1 so limits key off the real client IP behind Render.

## Consequences

- One new runtime dependency (`express-rate-limit@^8.5.2`).
- Counters live in process memory: if the API is scaled to multiple instances/replicas, limits become per-instance and should move to a shared store (express-rate-limit supports a Redis store with no API change to the call sites).
- Limits are conservative defaults; tune from real traffic once observability exists.

## Artifacts

- Fork PR: `Omar-Elhorbity/almujam-alshamil#<this PR>` (Closes #3)
- `server/middleware/rateLimiter.js`
