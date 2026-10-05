-- Migration: 0001_init.sql
-- Enables PostGIS and pgcrypto, sets up enums, MVP tables, geography columns, and indexes.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE user_role AS ENUM ('PASSENGER', 'DRIVER', 'DISPATCHER', 'ADMIN');
CREATE TYPE driver_channel AS ENUM ('APP', 'SMS', 'DISPATCHER');
CREATE TYPE tracking_source AS ENUM ('LIVE_APP', 'LAST_REPORTED', 'TERMINAL', 'GPS_TRACKER', 'UNKNOWN');
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
CREATE TYPE driver_availability AS ENUM ('OFFLINE', 'AVAILABLE', 'BUSY');
CREATE TYPE ride_status AS ENUM (
  'REQUESTED', 'DISPATCHING', 'OFFERED', 'ACCEPTED', 'DRIVER_EN_ROUTE',
  'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_DRIVER_FOUND'
);
CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');
CREATE TYPE actor_type AS ENUM ('PASSENGER', 'DRIVER', 'DISPATCHER', 'ADMIN', 'SYSTEM', 'SMS');
CREATE TYPE zone_type AS ENUM ('PICKUP', 'TERMINAL', 'AREA');
CREATE TYPE sms_direction AS ENUM ('OUT', 'IN');
CREATE TYPE sms_status AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'RECEIVED');
CREATE TYPE incident_status AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED');

-- 1. Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone_number TEXT UNIQUE,
  email TEXT,
  role user_role NOT NULL DEFAULT 'PASSENGER',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vehicle Types
CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- TRICYCLE, BAO_BAO, OTHER
  name TEXT NOT NULL,
  default_capacity INT NOT NULL DEFAULT 3
);

-- 3. Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(id) ON DELETE RESTRICT,
  plate_or_body_no TEXT UNIQUE NOT NULL,
  capacity INT NOT NULL DEFAULT 3,
  approval_status approval_status NOT NULL DEFAULT 'PENDING',
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Zones
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- SCHOOL, MARKET, POBLACION
  name TEXT NOT NULL,
  zone_type zone_type NOT NULL DEFAULT 'PICKUP',
  center geography(Point, 4326) NOT NULL,
  boundary geography(Polygon, 4326),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Terminals
CREATE TABLE terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  point geography(Point, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Terminal Dispatchers
CREATE TABLE terminal_dispatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(terminal_id, profile_id)
);

-- 7. Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  license_no TEXT NOT NULL,
  primary_channel driver_channel NOT NULL DEFAULT 'APP',
  approval_status approval_status NOT NULL DEFAULT 'PENDING',
  availability driver_availability NOT NULL DEFAULT 'OFFLINE',
  driver_code TEXT UNIQUE NOT NULL, -- e.g. 017
  home_terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Driver Vehicles
CREATE TABLE driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Driver Locations
CREATE TABLE driver_locations (
  driver_id UUID PRIMARY KEY REFERENCES drivers(id) ON DELETE CASCADE,
  point geography(Point, 4326) NOT NULL,
  tracking_source tracking_source NOT NULL DEFAULT 'UNKNOWN',
  last_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Driver Location History
CREATE TABLE driver_location_history (
  id BIGSERIAL PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  point geography(Point, 4326) NOT NULL,
  tracking_source tracking_source NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Terminal Queue
CREATE TABLE terminal_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id UUID NOT NULL REFERENCES terminals(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  position INT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMPTZ
);

-- 12. Routes
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Route Stops
CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  UNIQUE(route_id, stop_order)
);

-- 14. Ride Requests
CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code TEXT UNIQUE NOT NULL, -- e.g. 184
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  passenger_count INT NOT NULL DEFAULT 1,
  pickup_point geography(Point, 4326) NOT NULL,
  pickup_label TEXT NOT NULL,
  pickup_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  destination_point geography(Point, 4326) NOT NULL,
  destination_label TEXT NOT NULL,
  status ride_status NOT NULL DEFAULT 'REQUESTED',
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  channel_used TEXT,
  eta_minutes INT,
  cancel_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 15. Ride Offers
CREATE TABLE ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  channel driver_channel NOT NULL,
  status offer_status NOT NULL DEFAULT 'PENDING',
  sequence INT NOT NULL DEFAULT 1,
  offered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 16. Ride Status History
CREATE TABLE ride_status_history (
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  from_status ride_status,
  to_status ride_status NOT NULL,
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_type actor_type NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. SMS Messages
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction sms_direction NOT NULL,
  phone_number TEXT NOT NULL,
  body TEXT NOT NULL,
  ride_offer_id UUID REFERENCES ride_offers(id) ON DELETE SET NULL,
  status sms_status NOT NULL DEFAULT 'QUEUED',
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID UNIQUE NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Incident Reports
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status incident_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. Audit Logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes (as specified in Master Plan Section 5.4)
CREATE INDEX idx_driver_locations_point ON driver_locations USING GIST (point);
CREATE INDEX idx_ride_pickup_point      ON ride_requests   USING GIST (pickup_point);
CREATE INDEX idx_ride_status            ON ride_requests (status, requested_at DESC);
CREATE INDEX idx_ride_passenger         ON ride_requests (passenger_id, requested_at DESC);
CREATE INDEX idx_offers_ride            ON ride_offers (ride_id, sequence);
CREATE INDEX idx_offers_driver_pending  ON ride_offers (driver_id) WHERE status = 'PENDING';
CREATE INDEX idx_sms_phone              ON sms_messages (phone_number, created_at DESC);

-- Partial Unique Indexes
CREATE UNIQUE INDEX uq_driver_current_vehicle
  ON driver_vehicles (driver_id)
  WHERE is_current;

CREATE UNIQUE INDEX uq_one_active_ride_per_passenger
  ON ride_requests (passenger_id)
  WHERE status IN ('REQUESTED', 'DISPATCHING', 'OFFERED', 'ACCEPTED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS');
