import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import {
  SmsDirection,
  SmsStatus,
  TrackingSource,
  DriverAvailability,
  ActorType,
  RideStatus,
} from '@bao-bao/shared';
import { DatabaseService } from '../database/database.service';
import { SmsCommandParser, ParsedSmsCommand } from './sms-command-parser';
import { DispatchService } from '../dispatch/dispatch.service';
import { RideStateMachine } from '../rides/ride-state-machine';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<{ success: boolean; messageId: string }>;
}

@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async sendSms(to: string, message: string): Promise<{ success: boolean; messageId: string }> {
    const messageId = `mock-sms-${Date.now()}`;
    this.logger.log(`[SMS GATEWAY OUT] To: ${to} | Body: "${message}" | Id: ${messageId}`);
    return { success: true, messageId };
  }
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(DispatchService) private readonly dispatchService: DispatchService,
    @Inject(ConsoleSmsProvider) private readonly smsProvider: ConsoleSmsProvider,
  ) {}

  normalizePhoneNumber(phone: string): string {
    let clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('09')) {
      clean = '+63' + clean.slice(1);
    } else if (clean.startsWith('63') && !clean.startsWith('+')) {
      clean = '+' + clean;
    } else if (!clean.startsWith('+')) {
      clean = '+63' + clean;
    }
    return clean;
  }

  async handleInboundSms(from: string, rawBody: string, signature?: string): Promise<{ reply: string; actionTaken: string }> {
    const normalizedPhone = this.normalizePhoneNumber(from);

    // Persist incoming message
    this.db.smsMessages.push({
      id: `sms-in-${Date.now()}`,
      direction: SmsDirection.IN,
      phoneNumber: normalizedPhone,
      body: rawBody,
      rideOfferId: null,
      status: SmsStatus.RECEIVED,
      providerMessageId: `in-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    // Match driver by phone number
    const driver = this.db.drivers.find(
      (d) => d.phoneNumber && this.normalizePhoneNumber(d.phoneNumber) === normalizedPhone,
    );

    if (!driver) {
      const reply = 'BAO BAO: Mobile number not registered as an active driver in Talibon.';
      await this.smsProvider.sendSms(normalizedPhone, reply);
      return { reply, actionTaken: 'UNREGISTERED_PHONE' };
    }

    const command: ParsedSmsCommand = SmsCommandParser.parse(rawBody);
    let reply = '';
    let actionTaken = command.type;

    switch (command.type) {
      case 'ACCEPT': {
        // Find latest pending offer for this driver (matching shortCode if provided)
        let offer = this.db.rideOffers
          .filter((o) => o.driverId === driver.id && o.status === 'PENDING')
          .sort((a, b) => new Date(b.offeredAt).getTime() - new Date(a.offeredAt).getTime())[0];

        if (command.shortCode) {
          const ride = this.db.rideRequests.find((r) => r.publicCode === command.shortCode);
          if (ride) {
            const matchedOffer = this.db.rideOffers.find(
              (o) => o.rideId === ride.id && o.driverId === driver.id && o.status === 'PENDING',
            );
            if (matchedOffer) offer = matchedOffer;
          }
        }

        if (!offer) {
          reply = 'BAO BAO: No pending ride request found or offer has already expired.';
          break;
        }

        try {
          await this.dispatchService.acceptOffer(offer.id, undefined, ActorType.SMS);
          const ride = this.db.rideRequests.find((r) => r.id === offer.rideId);
          reply = `BAO BAO: Accepted ride #${ride?.publicCode}! Proceed to ${ride?.pickupLabel}. Reply ARRIVED when at pickup.`;
        } catch (err: any) {
          reply = `BAO BAO: Unable to accept ride (${err.message || 'Already taken'}).`;
        }
        break;
      }

      case 'DECLINE': {
        const offer = this.db.rideOffers
          .filter((o) => o.driverId === driver.id && o.status === 'PENDING')
          .sort((a, b) => new Date(b.offeredAt).getTime() - new Date(a.offeredAt).getTime())[0];

        if (!offer) {
          reply = 'BAO BAO: No pending ride offer to decline.';
          break;
        }

        await this.dispatchService.declineOffer(offer.id, undefined, ActorType.SMS);
        reply = 'BAO BAO: Offer declined.';
        break;
      }

      case 'ONLINE': {
        driver.availability = DriverAvailability.AVAILABLE;
        reply = `BAO BAO: Driver #${driver.driverCode} is now ONLINE & AVAILABLE for ride requests.`;
        break;
      }

      case 'OFFLINE': {
        driver.availability = DriverAvailability.OFFLINE;
        reply = `BAO BAO: Driver #${driver.driverCode} is now OFFLINE.`;
        break;
      }

      case 'LOCATION_ZONE': {
        const zoneInput = command.zoneCode || '';
        const zone = this.db.zones.find(
          (z) =>
            z.code.toUpperCase() === zoneInput.toUpperCase() ||
            z.name.toUpperCase().includes(zoneInput.toUpperCase()),
        );

        if (zone) {
          this.db.driverLocations.set(driver.id, {
            driverId: driver.id,
            lat: zone.lat,
            lng: zone.lng,
            trackingSource: TrackingSource.LAST_REPORTED,
            lastZoneId: zone.id,
            updatedAt: new Date().toISOString(),
          });
          reply = `BAO BAO: Location updated to zone [${zone.name}]. Tracking: LAST_REPORTED.`;
        } else {
          const availableZones = this.db.zones.map((z) => z.code).join(', ');
          reply = `BAO BAO: Unknown zone. Available zones: ${availableZones}`;
        }
        break;
      }

      case 'ARRIVED': {
        const activeRide = this.db.rideRequests.find(
          (r) => r.driverId === driver.id && r.status === RideStatus.DRIVER_EN_ROUTE || r.status === RideStatus.ACCEPTED,
        );
        if (!activeRide) {
          reply = 'BAO BAO: No active ride awaiting arrival.';
          break;
        }
        RideStateMachine.validate(activeRide.status, RideStatus.ARRIVED, ActorType.SMS);
        const fromStatus = activeRide.status;
        activeRide.status = RideStatus.ARRIVED;
        this.db.rideStatusHistory.push({
          id: `rsh-${Date.now()}`,
          rideId: activeRide.id,
          fromStatus,
          toStatus: RideStatus.ARRIVED,
          actorProfileId: null,
          actorType: ActorType.SMS,
          meta: { channel: 'SMS' },
          createdAt: new Date().toISOString(),
        });
        reply = `BAO BAO: Marked ARRIVED at pickup for ride #${activeRide.publicCode}. Passenger notified. Reply START once boarded.`;
        break;
      }

      case 'START': {
        const activeRide = this.db.rideRequests.find(
          (r) => r.driverId === driver.id && r.status === RideStatus.ARRIVED,
        );
        if (!activeRide) {
          reply = 'BAO BAO: No active ride ready to start.';
          break;
        }
        RideStateMachine.validate(activeRide.status, RideStatus.IN_PROGRESS, ActorType.SMS);
        activeRide.status = RideStatus.IN_PROGRESS;
        activeRide.pickedUpAt = new Date().toISOString();
        this.db.rideStatusHistory.push({
          id: `rsh-${Date.now()}`,
          rideId: activeRide.id,
          fromStatus: RideStatus.ARRIVED,
          toStatus: RideStatus.IN_PROGRESS,
          actorProfileId: null,
          actorType: ActorType.SMS,
          meta: { channel: 'SMS' },
          createdAt: new Date().toISOString(),
        });
        reply = `BAO BAO: Ride #${activeRide.publicCode} IN_PROGRESS to ${activeRide.destinationLabel}. Reply DONE upon drop-off.`;
        break;
      }

      case 'DONE': {
        const activeRide = this.db.rideRequests.find(
          (r) => r.driverId === driver.id && r.status === RideStatus.IN_PROGRESS,
        );
        if (!activeRide) {
          reply = 'BAO BAO: No active in-progress ride to complete.';
          break;
        }
        RideStateMachine.validate(activeRide.status, RideStatus.COMPLETED, ActorType.SMS);
        activeRide.status = RideStatus.COMPLETED;
        activeRide.completedAt = new Date().toISOString();
        driver.availability = DriverAvailability.AVAILABLE;
        this.db.rideStatusHistory.push({
          id: `rsh-${Date.now()}`,
          rideId: activeRide.id,
          fromStatus: RideStatus.IN_PROGRESS,
          toStatus: RideStatus.COMPLETED,
          actorProfileId: null,
          actorType: ActorType.SMS,
          meta: { channel: 'SMS' },
          createdAt: new Date().toISOString(),
        });
        reply = `BAO BAO: Ride #${activeRide.publicCode} COMPLETED! You are now AVAILABLE for new rides.`;
        break;
      }

      case 'HELP':
      default: {
        reply = 'BAO BAO Commands: 1 (accept), 2 (decline), ON (available), OFF (unavailable), AT <ZONE>, ARRIVED, START, DONE.';
        break;
      }
    }

    await this.smsProvider.sendSms(normalizedPhone, reply);
    return { reply, actionTaken };
  }

  async getSmsLogs(): Promise<any[]> {
    return [...this.db.smsMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async sendTestSms(to: string, message: string): Promise<any> {
    const res = await this.smsProvider.sendSms(to, message);
    this.db.smsMessages.push({
      id: `sms-test-${Date.now()}`,
      direction: SmsDirection.OUT,
      phoneNumber: to,
      body: message,
      rideOfferId: null,
      status: SmsStatus.SENT,
      providerMessageId: res.messageId,
      createdAt: new Date().toISOString(),
    });
    return res;
  }
}
