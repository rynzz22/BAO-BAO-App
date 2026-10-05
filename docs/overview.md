# BAO BAO - Product Overview

## Product Summary

**BAO BAO** connects passengers in Talibon with traditional tricycles, Bao Bao/e-tricycles, and other approved local vehicles. It reduces passenger waiting and driver empty-searching through ride requests, vehicle availability, demand visibility, and community-based dispatching.

**Core principle: inclusive technology.** Drivers participate through one of three channels — **App**, **SMS/Call**, or **Terminal Dispatcher**. The passenger always experiences one unified system.

## Tech Stack & Key Decisions

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | **React 18 + Vite + TypeScript** | PWA via `vite-plugin-pwa` |
| UI | Tailwind CSS + shadcn/ui | Mobile-first |
| State/Data | TanStack Query + Zustand | Server state vs. UI state |
| Maps | **Leaflet + OpenStreetMap** (or MapLibre GL) | Free, no billing; swap later if needed |
| Backend | **NestJS (TypeScript)** | Modular, DI, guards, pipes |
| ORM | **Prisma** (or TypeORM/Drizzle) | Prisma recommended for migrations + typing |
| Database | **PostgreSQL (Supabase)** + **PostGIS** | Geo queries for nearest drivers |
| Auth | **Supabase Auth** (JWT) | NestJS validates the JWT; roles in `profiles` |
| Realtime | **Supabase Realtime** + NestJS WebSocket gateway | See §8 |
| Queue/Jobs | **BullMQ + Redis** (Upstash) or `pg-boss` | Offer timeouts, retries, SMS sending |
| SMS | Local PH gateway (e.g. Semaphore) or Twilio | Pluggable `SmsProvider` interface |
| Validation | `class-validator` + `class-transformer` | Plus Zod on the frontend |
| Docs | `@nestjs/swagger` | OpenAPI at `/api/docs` |
| Hosting | Frontend: Vercel/Netlify/Cloudflare Pages · API: Railway/Render/Fly.io · DB: Supabase | |

### Key Decisions

1. **NestJS owns business logic.** The frontend never writes ride state directly to Supabase; all writes go through the API. Supabase is used for DB, Auth, Realtime (read/subscribe), and Storage.
2. **PostGIS for geo.** `geography(Point,4326)` columns with GiST indexes.
3. **State machine in the service layer**, not scattered across controllers.
4. **Channel adapter pattern** so adding a GPS tracker later is a new adapter, not a rewrite.
5. **Single PWA codebase, multiple role-based route trees** (passenger / driver / dispatcher / admin) to keep MVP small. Can split later.

## Risks & Open Questions

### Risks

| Risk | Mitigation |
|------|-----------|
| Low driver adoption | Three-channel design, pilot at a terminal, driver onboarding sessions in Bisaya |
| SMS cost / delivery delays | Short messages, budget cap, provider with PH coverage, dispatcher fallback |
| Weak mobile data in some areas | PWA, polling fallback, SMS as backup |
| Stale location misleading passengers | Strict `tracking_source` labels + auto-downgrade |
| Passenger no-shows / prank requests | Cooldowns, phone verification, rating/reports, admin tools |
| Dispatcher workload | Auto-dispatch first, console only for DISPATCHER-channel drivers + escalations |
| Data privacy | RLS, minimization, retention policy, consent |
| Fare disputes | MVP is **no payment**; show fare reference (LGU fare matrix) as info only |

### Open Questions (decide before Sprint 1)

1. Which SMS provider/sender ID will be used, and who pays for SMS?
2. Is there an official LGU fare matrix to display?
3. How many terminals/dispatchers are in the pilot, and do they have a device (phone/laptop) to run the console?
4. Do passengers log in with phone OTP or email? (Phone OTP recommended.)
5. Are passengers allowed to request without an account (walk-in via dispatcher only)?
6. Service-area boundary for Talibon (polygon) for geofencing.
7. Should driver phone numbers ever be visible to passengers (call button)?
8. Preferred ORM: Prisma vs. Drizzle vs. TypeORM.

## Testing, DevOps & Deployment

### Testing
- **Unit:** state machine transitions, dispatch scoring, SMS command parser (high coverage, these are the critical logic).
- **Integration:** Nest e2e with a test Postgres (Docker) — ride creation → dispatch → accept via each channel.
- **Concurrency test:** two drivers accept the same offer simultaneously → exactly one wins.
- **Frontend:** Vitest + React Testing Library; Playwright for core flows (request ride, accept, complete).
- **Load:** k6 on `/driver/location` and `/rides` (simulate 200 drivers, 50 concurrent requests).
- **Field test:** pilot with a small number of real drivers per channel before wider rollout.

### CI/CD
- GitHub Actions: lint → typecheck → test → build → deploy.
- Prisma migrations run on deploy; Supabase migrations for RLS/PostGIS stored in `supabase/migrations`.
- Environments: `local` · `staging` · `production`.

### Observability
- Structured logs (pino), request IDs, Sentry for FE+BE, uptime check on `/health`.
- Metrics: offer acceptance rate by channel, dispatch latency, SMS delivery rate, ride funnel conversion.

---

**BAO BAO — "Technology without requiring technological literacy."**
