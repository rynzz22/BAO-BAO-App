-- Migration: 0002_rls.sql
-- Enables Row Level Security on all MVP tables.
-- Read-only policies for clients for Realtime subscriptions.
-- Writes happen exclusively via the NestJS API with the service role (which bypasses RLS).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 2. Vehicle Types: Publicly readable
CREATE POLICY "Public read vehicle types" ON vehicle_types
  FOR SELECT TO authenticated, anon
  USING (true);

-- 3. Zones: Publicly readable
CREATE POLICY "Public read zones" ON zones
  FOR SELECT TO authenticated, anon
  USING (is_active = true);

-- 4. Terminals: Publicly readable
CREATE POLICY "Public read terminals" ON terminals
  FOR SELECT TO authenticated, anon
  USING (is_active = true);

-- 5. Driver Locations: Authenticated users can read location for active map view
CREATE POLICY "Read driver locations" ON driver_locations
  FOR SELECT TO authenticated
  USING (true);

-- 6. Ride Requests: Passengers can read their own rides; drivers can read assigned rides
CREATE POLICY "Read own or assigned rides" ON ride_requests
  FOR SELECT TO authenticated
  USING (
    passenger_id = auth.uid() OR
    driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
  );

-- 7. Ride Offers: Drivers can read their own offers
CREATE POLICY "Read own ride offers" ON ride_offers
  FOR SELECT TO authenticated
  USING (
    driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
  );

-- 8. Ride Status History: Visible to participants of the ride
CREATE POLICY "Read ride status history" ON ride_status_history
  FOR SELECT TO authenticated
  USING (
    ride_id IN (
      SELECT id FROM ride_requests
      WHERE passenger_id = auth.uid()
         OR driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid())
    )
  );

-- 9. Terminal Queue: Visible to authenticated users (dispatchers, drivers)
CREATE POLICY "Read terminal queue" ON terminal_queue
  FOR SELECT TO authenticated
  USING (true);

-- 10. Notifications: Users read their own notifications
CREATE POLICY "Read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());
