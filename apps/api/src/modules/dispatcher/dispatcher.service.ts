import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  DriverChannel,
  DriverAvailability,
  ApprovalStatus,
  RideStatus,
  ActorType,
  TrackingSource,
  ProfileDto,
} from '@bao-bao/shared';
import { DatabaseService } from '../database/database.service';
import { RideStateMachine } from '../rides/ride-state-machine';
import { calculateLocationFreshness } from '../location/location-freshness';

@Injectable()
export class DispatcherService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async getTerminals(profileId: string): Promise<any[]> {
    const user = this.db.profiles.find((p) => p.id === profileId);
    if (user?.role === 'ADMIN') {
      return this.db.terminals;
    }
    const assignments = this.db.terminalDispatchers.filter((td) => td.profileId === profileId);
    const terminalIds = new Set(assignments.map((a) => a.terminalId));
    return this.db.terminals.filter((t) => terminalIds.has(t.id));
  }

  async getRides(statusFilter?: string): Promise<any[]> {
    let rides = this.db.rideRequests;
    if (statusFilter) {
      rides = rides.filter((r) => r.status === statusFilter);
    }
    return rides
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .map((r) => {
        const driver = r.driverId ? this.db.drivers.find((d) => d.id === r.driverId) : null;
        return {
          ...r,
          driverName: driver?.fullName,
          driverCode: driver?.driverCode,
          driverChannel: driver?.primaryChannel,
        };
      });
  }

  async getDrivers(terminalId?: string): Promise<any[]> {
    return this.db.drivers.map((d) => {
      const loc = this.db.driverLocations.get(d.id);
      const queueEntry = this.db.terminalQueue.find(
        (tq) => tq.driverId === d.id && !tq.checkedOutAt,
      );
      const dv = this.db.driverVehicles.find((rel) => rel.driverId === d.id && rel.isCurrent);
      const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;

      let effectiveTracking = TrackingSource.UNKNOWN;
      if (loc) {
        effectiveTracking = calculateLocationFreshness(loc.trackingSource, loc.updatedAt).effectiveSource;
      } else if (d.primaryChannel === DriverChannel.DISPATCHER) {
        effectiveTracking = TrackingSource.TERMINAL;
      }

      return {
        ...d,
        trackingSource: effectiveTracking,
        currentLocation: loc || null,
        terminalQueue: queueEntry || null,
        vehicle: vehicle || null,
      };
    });
  }

  async queueCheckIn(terminalId: string, driverId: string): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    const terminal = this.db.terminals.find((t) => t.id === terminalId);
    if (!terminal) throw new NotFoundException('Terminal not found');

    // Check if already checked in
    const existing = this.db.terminalQueue.find(
      (tq) => tq.driverId === driverId && !tq.checkedOutAt,
    );
    if (existing) {
      return existing;
    }

    const currentQueue = this.db.terminalQueue.filter(
      (tq) => tq.terminalId === terminalId && !tq.checkedOutAt,
    );
    const position = currentQueue.length + 1;

    const entry = {
      id: `tq-${Date.now()}`,
      terminalId,
      driverId,
      position,
      checkedInAt: new Date().toISOString(),
      checkedOutAt: null,
    };
    this.db.terminalQueue.push(entry);

    // Update driver availability and location to terminal
    driver.availability = DriverAvailability.AVAILABLE;
    this.db.driverLocations.set(driverId, {
      driverId,
      lat: terminal.lat,
      lng: terminal.lng,
      trackingSource: TrackingSource.TERMINAL,
      lastZoneId: terminal.zoneId,
      updatedAt: new Date().toISOString(),
    });

    return entry;
  }

  async queueCheckOut(terminalId: string, driverId: string): Promise<any> {
    const entry = this.db.terminalQueue.find(
      (tq) => tq.terminalId === terminalId && tq.driverId === driverId && !tq.checkedOutAt,
    );
    if (!entry) throw new NotFoundException('Driver not active in terminal queue');

    entry.checkedOutAt = new Date().toISOString();

    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (driver && driver.primaryChannel === DriverChannel.DISPATCHER) {
      driver.availability = DriverAvailability.OFFLINE;
    }

    return entry;
  }

  async assignRide(rideId: string, driverId: string, dispatcher: ProfileDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    if (driver.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Driver is not approved');
    }

    // Move to OFFERED first if currently REQUESTED or DISPATCHING
    if (ride.status === RideStatus.REQUESTED || ride.status === RideStatus.DISPATCHING) {
      RideStateMachine.validate(ride.status, RideStatus.OFFERED, ActorType.SYSTEM);
      ride.status = RideStatus.OFFERED;
    }

    // Now validate transition to ACCEPTED by DISPATCHER
    RideStateMachine.validate(ride.status, RideStatus.ACCEPTED, ActorType.DISPATCHER);

    const fromStatus = ride.status;
    ride.status = RideStatus.ACCEPTED;
    ride.driverId = driver.id;

    const dv = this.db.driverVehicles.find((rel) => rel.driverId === driver.id && rel.isCurrent);
    ride.vehicleId = dv ? dv.vehicleId : null;
    ride.channelUsed = DriverChannel.DISPATCHER;
    ride.acceptedAt = new Date().toISOString();
    ride.etaMinutes = 5;

    driver.availability = DriverAvailability.BUSY;

    // Check out driver from terminal queue if they were in it
    const queueEntry = this.db.terminalQueue.find(
      (tq) => tq.driverId === driver.id && !tq.checkedOutAt,
    );
    if (queueEntry) {
      queueEntry.checkedOutAt = new Date().toISOString();
    }

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus,
      toStatus: RideStatus.ACCEPTED,
      actorProfileId: dispatcher.id,
      actorType: ActorType.DISPATCHER,
      meta: {
        assignedDriverId: driver.id,
        driverCode: driver.driverCode,
        channel: DriverChannel.DISPATCHER,
      },
      createdAt: new Date().toISOString(),
    });

    return ride;
  }

  async updateRideStatusOnBehalf(
    rideId: string,
    targetStatus: RideStatus,
    dispatcher: ProfileDto,
  ): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) throw new NotFoundException('Ride not found');

    RideStateMachine.validate(ride.status, targetStatus, ActorType.DISPATCHER);
    const fromStatus = ride.status;
    ride.status = targetStatus;

    if (targetStatus === RideStatus.COMPLETED) {
      ride.completedAt = new Date().toISOString();
      if (ride.driverId) {
        const driver = this.db.drivers.find((d) => d.id === ride.driverId);
        if (driver) driver.availability = DriverAvailability.AVAILABLE;
      }
    }

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus,
      toStatus: targetStatus,
      actorProfileId: dispatcher.id,
      actorType: ActorType.DISPATCHER,
      meta: { channel: 'DISPATCHER' },
      createdAt: new Date().toISOString(),
    });

    return ride;
  }

  async createOfflineDriver(
    dto: {
      fullName: string;
      phoneNumber?: string;
      licenseNo: string;
      primaryChannel: DriverChannel;
      vehiclePlate: string;
      vehicleTypeCode: string;
      homeTerminalId?: string;
    },
    dispatcher: ProfileDto,
  ): Promise<any> {
    const driverId = `drv-${Date.now()}`;
    const vehicleId = `veh-${Date.now()}`;
    const driverCode = Math.floor(100 + Math.random() * 900).toString();

    const vType = this.db.vehicleTypes.find((vt) => vt.code === dto.vehicleTypeCode) || this.db.vehicleTypes[0];

    const vehicle = {
      id: vehicleId,
      vehicleTypeId: vType.id,
      plateOrBodyNo: dto.vehiclePlate,
      capacity: vType.defaultCapacity || 3,
      approvalStatus: ApprovalStatus.APPROVED,
      photoUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.db.vehicles.push(vehicle);

    const driver = {
      id: driverId,
      profileId: null, // SMS and Terminal drivers have no app login
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber || null,
      licenseNo: dto.licenseNo,
      primaryChannel: dto.primaryChannel,
      approvalStatus: ApprovalStatus.APPROVED,
      availability: DriverAvailability.AVAILABLE,
      driverCode,
      homeTerminalId: dto.homeTerminalId || null,
      createdAt: new Date().toISOString(),
    };
    this.db.drivers.push(driver);

    this.db.driverVehicles.push({
      id: `dv-${driverId}`,
      driverId,
      vehicleId,
      isCurrent: true,
      assignedAt: new Date().toISOString(),
    });

    if (dto.homeTerminalId) {
      const term = this.db.terminals.find((t) => t.id === dto.homeTerminalId);
      if (term) {
        this.db.driverLocations.set(driverId, {
          driverId,
          lat: term.lat,
          lng: term.lng,
          trackingSource:
            dto.primaryChannel === DriverChannel.DISPATCHER
              ? TrackingSource.TERMINAL
              : TrackingSource.LAST_REPORTED,
          lastZoneId: term.zoneId,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return driver;
  }
}
