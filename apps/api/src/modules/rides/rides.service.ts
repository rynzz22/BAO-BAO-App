import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  CreateRideDto,
  CancelRideDto,
  RateRideDto,
  ReportIncidentDto,
  RideStatus,
  ActorType,
  ProfileDto,
  TrackingSource,
} from '@bao-bao/shared';
import { DatabaseService } from '../database/database.service';
import { RideStateMachine } from './ride-state-machine';
import { DispatchService } from '../dispatch/dispatch.service';
import { calculateLocationFreshness } from '../location/location-freshness';

const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  RideStatus.REQUESTED,
  RideStatus.DISPATCHING,
  RideStatus.OFFERED,
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.IN_PROGRESS,
];

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(DispatchService) private readonly dispatchService: DispatchService,
  ) {}

  async createRide(passenger: ProfileDto, dto: CreateRideDto): Promise<any> {
    // Enforce one-active-ride rule at database level
    const existingActive = this.db.rideRequests.find(
      (r) => r.passengerId === passenger.id && ACTIVE_RIDE_STATUSES.includes(r.status),
    );

    if (existingActive) {
      throw new ConflictException({
        statusCode: 409,
        code: 'RIDE_ACTIVE_EXISTS',
        message: 'You already have an active ride in progress. Cancel or complete it first.',
        details: { activeRideId: existingActive.id, status: existingActive.status },
      });
    }

    const publicCode = Math.floor(100 + Math.random() * 900).toString(); // e.g. "184"
    const rideId = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const ride = {
      id: rideId,
      publicCode,
      passengerId: passenger.id,
      passengerCount: dto.passengerCount || 1,
      pickupPoint: dto.pickup,
      pickupLabel: dto.pickup.label,
      pickupZoneId: dto.pickup.zoneId || null,
      destinationPoint: dto.destination,
      destinationLabel: dto.destination.label,
      status: RideStatus.REQUESTED,
      driverId: null,
      vehicleId: null,
      channelUsed: null,
      etaMinutes: null,
      cancelReason: null,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min TTL
      acceptedAt: null,
      pickedUpAt: null,
      completedAt: null,
      notes: dto.notes || null,
    };

    this.db.rideRequests.push(ride);

    // Write initial status history
    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus: null,
      toStatus: RideStatus.REQUESTED,
      actorProfileId: passenger.id,
      actorType: ActorType.PASSENGER,
      meta: { channel: 'APP', pickup: dto.pickup.label, destination: dto.destination.label },
      createdAt: new Date().toISOString(),
    });

    // Asynchronously kick off dispatch process
    setTimeout(() => {
      this.dispatchService.dispatch(ride.id).catch((err) => {
        this.logger.error(`Error during dispatch for ride ${ride.id}:`, err);
      });
    }, 100);

    return this.sanitizeRide(ride);
  }

  async getActiveRide(passengerId: string): Promise<any | null> {
    const ride = this.db.rideRequests
      .filter((r) => r.passengerId === passengerId && ACTIVE_RIDE_STATUSES.includes(r.status))
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())[0];

    return ride ? this.sanitizeRide(ride) : null;
  }

  async getRideById(rideId: string, _user?: ProfileDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'RIDE_NOT_FOUND',
        message: 'Ride request not found',
      });
    }

    return this.sanitizeRide(ride);
  }

  async getRideHistory(passengerId: string): Promise<any[]> {
    const rides = this.db.rideRequests
      .filter((r) => r.passengerId === passengerId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return rides.map((r) => this.sanitizeRide(r));
  }

  async cancelRide(rideId: string, actor: ProfileDto, dto: CancelRideDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const actorType = actor.role === 'ADMIN' ? ActorType.ADMIN : ActorType.PASSENGER;
    RideStateMachine.validate(ride.status, RideStatus.CANCELLED, actorType);

    const fromStatus = ride.status;
    ride.status = RideStatus.CANCELLED;
    ride.cancelReason = dto.reason;

    // Release driver if assigned
    if (ride.driverId) {
      const driver = this.db.drivers.find((d) => d.id === ride.driverId);
      if (driver) {
        driver.availability = 'AVAILABLE';
      }
    }

    // Cancel pending offers
    for (const offer of this.db.rideOffers.filter((o) => o.rideId === ride.id && o.status === 'PENDING')) {
      offer.status = 'CANCELLED';
    }

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus,
      toStatus: RideStatus.CANCELLED,
      actorProfileId: actor.id,
      actorType,
      meta: { reason: dto.reason },
      createdAt: new Date().toISOString(),
    });

    return this.sanitizeRide(ride);
  }

  async retryRide(rideId: string, actor: ProfileDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    RideStateMachine.validate(ride.status, RideStatus.REQUESTED, ActorType.PASSENGER);
    const fromStatus = ride.status;
    ride.status = RideStatus.REQUESTED;

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}`,
      rideId: ride.id,
      fromStatus,
      toStatus: RideStatus.REQUESTED,
      actorProfileId: actor.id,
      actorType: ActorType.PASSENGER,
      meta: { event: 'PASSENGER_RETRY' },
      createdAt: new Date().toISOString(),
    });

    await this.dispatchService.dispatch(ride.id);
    return this.sanitizeRide(ride);
  }

  async rateRide(rideId: string, passengerId: string, dto: RateRideDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    if (ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed rides');
    }
    if (ride.passengerId !== passengerId) {
      throw new BadRequestException('Only the passenger who took the ride can rate it');
    }

    const rating = {
      id: `rate-${Date.now()}`,
      rideId: ride.id,
      passengerId,
      driverId: ride.driverId,
      score: dto.score,
      comment: dto.comment || null,
      createdAt: new Date().toISOString(),
    };
    this.db.ratings.push(rating);
    return rating;
  }

  async reportIncident(rideId: string, reporterId: string, dto: ReportIncidentDto): Promise<any> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const report = {
      id: `incident-${Date.now()}`,
      rideId: ride.id,
      reporterId,
      category: dto.category,
      description: dto.description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    this.db.incidentReports.push(report);
    return report;
  }

  // Sanitizer: Never expose driver phone numbers to passengers
  private sanitizeRide(ride: any): any {
    let driverInfo = null;
    let driverLocation = null;

    if (ride.driverId) {
      const driver = this.db.drivers.find((d) => d.id === ride.driverId);
      const dv = this.db.driverVehicles.find((rel) => rel.driverId === ride.driverId && rel.isCurrent);
      const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;
      const vType = vehicle ? this.db.vehicleTypes.find((vt) => vt.id === vehicle.vehicleTypeId) : null;

      if (driver) {
        driverInfo = {
          id: driver.id,
          fullName: driver.fullName,
          driverCode: driver.driverCode,
          primaryChannel: driver.primaryChannel,
          // Notice: Driver phone number is strictly NOT exposed here per Master Plan Rule 8
        };
      }

      const loc = this.db.driverLocations.get(ride.driverId);
      if (loc) {
        const freshness = calculateLocationFreshness(loc.trackingSource, loc.updatedAt);
        driverLocation = {
          lat: loc.lat,
          lng: loc.lng,
          trackingSource: freshness.effectiveSource,
          updatedAt: loc.updatedAt,
        };
      }

      return {
        ...ride,
        driver: driverInfo,
        driverLocation,
        vehicle: vehicle
          ? {
              plateOrBodyNo: vehicle.plateOrBodyNo,
              vehicleType: vType?.code || 'TRICYCLE',
              capacity: vehicle.capacity,
            }
          : null,
      };
    }

    return { ...ride };
  }
}
