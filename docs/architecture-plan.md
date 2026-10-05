# BAO BAO - Architecture Plan

## System Architecture Overview

### High-Level Architecture

The BAO BAO system follows a modular, microservice-inspired architecture built on NestJS, with clear separation of concerns and extensibility for future features.

### Core Architectural Principles

1. **Channel Adapter Pattern**: Multiple driver communication channels (App, SMS, Dispatcher) through a unified interface
2. **State Machine Pattern**: Centralized ride state management in the service layer
3. **Event-Driven**: Domain events trigger realtime broadcasts, notifications, and audit logging
4. **Service Layer Ownership**: All business logic resides in NestJS services, not in the frontend
5. **Geo-First Design**: PostGIS at the core for location-based queries and dispatch
6. **Inclusive by Design**: Architecture supports non-tech-savvy drivers through alternative channels

## Component Architecture

### Frontend Layer

**Single PWA with Role-Based Routes**
- React 18 + Vite + TypeScript
- Route guards enforce role-based access
- Shared components and utilities across all user types
- TanStack Query for server state management
- Zustand for client state
- Realtime subscriptions via Supabase channels

**Mobile-First Design**
- Touch-optimized UI with large targets
- High contrast for outdoor visibility
- Offline support via service worker
- Progressive enhancement for poor connectivity

### API Gateway Layer

**NestJS API Gateway**
- REST endpoints at `/api/v1`
- WebSocket gateway for realtime (optional fallback to Supabase)
- Global validation pipe with class-validator
- Global exception filter with standardized error responses
- Rate limiting via @nestjs/throttler
- CORS configuration
- Request logging and tracing

**Guards & Interceptors**
- SupabaseAuthGuard: JWT verification
- RolesGuard: Role-based authorization
- CurrentUser decorator: Inject authenticated user
- Logging interceptor: Request/response logging
- Transform interceptor: Response formatting

### Service Layer

**Domain Services**
- RideService: Ride CRUD and state transitions
- DispatchService: Driver selection and offer management
- LocationService: Location ingestion and freshness tracking
- ChannelService: Unified interface for driver communication
- NotificationService: Multi-channel notification delivery
- RatingService: Ride ratings and reports
- AdminService: Aggregations and analytics

**Business Logic Encapsulation**
- All write operations go through services
- Services emit domain events on state changes
- Services coordinate with other services via events
- No direct database access from controllers

### Data Layer

**ORM & Database**
- Prisma ORM for type-safe database access
- PostgreSQL with PostGIS extension
- Connection pooling for performance
- Migration management via Prisma
- Seed data for zones, terminals, vehicle types

**Repository Pattern**
- Repositories abstract Prisma operations
- Domain-specific query methods
- Transaction support for complex operations
- Caching layer (optional) for frequently accessed data

### Realtime Layer

**Supabase Realtime**
- Topic-based subscriptions
- Broadcast for ride updates
- Channel-based filtering
- Fallback to polling if needed

**NestJS WebSocket Gateway (Optional)**
- Socket.IO integration
- Room-based subscriptions
- Event broadcasting
- Connection management

### Job/Queue Layer

**BullMQ + Redis**
- Offer timeout jobs
- SMS sending queue
- Location cleanup jobs
- Retry logic with exponential backoff
- Job prioritization

**Scheduled Jobs**
- Location freshness downgrade (every 30s)
- Driver offline detection (configurable)
- Location history cleanup (daily)
- Demand snapshots (every 5 min - Phase 2)

### Integration Layer

**SMS Provider**
- Pluggable SmsProvider interface
- Semaphore, Twilio, or local provider
- Outbound queue for rate limiting
- Inbound webhook parsing
- Delivery receipt handling

**Supabase Integration**
- Auth: JWT verification
- Database: Service role access
- Realtime: Broadcast API
- Storage: File uploads (Phase 4)

## Module Architecture

### Core Modules

**AuthModule**
- JWT verification with Supabase
- Profile synchronization
- Role-based access control
- Current user injection

**UsersModule**
- Profile CRUD
- Role management
- Phone/email verification
- Account activation/deactivation

**DriversModule**
- Driver profile management
- Approval workflow
- Channel preference
- Availability status

**VehiclesModule**
- Vehicle CRUD
- Vehicle type management
- Driver-vehicle assignment
- Approval workflow

**TerminalsModule**
- Terminal CRUD
- Zone association
- Dispatcher membership
- Queue management

**ZonesModule**
- Pickup zone CRUD
- Zone boundaries (polygons)
- Route-stop association
- Area definitions

### Domain Modules

**RidesModule**
- Ride request CRUD
- State machine enforcement
- Ride history tracking
- Passenger constraints

**DispatchModule**
- Driver eligibility filtering
- Distance-based search
- Candidate scoring
- Offer management
- Timeout handling
- Fallback to dispatcher

**ChannelsModule**
- AppChannel: Realtime push
- SmsChannel: SMS delivery
- DispatcherChannel: Console display
- TrackerChannel: Future GPS tracker

**SmsModule**
- Provider abstraction
- Outbound queue
- Inbound webhook
- Command parsing
- Delivery tracking

**LocationModule**
- GPS ingestion
- Location freshness calculation
- Nearby vehicle search
- Location history
- Stale location downgrade

**RealtimeModule**
- Event publishing
- Topic-based broadcasting
- Subscription management
- Throttling for map updates

**RatingsModule**
- Ride ratings
- Driver statistics
- Passenger feedback

**ReportsModule**
- Incident reports
- Report workflow
- Evidence handling

**AdminModule**
- Dashboard aggregations
- Analytics queries
- Audit log access
- System monitoring

### Future Modules

**DemandModule (Phase 2)**
- Demand snapshots
- Hotspot detection
- Rule-based prediction
- Forecast API

**CommunityModule (Phase 3-4)**
- Business directory
- Community reports
- BAO Points ledger
- Delivery integration

## Data Flow Architecture

### Ride Request Flow

```
Passenger PWA
    ↓ POST /rides
API Gateway (Validation, Auth)
    ↓
RidesController
    ↓
RideService.create()
    ↓
- Validate passenger constraints
- Create ride record (REQUESTED)
- Emit RIDE_CREATED event
    ↓
DispatchService.dispatch()
    ↓
- Query eligible drivers (PostGIS)
- Rank candidates
- Create offer (OFFERED)
- Schedule timeout job
- Emit OFFER_CREATED event
    ↓
ChannelService.sendOffer()
    ↓
- AppChannel: Realtime push
- SmsChannel: SMS via queue
- DispatcherChannel: Console broadcast
    ↓
Response to passenger
```

### Accept Offer Flow

```
Driver/Dispatcher
    ↓ POST /offers/:id/accept
API Gateway (Validation, Auth)
    ↓
OffersController
    ↓
DispatchService.acceptOffer()
    ↓
- SELECT FOR UPDATE on ride
- Validate offer still pending
- Transition ride to ACCEPTED
- Assign driver and vehicle
- Emit RIDE_ACCEPTED event
    ↓
ChannelService.sendRideUpdate()
    ↓
- Notify passenger (realtime)
- Notify other dispatchers
- Update map data
    ↓
Response to acceptor
```

### Location Update Flow

```
Driver PWA
    ↓ POST /driver/location (rate-limited)
API Gateway (Validation, Auth)
    ↓
LocationService.updateLocation()
    ↓
- Update driver_locations table
- Set tracking_source = LIVE_APP
- Emit LOCATION_UPDATED event
    ↓
RealtimeService.broadcast()
    ↓
- Throttled map updates
- Zone-based distribution
    ↓
Response to driver
```

## Security Architecture

### Authentication Flow

```
Client
    ↓ Supabase Auth (phone OTP / email)
Supabase JWT
    ↓ Authorization: Bearer <token>
API Gateway
    ↓ SupabaseAuthGuard
    ↓ Verify JWT (JWKS or secret)
    ↓ Extract user ID
    ↓
RolesGuard
    ↓ Query profile role
    ↓ Check role permission
    ↓
Controller (req.user attached)
```

### Authorization Model

**Role-Based Access Control (RBAC)**
- Roles: PASSENGER, DRIVER, DISPATCHER, ADMIN
- Role-based route guards
- Endpoint-level role requirements
- Service-level role checks for operations

**Resource-Based Access Control**
- Passengers access only their own rides
- Drivers access only their assigned rides
- Dispatchers access only their terminal's data
- Admins have full access

**Row-Level Security (RLS)**
- Supabase RLS policies on all tables
- Service role bypasses RLS
- Client subscriptions respect RLS
- Defense in depth with application-level checks

### Data Protection

**PII Minimization**
- Driver phone numbers never exposed to passengers
- Location history retention policy (30 days)
- Audit trail for data access
- Data deletion on account deactivation

**Input Validation**
- DTO validation on all endpoints
- Whitelist mode enabled
- SQL injection prevention via ORM
- XSS prevention via sanitization

**Rate Limiting**
- Per-endpoint rate limits
- Per-user rate limits
- IP-based limits for public endpoints
- DDoS protection

## Scalability Architecture

### Horizontal Scaling

**API Layer**
- Stateless NestJS services
- Multiple instances behind load balancer
- Shared Redis for job queue
- Shared PostgreSQL database

**Database**
- Connection pooling
- Read replicas for analytics (Phase 2+)
- Index optimization for geo queries
- Query performance monitoring

**Realtime**
- Supabase handles scaling
- Fallback to polling if needed
- Throttled map updates to reduce load

### Performance Optimization

**Caching Strategy**
- In-memory cache for frequently accessed data
- Redis for session data
- CDN for static assets
- Browser caching for PWA

**Query Optimization**
- PostGIS GiST indexes on spatial columns
- Partial indexes for status filtering
- Query result pagination
- N+1 query prevention via Prisma includes

**Bundle Optimization**
- Code splitting by route
- Lazy loading for heavy components
- Tree shaking for unused code
- Bundle size monitoring

## Reliability Architecture

### Error Handling

**Global Exception Filter**
- Standardized error responses
- Error codes for client handling
- Logging of all errors
- Sentry integration for crash reporting

**Graceful Degradation**
- Fallback to polling if realtime fails
- SMS backup for app notifications
- Offline mode for PWA
- Read-only mode during maintenance

### Data Integrity

**Transaction Management**
- Critical operations in transactions
- Row locking for concurrent updates
- Optimistic concurrency control
- Rollback on errors

**Audit Trail**
- All state changes logged
- Actor identification (user or system)
- Channel tracking
- Immutable history tables

### Backup & Recovery

**Database Backups**
- Daily automated backups
- Point-in-time recovery
- Backup verification
- Disaster recovery plan

**Job Persistence**
- BullMQ with Redis persistence
- Job retry logic
- Dead letter queue for failed jobs
- Job monitoring dashboard

## Monitoring & Observability

### Logging

**Structured Logging**
- Pino for structured logs
- Request ID tracing
- Log levels (debug, info, warn, error)
- Sensitive data redaction

**Log Aggregation**
- Centralized log collection
- Log retention policy
- Search and filtering
- Alert on error patterns

### Metrics

**Business Metrics**
- Ride request rate
- Offer acceptance rate
- Dispatch latency
- Driver active count
- Passenger wait time

**Technical Metrics**
- API response times
- Database query times
- Job queue depth
- Error rates
- CPU/memory usage

### Tracing

**Distributed Tracing**
- Request ID propagation
- Service call tracking
- Performance bottleneck identification
- Cross-service transaction tracking

### Health Checks

**Endpoint Health**
- `/health` endpoint
- Database connectivity check
- Redis connectivity check
- SMS provider health check
- External dependency health

## Deployment Architecture

### Environment Strategy

**Environments**
- Local: Development with Docker Compose
- Staging: Pre-production testing
- Production: Live system

**Configuration Management**
- Environment variables
- Secret management (GitHub Secrets / HashiCorp Vault)
- Config validation on startup
- Feature flags for phased rollout

### CI/CD Pipeline

**Build Pipeline**
- Lint (ESLint, Prettier)
- Type check (TypeScript)
- Unit tests (Jest)
- Integration tests (Nest e2e)
- Build (Vite, NestJS)
- Deploy

**Deployment Strategy**
- Blue-green deployment
- Database migrations before app deploy
- Rollback capability
- Smoke tests after deploy

### Infrastructure

**Hosting**
- Frontend: Vercel/Netlify/Cloudflare Pages
- API: Railway/Render/Fly.io
- Database: Supabase
- Queue: Redis (Upstash or self-hosted)
- SMS: Local PH gateway or Twilio

**Infrastructure as Code**
- Terraform for infrastructure (optional)
- Docker for containerization
- Kubernetes for orchestration (Phase 2+)
