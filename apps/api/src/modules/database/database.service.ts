import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  UserRole,
  DriverChannel,
  TrackingSource,
  ApprovalStatus,
  DriverAvailability,
  RideStatus,
  OfferStatus,
  ActorType,
  ZoneType,
  SmsDirection,
  SmsStatus,
  IncidentStatus,
} from '@bao-bao/shared';
import { INITIAL_SEED_DATA } from '../../../prisma/seed';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  public profiles: any[] = [];
  public vehicleTypes: any[] = [];
  public vehicles: any[] = [];
  public driverVehicles: any[] = [];
  public drivers: any[] = [];
  public driverLocations: Map<string, any> = new Map();
  public driverLocationHistory: any[] = [];
  public terminals: any[] = [];
  public terminalDispatchers: any[] = [];
  public terminalQueue: any[] = [];
  public zones: any[] = [];
  public rideRequests: any[] = [];
  public rideOffers: any[] = [];
  public rideStatusHistory: any[] = [];
  public smsMessages: any[] = [];
  public ratings: any[] = [];
  public incidentReports: any[] = [];
  public notifications: any[] = [];
  public auditLogs: any[] = [];

  // Mutex for ride acceptance to guarantee concurrency safety (SELECT FOR UPDATE equivalent)
  private rideLocks: Set<string> = new Set();

  onModuleInit() {
    this.seedInitialData();
  }

  public seedInitialData() {
    // 1. Vehicle types
    this.vehicleTypes = INITIAL_SEED_DATA.vehicleTypes.map((vt) => ({ ...vt }));

    // 2. Zones
    this.zones = INITIAL_SEED_DATA.zones.map((z) => ({
      ...z,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    // 3. Terminals
    this.terminals = INITIAL_SEED_DATA.terminals.map((t) => ({
      ...t,
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    // 4. Profiles
    this.profiles = INITIAL_SEED_DATA.users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      role: u.role as UserRole,
      preferredLanguage: 'en',
      isActive: true,
      createdAt: new Date().toISOString(),
    }));

    // Dispatcher assignment
    this.terminalDispatchers.push({
      id: 'disp-term-1',
      terminalId: this.terminals[0].id,
      profileId: '44444444-4444-4444-4444-444444444402',
      createdAt: new Date().toISOString(),
    });

    // 5. Drivers & Vehicles
    for (const d of INITIAL_SEED_DATA.drivers) {
      const vType = this.vehicleTypes.find((vt) => vt.code === d.vehicleTypeCode);
      const vehicleId = `veh-${d.driverCode}`;
      const vehicle = {
        id: vehicleId,
        vehicleTypeId: vType?.id || this.vehicleTypes[0].id,
        plateOrBodyNo: d.vehiclePlate,
        capacity: vType?.defaultCapacity || 3,
        approvalStatus: ApprovalStatus.APPROVED,
        photoUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.vehicles.push(vehicle);

      const driverRecord = {
        id: d.id,
        profileId: d.profileId || null,
        fullName: d.fullName,
        phoneNumber: d.phoneNumber || null,
        licenseNo: d.licenseNo,
        primaryChannel: d.primaryChannel as DriverChannel,
        approvalStatus: ApprovalStatus.APPROVED,
        availability: d.availability as DriverAvailability,
        driverCode: d.driverCode,
        homeTerminalId: d.homeTerminalId || null,
        createdAt: new Date().toISOString(),
      };
      this.drivers.push(driverRecord);

      this.driverVehicles.push({
        id: `dv-${d.id}`,
        driverId: d.id,
        vehicleId: vehicle.id,
        isCurrent: true,
        assignedAt: new Date().toISOString(),
      });

      this.driverLocations.set(d.id, {
        driverId: d.id,
        lat: d.lat,
        lng: d.lng,
        trackingSource: d.trackingSource as TrackingSource,
        lastZoneId: this.zones[0].id,
        updatedAt: new Date().toISOString(),
      });

      // If DISPATCHER channel driver, check in to terminal queue position 1
      if (d.primaryChannel === DriverChannel.DISPATCHER) {
        this.terminalQueue.push({
          id: `tq-${d.id}`,
          terminalId: this.terminals[0].id,
          driverId: d.id,
          position: 1,
          checkedInAt: new Date().toISOString(),
          checkedOutAt: null,
        });
      }
    }
  }

  // Profile lookup
  async findProfileByIdOrEmail(identifier: string): Promise<any | null> {
    return (
      this.profiles.find(
        (p) =>
          p.id === identifier ||
          (p.email && p.email.toLowerCase() === identifier.toLowerCase()),
      ) || null
    );
  }

  async acquireRideLock(rideId: string): Promise<boolean> {
    if (this.rideLocks.has(rideId)) return false;
    this.rideLocks.add(rideId);
    return true;
  }

  releaseRideLock(rideId: string) {
    this.rideLocks.delete(rideId);
  }
}
