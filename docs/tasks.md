# BAO BAO - User Stories & Tasks

## Personas

| Persona | Description | Primary Channel |
|---------|-------------|-----------------|
| **Passenger** | Student, worker, senior, visitor | Web app (PWA) |
| **App Driver** | Smartphone-capable driver | Driver app (PWA) |
| **SMS Driver** | Basic phone user | SMS / call |
| **Terminal Driver** | No phone / older driver | Dispatcher at terminal |
| **Dispatcher** | Terminal/barangay staff who assigns rides | Dispatcher console |
| **Admin** | LGU / project administrator | Admin dashboard |

## User Stories (MVP)

### Passenger
- As a passenger, I can register/login (phone OTP or email).
- I can see my location and nearby vehicles with a freshness label.
- I can request a ride with pickup, destination, and passenger count.
- I can see request status and the assigned driver/vehicle info.
- I can cancel before pickup.
- I can view ride history and rate/report a ride.

### App Driver
- I can register, add my vehicle, and wait for admin approval.
- I can go online/offline and share GPS location.
- I can receive, accept or reject ride offers.
- I can update ride status (arrived, started, completed).

### SMS Driver
- I receive an SMS offer and reply `1` (accept) or `2` (decline).
- I can optionally reply `ARRIVED` / `DONE` to update status.
- I can text `ON` / `OFF` / `AT <zone>` to report availability and location.

### Terminal Driver / Dispatcher
- Dispatcher sees incoming requests and available drivers at their terminal.
- Dispatcher assigns a driver, confirms, and marks status on the driver's behalf.
- Dispatcher can check drivers in/out of the terminal queue.

### Admin
- Approve/suspend drivers and vehicles.
- Manage routes, terminals, pickup zones, dispatcher accounts.
- Monitor live rides and view basic analytics.

## Functional Requirements

| ID | Requirement | Phase |
|----|-------------|-------|
| FR-01 | User auth with roles (passenger, driver, dispatcher, admin) | 1 |
| FR-02 | Driver & vehicle registration with admin approval | 1 |
| FR-03 | Driver availability and location with `tracking_source` | 1 |
| FR-04 | Ride request creation with pickup/destination/pax | 1 |
| FR-05 | Dispatch engine: find eligible drivers, create offers, handle timeouts | 1 |
| FR-06 | Channel adapters: App push/realtime, SMS, Dispatcher console | 1 |
| FR-07 | Ride lifecycle state machine with audit history | 1 |
| FR-08 | Inbound SMS webhook parsing | 1 |
| FR-09 | Ratings and reports | 1 |
| FR-10 | Admin dashboard (drivers, vehicles, rides, basic stats) | 1 |
| FR-11 | Demand map and pickup zones | 2 |
| FR-12 | School rush mode and demand prediction | 2 |
| FR-13 | Shared rides, improved ETA | 2 |
| FR-14 | Business directory and Virtual Talibon map | 3 |
| FR-15 | Route-compatible delivery | 3 |
| FR-16 | Community reports and BAO Points | 4 |

## Phased Roadmap

### Phase 0 — Foundation (Week 1–2)
- Monorepo, CI, Supabase project, PostGIS, Prisma schema + migrations
- Auth sync, roles guard, Swagger, seed data (zones, terminals, vehicle types)
- Design tokens, base layouts, i18n scaffold

### Phase 1 — MVP (Week 3–10)

| Sprint | Deliverable |
|--------|-------------|
| S1 (W3–4) | Admin: drivers, vehicles, zones, terminals CRUD + approval flow |
| S2 (W5–6) | Passenger: map, nearby vehicles, create/cancel ride; ride state machine; history |
| S3 (W7–8) | Driver app: online/offline, GPS, offers accept/decline, ride status; Dispatch engine + offer timeouts + realtime |
| S4 (W9) | **SMS channel**: outbound offers, inbound webhook parser, status commands |
| S5 (W10) | **Dispatcher console**: board, queue, assign, walk-in rides; ratings/reports; basic analytics; hardening + pilot at one terminal |

**MVP exit criteria:** a passenger request can be fulfilled via each of the 3 channels end-to-end; honest tracking labels; admin can monitor everything.

### Phase 2 — Smart Transportation
Demand map · pickup zones for schools (Student Mode) · school rush alerts · rule-based demand prediction from `demand_snapshots` · shared rides · better ETA · weather · analytics.

### Phase 3 — Virtual Talibon
Interactive map · business/school/service directory · reservations · route-compatible delivery · community events.

### Phase 4 — Community Ecosystem
Community reports with photo upload (Supabase Storage) · flood/road alerts · BAO Points ledger · cleanup participation · transportation credits · advanced analytics.

### Future — Hardware
Dedicated GPS tracker → new `TRACKER` ingestion endpoint (`POST /tracker/ping`, device-token auth) + `GPS_TRACKER` source. No architecture change needed.

## Quick Start Checklist

- [ ] Create Supabase project → enable PostGIS
- [ ] Scaffold monorepo (`pnpm`, `apps/web`, `apps/api`, `packages/shared`)
- [ ] Prisma schema from §5 → first migration + seed zones/terminals/vehicle types
- [ ] Nest: `AuthModule`, `UsersModule`, Swagger, global validation + exception filter
- [ ] Implement `RideStateMachine` + tests **before** controllers
- [ ] Build `DriverChannel` interface + `AppChannel`, then `SmsChannel`, then `DispatcherChannel`
- [ ] Web: auth shell + role routing → passenger request flow → driver offers → dispatcher board → admin
- [ ] Pilot with 1 terminal; collect metrics; iterate
