# BAO BAO - Frontend Plan

## Frontend Architecture

### App Areas (single Vite app, role-based route trees)

```
/                       → landing / login
/app/*                  → Passenger
   /app/home            → map + nearby vehicles + request sheet
   /app/ride/:id        → live ride tracking
   /app/history
   /app/profile
/driver/*               → Driver PWA
   /driver/home         → online toggle, offers, demand
   /driver/ride/:id
   /driver/history
   /driver/register
/dispatch/*             → Dispatcher console
   /dispatch/board      → pending rides + available drivers
   /dispatch/queue      → terminal queue
   /dispatch/new-ride   → phone/walk-in ride
/admin/*                → Admin dashboard
   /admin/overview
   /admin/drivers · /vehicles · /zones · /terminals · /routes
   /admin/rides · /reports · /users · /analytics · /sms-log
```

### Frontend Stack Details

| Concern | Choice |
|---------|--------|
| Routing | React Router v6 (route guards by role) |
| Data fetching | TanStack Query (cache, retries, optimistic updates) |
| Client state | Zustand (session, UI) |
| Forms | React Hook Form + Zod |
| Realtime | `@supabase/supabase-js` channels |
| Maps | Leaflet/react-leaflet + OSM tiles |
| i18n | `react-i18next` (en, ceb) |
| PWA | `vite-plugin-pwa`, offline shell, install prompt |
| API client | Generated from OpenAPI (`openapi-typescript`) for type-safe calls |
| Styling | Tailwind + shadcn/ui |

## UX Principles

- **Three-tap ride request**: destination → confirm pickup → request.
- Show label chips: `LIVE` · `LAST REPORTED` · `TERMINAL` · `GPS`.
- Large touch targets and high contrast (outdoor, bright sun).
- Dispatcher console optimized for speed: keyboard shortcuts, sound alert on new request, big status colors.
- Driver app: single-screen, big Accept/Decline buttons, minimal text.

## Passenger PWA Features

### Home Screen
- Map view with current location
- Nearby vehicles displayed with tracking source labels
- Freshness indicator for each vehicle
- Request ride button/sheet

### Ride Request Flow
1. Select destination (or type custom)
2. Confirm pickup location (auto-detect from GPS)
3. Enter passenger count
4. Submit request

### Active Ride Tracking
- Real-time driver location updates
- Driver info (code, vehicle type, body number)
- ETA display
- Status updates (driver en route, arrived, etc.)
- Cancel button (before pickup)

### History & Profile
- Ride history list
- Rating for completed rides
- Report incident option
- Profile settings (name, phone, language)

## Driver PWA Features

### Registration
- Driver profile form
- Vehicle details (type, plate/body number, capacity)
- Photo upload (vehicle)
- Submit for approval

### Home Screen
- Online/Offline toggle
- Current status display
- Pending offers list with:
  - Pickup location
  - Destination
  - Passenger count
  - Estimated fare
  - Large Accept/Decline buttons
- Active ride info (if any)

### Ride Management
- Active ride screen with:
  - Passenger pickup location
  - Destination
  - Navigation to pickup
  - Status update buttons (En Route, Arrived, Start, Complete)
- Ride history

### Location Tracking
- Automatic GPS sharing when online
- Rate-limited location updates (1 per 5s)
- Visual indicator of location sharing status

## Dispatcher Console Features

### Dashboard Board
- List of pending rides for terminal(s)
- Each ride shows:
  - Pickup location
  - Destination
  - Passenger count
  - Time elapsed
- Available drivers list with:
  - Driver code
  - Channel (APP/SMS/DISPATCHER)
  - Status
  - Queue position (if terminal driver)

### Queue Management
- Terminal queue view
- Check-in / Check-out drivers
- Queue position display
- Driver status management

### Ride Assignment
- Assign driver to ride
- Driver confirmation workflow
- Manual status updates on driver's behalf
- Walk-in/phone-call ride creation

### Alerts & Notifications
- Sound alert on new ride request
- Visual indicators for urgent requests
- Keyboard shortcuts for common actions

## Admin Dashboard Features

### Overview
- KPI cards:
  - Active vehicles
  - Active drivers
  - Rides today
  - Pending approvals
- Live ride map
- Recent activity feed

### Drivers Management
- List view with filters (status, channel, approval)
- Driver detail view
- Approve/Reject/Suspend actions
- Channel preference change
- Vehicle assignment

### Vehicles Management
- Vehicle list
- Vehicle type management
- Approval workflow
- Active/inactive toggle

### Configuration
- Zones/Pickup points CRUD
- Terminals CRUD
- Routes & stops management
- Dispatcher assignments

### Monitoring
- All rides with filters
- Live rides map
- Incident reports
- SMS log (debug)
- Audit logs

### Analytics
- Rides over time
- Wait time metrics
- Fulfillment rate
- Driver acceptance rate by channel
- Demand patterns

## PWA Configuration

### Offline Support
- Service worker for offline shell
- Cache critical assets
- Offline indicator
- Queue actions for when online

### Installation
- Install prompt
- App manifest
- Custom splash screen
- Theme color

### Performance
- Code splitting by route
- Lazy loading for heavy components
- Image optimization
- Bundle size monitoring

## Realtime Integration

### Passenger Realtime
- Subscribe to `ride:{rideId}` for status updates
- Subscribe to `map:vehicles` for nearby vehicle updates (throttled)
- Fallback polling if connection drops

### Driver Realtime
- Subscribe to `driver:{driverId}` for offers
- Subscribe to `ride:{rideId}` for ride updates
- Push notifications for new offers

### Dispatcher Realtime
- Subscribe to `terminal:{terminalId}` for:
  - New pending rides
  - Queue updates
  - Driver status changes
- Sound alerts for new requests

### Admin Realtime
- Subscribe to `admin:live` for KPI updates
- Live ride map updates

## State Management

### Server State (TanStack Query)
- Ride requests
- Nearby vehicles
- Driver profile
- Ride history
- Admin data

### Client State (Zustand)
- User session
- UI state (modals, sheets)
- Map viewport
- Offline status
- PWA install prompt

## Localization

- English and Cebuano/Bisaya support
- Language switcher
- RTL support (if needed)
- Currency formatting
- Date/time formatting

## Testing Strategy

### Unit Tests
- Component tests with React Testing Library
- Custom hooks tests
- Utility function tests

### Integration Tests
- Playwright for core user flows:
  - Passenger request ride
  - Driver accept offer
  - Complete ride
  - Dispatcher assign ride

### E2E Tests
- Full user journeys across all roles
- Cross-channel dispatch scenarios
- Offline/online transitions

## Deployment

### Build Process
- Production build with Vite
- PWA assets generation
- OpenAPI client generation
- Bundle analysis

### Hosting
- Vercel/Netlify/Cloudflare Pages
- Environment variables
- CDN for static assets
- Automatic deployments on merge to main

### Performance Monitoring
- Core Web Vitals tracking
- Sentry for error tracking
- Analytics for usage patterns
