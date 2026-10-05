# BAO BAO - API Plan

## API Overview

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <Supabase JWT>`
**Format:** JSON
**Pagination:** `?page=1&limit=20`
**Errors:** `{ statusCode, code, message, details? }`

Legend — Roles: **P** passenger · **D** driver · **X** dispatcher · **A** admin · **Pub** public · **Sys** webhook/system

## Auth & Profile

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| POST | `/auth/sync` | any authed | Create/sync `profiles` row after Supabase signup |
| GET | `/me` | any | Current profile + role |
| PATCH | `/me` | any | Update name, phone, language |
| DELETE | `/me` | any | Deactivate account |

## Passenger — Rides

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/vehicles/nearby?lat&lng&radius` | P | Nearby available vehicles with `tracking_source`, `location_updated_at` |
| GET | `/zones` | P, D, X | List pickup zones |
| POST | `/rides` | P | Create ride request |
| GET | `/rides/active` | P | Current active ride |
| GET | `/rides/:id` | P (own), D (assigned), X, A | Ride detail |
| GET | `/rides` | P | Ride history (own) |
| POST | `/rides/:id/cancel` | P, X, A | Cancel with reason |
| POST | `/rides/:id/retry` | P | Re-request after NO_DRIVER_FOUND |
| POST | `/rides/:id/rating` | P | Rate completed ride |
| POST | `/rides/:id/report` | P, D | Report incident |

### POST /rides body

```json
{
  "pickup": { "lat": 10.1503, "lng": 124.3305, "label": "School Gate 2", "zoneId": "uuid?" },
  "destination": { "lat": 10.1531, "lng": 124.3350, "label": "Poblacion" },
  "passengerCount": 2,
  "notes": "optional"
}
```

## Driver (App channel)

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| POST | `/drivers/register` | D | Submit driver profile + vehicle for approval |
| GET | `/driver/me` | D | Driver profile, vehicle, status |
| PATCH | `/driver/me/vehicle` | D | Update vehicle details |
| POST | `/driver/status` | D | `{ availability: "AVAILABLE" \| "OFFLINE" }` |
| POST | `/driver/location` | D | `{ lat, lng, accuracy, heading? }` (rate-limited 1/5 s) |
| GET | `/driver/offers` | D | Pending offers |
| POST | `/driver/offers/:id/accept` | D | Accept offer |
| POST | `/driver/offers/:id/decline` | D | Decline offer |
| POST | `/driver/rides/:id/en-route` | D | Heading to pickup |
| POST | `/driver/rides/:id/arrived` | D | Arrived at pickup |
| POST | `/driver/rides/:id/start` | D | Passenger boarded |
| POST | `/driver/rides/:id/complete` | D | Trip complete |
| GET | `/driver/rides` | D | Driver ride history |
| GET | `/driver/demand` | D *(P2)* | Demand hotspots |

## SMS Channel

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| POST | `/webhooks/sms/inbound` | Sys (signature-verified) | Receive driver SMS, parse commands |
| POST | `/webhooks/sms/status` | Sys | Delivery receipts |
| GET | `/admin/sms` | A | SMS log (debug/audit) |
| POST | `/admin/sms/test` | A | Send test SMS |

Inbound handler pipeline: **verify signature → normalize phone (+63) → find driver → parse command → call same services as the app endpoints → send confirmation SMS**.

## Dispatcher Console (Terminal channel)

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/dispatch/terminals` | X | Terminals I manage |
| GET | `/dispatch/rides?status=` | X | Pending/active rides for my terminal(s) |
| GET | `/dispatch/drivers?terminalId=` | X | Drivers in terminal queue / nearby with channel + status |
| POST | `/dispatch/queue/check-in` | X | `{ terminalId, driverId }` |
| POST | `/dispatch/queue/check-out` | X | `{ terminalId, driverId }` |
| POST | `/dispatch/rides/:id/assign` | X | `{ driverId }` — assign (acts as offer + acceptance after driver confirms) |
| POST | `/dispatch/rides/:id/driver-confirmed` | X | Mark driver verbally confirmed |
| POST | `/dispatch/rides/:id/driver-declined` | X | Driver declined → re-dispatch |
| POST | `/dispatch/rides/:id/status` | X | `{ status }` update on driver's behalf |
| POST | `/dispatch/drivers` | X, A | Create a no-phone / SMS-only driver record |
| POST | `/dispatch/drivers/:id/status` | X | Set availability on behalf |
| POST | `/dispatch/drivers/:id/location-zone` | X | Report driver's zone |
| POST | `/dispatch/rides` | X | **Walk-in / phone-call ride** created on behalf of a passenger |

## Admin

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/admin/dashboard` | A | KPIs: active vehicles/drivers, rides today, pending |
| GET | `/admin/drivers` | A | List/filter drivers |
| GET | `/admin/drivers/:id` | A | Detail |
| PATCH | `/admin/drivers/:id/approval` | A | Approve/reject/suspend |
| PATCH | `/admin/drivers/:id/channel` | A | Change primary channel |
| GET | `/admin/vehicles` | A | List vehicles |
| PATCH | `/admin/vehicles/:id/approval` | A | Approve/suspend |
| POST/PATCH/DELETE | `/admin/vehicle-types[/:id]` | A | Manage types |
| POST/PATCH/DELETE | `/admin/zones[/:id]` | A | Manage zones / pickup zones |
| POST/PATCH/DELETE | `/admin/terminals[/:id]` | A | Manage terminals |
| POST/DELETE | `/admin/terminals/:id/dispatchers` | A | Assign dispatchers |
| POST/PATCH/DELETE | `/admin/routes[/:id]` | A | Manage routes & stops |
| GET | `/admin/rides` | A | All rides w/ filters |
| GET | `/admin/rides/live` | A | Active rides (map) |
| PATCH | `/admin/rides/:id` | A | Force-cancel / reassign |
| GET | `/admin/reports` | A | Incident reports |
| PATCH | `/admin/reports/:id` | A | Update status |
| GET | `/admin/users` | A | Users list |
| PATCH | `/admin/users/:id` | A | Role / activate / deactivate |
| GET | `/admin/analytics/rides` | A | Rides over time, wait time, fulfillment |
| GET | `/admin/analytics/drivers` | A | Acceptance rate by channel |
| GET | `/admin/audit-logs` | A | Audit trail |

## Phase 2 — Smart Transportation

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/demand/map` | D, X, A | Waiting passengers per zone |
| GET | `/demand/forecast?zoneId&when` | D, X, A | Predicted demand level |
| GET | `/zones/:id/status` | P | Students mode: waiting count, vehicles, est. wait |
| POST | `/rides/shared/join` | P | Join a shared ride |
| GET | `/weather/current` | any | Weather summary |

## Phase 3–4 — Virtual Talibon & Community

| Method | Route | Roles | Description |
|--------|-------|-------|-------------|
| GET | `/places` · `/places/:id` | Pub | Businesses, schools, clinics, offices |
| POST/PATCH | `/businesses` | Business owner, A | Manage business profiles |
| POST | `/businesses/:id/reservations` | P | Reserve table |
| POST | `/deliveries` | P | Route-compatible delivery request |
| POST | `/community/reports` | P | File flood/hazard/etc. report (+ photo) |
| GET | `/community/reports` | Pub | Verified reports on map |
| PATCH | `/admin/community/reports/:id` | A | Verify/reject (awards points) |
| GET | `/points/me` | P | BAO Points balance + ledger |

## Standard Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `AUTH_UNAUTHORIZED` | 401 | Missing/invalid token |
| `AUTH_FORBIDDEN` | 403 | Role not allowed |
| `RIDE_ACTIVE_EXISTS` | 409 | Passenger already has an active ride |
| `RIDE_INVALID_TRANSITION` | 409 | State machine rejection |
| `OFFER_EXPIRED` | 410 | Offer no longer valid |
| `OFFER_ALREADY_TAKEN` | 409 | Another driver won the ride |
| `DRIVER_NOT_APPROVED` | 403 | Driver not approved |
| `OUT_OF_SERVICE_AREA` | 422 | Pickup outside Talibon coverage |
| `VALIDATION_FAILED` | 400 | DTO validation errors |
| `RATE_LIMITED` | 429 | Too many requests |

## Realtime API

### Channels & Topics

| Channel / Topic | Subscribers | Events |
|-----------------|-------------|--------|
| `ride:{rideId}` | Passenger, assigned driver, dispatcher | `ride.status_changed`, `ride.driver_assigned`, `ride.eta_updated` |
| `driver:{driverId}` | App driver | `offer.created`, `offer.cancelled`, `ride.updated` |
| `terminal:{terminalId}` | Dispatchers | `ride.pending`, `ride.updated`, `queue.updated`, `driver.status_changed` |
| `map:vehicles` | Passengers (nearby), Admin | `vehicle.moved` (throttled, bucketed) |
| `admin:live` | Admin | Ride and KPI updates |
| `zone:{zoneId}` *(P2)* | Drivers, Dispatchers | `demand.updated` |

### Implementation Notes

- NestJS publishes domain events → a `RealtimePublisher` service broadcasts using **Supabase Realtime Broadcast** (or a NestJS WS gateway with Socket.IO if finer control is required).
- Passenger map: don't stream every GPS ping. Broadcast vehicle positions every 5–10 s, **rounded/bucketed**, and only drivers within the viewport.
- Fallback: polling `GET /rides/:id` every 5 s if the socket drops (poor connectivity).
- Never expose driver phone numbers over realtime channels.

## Webhooks

### SMS Webhook

**Endpoint:** `POST /webhooks/sms/inbound`
**Authentication:** Signature verification + IP allowlist
**Payload:**
```json
{
  "phone_number": "+639123456789",
  "message": "1 184",
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "..."
}
```

**Webhook Status:** `POST /webhooks/sms/status`
Used for delivery receipts from SMS provider.

## Rate Limiting

- **Strict on:**
  - `/rides` - 10 requests per minute per passenger
  - `/driver/location` - 12 requests per minute (1 per 5s)
  - `/webhooks/sms` - 100 per minute per provider IP
- **Standard:** 100 requests per minute for authenticated endpoints
- **Public:** 20 requests per minute

## OpenAPI Documentation

- API documentation available at `/api/docs` (Swagger UI)
- OpenAPI spec export at `/api/docs-json`
- Frontend API client generated from OpenAPI spec using `openapi-typescript`

## Request/Response Examples

### Create Ride Request

**Request:**
```http
POST /api/v1/rides
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "pickup": {
    "lat": 10.1503,
    "lng": 124.3305,
    "label": "School Gate 2",
    "zoneId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "destination": {
    "lat": 10.1531,
    "lng": 124.3350,
    "label": "Poblacion"
  },
  "passengerCount": 2
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "publicCode": "184",
  "status": "REQUESTED",
  "passengerId": "550e8400-e29b-41d4-a716-446655440000",
  "pickup": {
    "point": {"lat": 10.1503, "lng": 124.3305},
    "label": "School Gate 2",
    "zoneId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "destination": {
    "point": {"lat": 10.1531, "lng": 124.3350},
    "label": "Poblacion"
  },
  "passengerCount": 2,
  "requestedAt": "2024-01-15T10:30:00Z",
  "expiresAt": "2024-01-15T10:40:00Z"
}
```

### Accept Offer

**Request:**
```http
POST /api/v1/driver/offers/550e8400-e29b-41d4-a716-446655440002/accept
Authorization: Bearer <jwt>
```

**Response (200):**
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440001",
  "driverId": "550e8400-e29b-41d4-a716-446655440003",
  "vehicleId": "550e8400-e29b-41d4-a716-446655440004",
  "status": "ACCEPTED",
  "acceptedAt": "2024-01-15T10:30:15Z"
}
```

### Nearby Vehicles

**Request:**
```http
GET /api/v1/vehicles/nearby?lat=10.1503&lng=124.3305&radius=2000
Authorization: Bearer <jwt>
```

**Response (200):**
```json
{
  "vehicles": [
    {
      "driverId": "550e8400-e29b-41d4-a716-446655440003",
      "driverCode": "017",
      "vehicleType": "TRICYCLE",
      "bodyNumber": "ABC-123",
      "capacity": 4,
      "location": {
        "point": {"lat": 10.1505, "lng": 124.3308},
        "trackingSource": "LIVE_APP",
        "updatedAt": "2024-01-15T10:29:58Z"
      }
    }
  ]
}
```

## API Versioning

- Current version: `/api/v1`
- Breaking changes will increment to `/api/v2`
- Deprecation notice sent 3 months before removal
- Maintain backward compatibility where possible

## API Security

- All endpoints (except public webhooks) require JWT authentication
- Role-based access control enforced at controller level
- Rate limiting per endpoint and per user
- Request validation using class-validator
- Sanitization of all inputs
- CORS configured for allowed origins only
- Helmet middleware for security headers
- Request size limits (max 1MB)
