import {
  Injectable,
  NotFoundException,
  ConflictException,
  GoneException,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  RideStatus,
  ApprovalStatus,
  DriverAvailability,
  OfferStatus,
  ActorType,
  DriverChannel,
} from '@bao-bao/shared';
import { DatabaseService, calculateDistanceMeters } from '../database/database.service';
import { ChannelsService } from '../channels/channels.service';
import { RideStateMachine } from '../rides/ride-state-machine';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
  ) {}

  async dispatch(rideId: string): Promise<boolean> {
    const ride = this.db.rideRequests.find((r) => r.id === rideId);
    if (!ride) {
      throw new NotFoundException(`Ride #${rideId} not found`);
    }

    if (
      ride.status !== RideStatus.REQUESTED &&
      ride.status !== RideStatus.DISPATCHING
    ) {
      this.logger.warn(`Ride ${rideId} is in status ${ride.status}, cannot dispatch`);
      return false;
    }

    // Move to DISPATCHING if currently REQUESTED
    if (ride.status === RideStatus.REQUESTED) {
      RideStateMachine.validate(ride.status, RideStatus.DISPATCHING, ActorType.SYSTEM);
      ride.status = RideStatus.DISPATCHING;
      this.db.rideStatusHistory.push({
        id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        rideId: ride.id,
        fromStatus: RideStatus.REQUESTED,
        toStatus: RideStatus.DISPATCHING,
        actorProfileId: null,
        actorType: ActorType.SYSTEM,
        meta: { event: 'DISPATCH_SEARCH_STARTED' },
        createdAt: new Date().toISOString(),
      });
    }

    // 1. Eligibility Filter:
    // - approval_status = APPROVED
    // - availability = AVAILABLE
    // - vehicle capacity >= passengerCount
    // - not already holding a pending offer
    // - not previously declined this ride
    const declinedDriverIds = new Set(
      this.db.rideOffers
        .filter((o) => o.rideId === ride.id && o.status === OfferStatus.DECLINED)
        .map((o) => o.driverId),
    );

    const pendingOfferDriverIds = new Set(
      this.db.rideOffers
        .filter((o) => o.status === OfferStatus.PENDING)
        .map((o) => o.driverId),
    );

    const eligibleDrivers = this.db.drivers.filter((driver) => {
      if (driver.approvalStatus !== ApprovalStatus.APPROVED) return false;
      if (driver.availability !== DriverAvailability.AVAILABLE) return false;
      if (declinedDriverIds.has(driver.id)) return false;
      if (pendingOfferDriverIds.has(driver.id)) return false;

      // Check vehicle capacity
      const dv = this.db.driverVehicles.find((rel) => rel.driverId === driver.id && rel.isCurrent);
      if (!dv) return false;
      const vehicle = this.db.vehicles.find((v) => v.id === dv.vehicleId);
      if (!vehicle || vehicle.capacity < ride.passengerCount) return false;

      return true;
    });

    if (eligibleDrivers.length === 0) {
      this.logger.warn(`No eligible drivers found for ride ${ride.id}`);
      RideStateMachine.validate(ride.status, RideStatus.NO_DRIVER_FOUND, ActorType.SYSTEM);
      ride.status = RideStatus.NO_DRIVER_FOUND;
      this.db.rideStatusHistory.push({
        id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        rideId: ride.id,
        fromStatus: RideStatus.DISPATCHING,
        toStatus: RideStatus.NO_DRIVER_FOUND,
        actorProfileId: null,
        actorType: ActorType.SYSTEM,
        meta: { reason: 'CANDIDATES_EXHAUSTED' },
        createdAt: new Date().toISOString(),
      });
      return false;
    }

    // 2. Rank candidates by distance to pickup point
    const pickup = ride.pickupPoint;
    const rankedCandidates = eligibleDrivers
      .map((driver) => {
        const loc = this.db.driverLocations.get(driver.id) || {
          lat: pickup.lat,
          lng: pickup.lng,
        };
        const distance = calculateDistanceMeters(loc.lat, loc.lng, pickup.lat, pickup.lng);
        return { driver, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const topCandidate = rankedCandidates[0].driver;
    const dv = this.db.driverVehicles.find(
      (rel) => rel.driverId === topCandidate.id && rel.isCurrent,
    );
    const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;

    // 3. Create Ride Offer
    const previousOffers = this.db.rideOffers.filter((o) => o.rideId === ride.id);
    const sequence = previousOffers.length + 1;

    // Channel TTL (APP 20s, DISPATCHER 60s, SMS 90s)
    let ttlSeconds = 20;
    if (topCandidate.primaryChannel === DriverChannel.DISPATCHER) ttlSeconds = 60;
    if (topCandidate.primaryChannel === DriverChannel.SMS) ttlSeconds = 90;

    const offer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rideId: ride.id,
      driverId: topCandidate.id,
      channel: topCandidate.primaryChannel,
      status: OfferStatus.PENDING,
      sequence,
      offeredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      respondedAt: null,
      respondedBy: null,
    };
    this.db.rideOffers.push(offer);

    // 4. Update ride to OFFERED
    RideStateMachine.validate(ride.status, RideStatus.OFFERED, ActorType.SYSTEM);
    const prevStatus = ride.status;
    ride.status = RideStatus.OFFERED;

    this.db.rideStatusHistory.push({
      id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      rideId: ride.id,
      fromStatus: prevStatus,
      toStatus: RideStatus.OFFERED,
      actorProfileId: null,
      actorType: ActorType.SYSTEM,
      meta: {
        offerId: offer.id,
        driverId: topCandidate.id,
        channel: topCandidate.primaryChannel,
      },
      createdAt: new Date().toISOString(),
    });

    // 5. Route through channel adapter
    const adapter = this.channels.getAdapter(topCandidate.primaryChannel);
    await adapter.sendOffer(offer, ride, topCandidate);

    // TODO(job): Schedule background timeout check at offer.expiresAt (BullMQ / pg-boss)
    return true;
  }

  async acceptOffer(offerId: string, actorProfileId?: string, actorType: ActorType = ActorType.DRIVER): Promise<any> {
    const offer = this.db.rideOffers.find((o) => o.id === offerId);
    if (!offer) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'OFFER_NOT_FOUND',
        message: 'Offer not found',
      });
    }

    if (offer.status !== OfferStatus.PENDING) {
      if (offer.status === OfferStatus.EXPIRED) {
        throw new GoneException({
          statusCode: 410,
          code: 'OFFER_EXPIRED',
          message: 'This offer has already expired',
        });
      }
      throw new ConflictException({
        statusCode: 409,
        code: 'OFFER_ALREADY_TAKEN',
        message: `Offer is already in status: ${offer.status}`,
      });
    }

    const ride = this.db.rideRequests.find((r) => r.id === offer.rideId);
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Concurrency Lock: SELECT FOR UPDATE on ride
    const locked = await this.db.acquireRideLock(ride.id);
    if (!locked) {
      throw new ConflictException({
        statusCode: 409,
        code: 'OFFER_ALREADY_TAKEN',
        message: 'Another transaction is currently processing this ride',
      });
    }

    try {
      if (ride.status !== RideStatus.OFFERED) {
        throw new ConflictException({
          statusCode: 409,
          code: 'OFFER_ALREADY_TAKEN',
          message: 'Ride is no longer available',
        });
      }

      // Check transition via state machine
      RideStateMachine.validate(ride.status, RideStatus.ACCEPTED, actorType);

      // Update offer
      offer.status = OfferStatus.ACCEPTED;
      offer.respondedAt = new Date().toISOString();
      offer.respondedBy = actorProfileId || null;

      // Update driver and vehicle assignment
      const driver = this.db.drivers.find((d) => d.id === offer.driverId);
      const dv = this.db.driverVehicles.find(
        (rel) => rel.driverId === offer.driverId && rel.isCurrent,
      );

      const fromStatus = ride.status;
      ride.status = RideStatus.ACCEPTED;
      ride.driverId = offer.driverId;
      ride.vehicleId = dv ? dv.vehicleId : null;
      ride.channelUsed = offer.channel;
      ride.acceptedAt = new Date().toISOString();
      ride.etaMinutes = 5;

      if (driver) {
        driver.availability = DriverAvailability.BUSY;
      }

      // Record ride status history
      this.db.rideStatusHistory.push({
        id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        rideId: ride.id,
        fromStatus,
        toStatus: RideStatus.ACCEPTED,
        actorProfileId: actorProfileId || null,
        actorType,
        meta: {
          offerId: offer.id,
          driverId: offer.driverId,
          channel: offer.channel,
        },
        createdAt: new Date().toISOString(),
      });

      // Broadcast update to channel
      const adapter = this.channels.getAdapter(offer.channel);
      await adapter.sendRideUpdate(offer.driverId, ride, 'ACCEPTED');

      return {
        success: true,
        rideId: ride.id,
        status: ride.status,
        driverId: ride.driverId,
      };
    } finally {
      this.db.releaseRideLock(ride.id);
    }
  }

  async declineOffer(offerId: string, actorProfileId?: string, actorType: ActorType = ActorType.DRIVER): Promise<any> {
    const offer = this.db.rideOffers.find((o) => o.id === offerId);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.PENDING) {
      return { success: false, message: `Offer already ${offer.status}` };
    }

    offer.status = OfferStatus.DECLINED;
    offer.respondedAt = new Date().toISOString();
    offer.respondedBy = actorProfileId || null;

    const ride = this.db.rideRequests.find((r) => r.id === offer.rideId);
    if (ride && ride.status === RideStatus.OFFERED) {
      // Revert to DISPATCHING and seek next driver
      RideStateMachine.validate(ride.status, RideStatus.DISPATCHING, ActorType.SYSTEM);
      const fromStatus = ride.status;
      ride.status = RideStatus.DISPATCHING;

      this.db.rideStatusHistory.push({
        id: `rsh-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        rideId: ride.id,
        fromStatus,
        toStatus: RideStatus.DISPATCHING,
        actorProfileId: actorProfileId || null,
        actorType,
        meta: {
          declinedOfferId: offer.id,
          declinedByDriverId: offer.driverId,
        },
        createdAt: new Date().toISOString(),
      });

      // Try next candidate
      await this.dispatch(ride.id);
    }

    return { success: true, offerId: offer.id, status: offer.status };
  }
}
