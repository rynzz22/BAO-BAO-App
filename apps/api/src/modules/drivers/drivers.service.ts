import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  DriverDto,
  RegisterDriverDto,
  UpdateDriverStatusDto,
  DriverLocationUpdateDto,
  ProfileDto,
  ApprovalStatus,
  DriverAvailability,
  DriverChannel,
  TrackingSource,
  RideStatus,
  ActorType,
} from '@bao-bao/shared';
import { DatabaseService } from '../database/database.service';
import { RideStateMachine } from '../rides/ride-state-machine';
import { DispatchService } from '../dispatch/dispatch.service';
import { calculateLocationFreshness } from '../location/location-freshness';

@Injectable()
export class DriversService {
  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(DispatchService) private readonly dispatchService: DispatchService,
  ) {}

  async getDriverForUser(userId: string): Promise<any> {
    const driver = this.db.drivers.find((d) => d.profileId === userId);
    if (!driver) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'DRIVER_NOT_FOUND',
        message: 'No driver profile associated with this account',
      });
    }

    const dv = this.db.driverVehicles.find((rel) => rel.driverId === driver.id && rel.isCurrent);
    const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;
    const vType = vehicle ? this.db.vehicleTypes.find((vt) => vt.id === vehicle.vehicleTypeId) : null;
    const loc = this.db.driverLocations.get(driver.id);

    return {
      ...driver,
      vehicle: vehicle
        ? {
            ...vehicle,
            vehicleTypeCode: vType?.code,
          }
        : null,
      currentLocation: loc || null,
    };
  }

  async registerDriver(user: ProfileDto, dto: RegisterDriverDto): Promise<any> {
    const existing = this.db.drivers.find((d) => d.profileId === user.id);
    if (existing) {
      throw new BadRequestException('Driver registration already submitted');
    }

    const driverCode = Math.floor(100 + Math.random() * 900).toString();
    const driverId = `drv-${Date.now()}`;
    const vehicleId = `veh-${Date.now()}`;

    // Create vehicle
    const vehicle = {
      id: vehicleId,
      vehicleTypeId: dto.vehicleTypeId,
      plateOrBodyNo: dto.plateOrBodyNo,
      capacity: dto.capacity || 3,
      approvalStatus: ApprovalStatus.PENDING,
      photoUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.db.vehicles.push(vehicle);

    // Create driver
    const driver = {
      id: driverId,
      profileId: user.id,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber || user.phoneNumber || null,
      licenseNo: dto.licenseNo,
      primaryChannel: DriverChannel.APP,
      approvalStatus: ApprovalStatus.PENDING,
      availability: DriverAvailability.OFFLINE,
      driverCode,
      homeTerminalId: dto.homeTerminalId || null,
      createdAt: new Date().toISOString(),
    };
    this.db.drivers.push(driver);

    // Link vehicle
    this.db.driverVehicles.push({
      id: `dv-${driverId}`,
      driverId,
      vehicleId,
      isCurrent: true,
      assignedAt: new Date().toISOString(),
    });

    return {
      message: 'Driver registration submitted for admin approval',
      driverId,
      approvalStatus: ApprovalStatus.PENDING,
    };
  }

  async updateStatus(driverId: string, dto: UpdateDriverStatusDto): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'DRIVER_NOT_APPROVED',
        message: 'Only approved drivers can toggle availability',
      });
    }

    driver.availability = dto.availability;
    return { driverId: driver.id, availability: driver.availability };
  }

  async updateLocation(driverId: string, dto: DriverLocationUpdateDto): Promise<any> {
    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver) throw new NotFoundException('Driver not found');

    const locationRecord = {
      driverId,
      lat: dto.lat,
      lng: dto.lng,
      trackingSource: TrackingSource.LIVE_APP, // App ping sets LIVE_APP
      lastZoneId: null,
      updatedAt: new Date().toISOString(),
    };

    this.db.driverLocations.set(driverId, locationRecord);

    // Record trail
    this.db.driverLocationHistory.push({
      driverId,
      lat: dto.lat,
      lng: dto.lng,
      trackingSource: TrackingSource.LIVE_APP,
      recordedAt: new Date().toISOString(),
    });

    return {
      success: true,
      trackingSource: TrackingSource.LIVE_APP,
      updatedAt: locationRecord.updatedAt,
    };
  }

  async getOffers(driverId: string): Promise<any[]> {
    const offers = this.db.rideOffers.filter(
      (o) => o.driverId === driverId && o.status === 'PENDING',
    );

    return offers.map((offer) => {
      const ride = this.db.rideRequests.find((r) => r.id === offer.rideId);
      return {
        ...offer,
        ride,
      };
    });
  }

  async acceptOffer(offerId: string, profileId: string): Promise<any> {
    return this.dispatchService.acceptOffer(offerId, profileId, ActorType.DRIVER);
  }

  async declineOffer(offerId: string, profileId: string): Promise<any> {
    return this.dispatchService.declineOffer(offerId, profileId, ActorType.DRIVER);
  }

  async updateRideStatus(
    driverId: string,
    rideId: string,
    targetStatus: RideStatus,
    profileId: string,
  ): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId && r.driverId === driverId);
    if (!ride) {
      throw new NotFoundException('Ride not found or not assigned to this driver');
    }

    RideStateMachine.validate(ride.status, targetStatus, ActorType.DRIVER);
    const fromStatus = ride.status;
    ride.status = targetStatus;

    if (targetStatus === RideStatus.ARRIVED) {
      // Arrived at pickup
    } else if (targetStatus === RideStatus.IN_PROGRESS) {
      ride.pickedUpAt = new Date().toISOString();
    } else if (targetStatus === RideStatus.COMPLETED) {
      ride.completedAt = new Date().toISOString();
      const driver = this.db.drivers.find((d) => d.id === driverId);
      if (driver) {
        driver.availability = DriverAvailability.AVAILABLE;
      }
    }

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus,
      toStatus: targetStatus,
      actorProfileId: profileId,
      actorType: ActorType.DRIVER,
      meta: { channel: DriverChannel.APP },
      createdAt: new Date().toISOString(),
    });

    return ride;
  }

  async getDriverRides(driverId: string): Promise<any[]> {
    return this.db.rideRequests
      .filter((r) => r.driverId === driverId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
}
