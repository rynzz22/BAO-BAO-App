import { Injectable, Logger, Inject } from '@nestjs/common';
import { DriverChannel, SmsDirection, SmsStatus } from '@bao-bao/shared';
import { DriverChannelAdapter } from './driver-channel.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AppChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.APP;
  private readonly logger = new Logger(AppChannel.name);

  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    this.logger.log(
      `[APP CHANNEL] Pushed offer ${offer.id} to App Driver ${driver.driverCode} (${driver.fullName}) for ride #${ride.publicCode}`,
    );
  }

  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    this.logger.log(`[APP CHANNEL] Ride #${ride.publicCode} update: ${event} -> driver ${driverId}`);
  }
}

@Injectable()
export class SmsChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.SMS;
  private readonly logger = new Logger(SmsChannel.name);

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    const body = `BAO BAO REQUEST #${ride.publicCode}: ${ride.passengerCount} pax from ${ride.pickupLabel} to ${ride.destinationLabel}. Reply 1 to accept or 2 to decline.`;
    this.logger.log(`[SMS CHANNEL] Outbound SMS to ${driver.phoneNumber}: "${body}"`);

    // Persist SMS record in sms_messages table
    this.db.smsMessages.push({
      id: `sms-${Date.now()}`,
      direction: SmsDirection.OUT,
      phoneNumber: driver.phoneNumber || 'UNKNOWN',
      body,
      rideOfferId: offer.id,
      status: SmsStatus.SENT,
      providerMessageId: `mock-msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    const driver = this.db.drivers.find((d) => d.id === driverId);
    if (!driver || !driver.phoneNumber) return;

    const body = `BAO BAO UPDATE: Ride #${ride.publicCode} status changed to ${event}.`;
    this.logger.log(`[SMS CHANNEL] Notification SMS to ${driver.phoneNumber}: "${body}"`);

    this.db.smsMessages.push({
      id: `sms-${Date.now()}`,
      direction: SmsDirection.OUT,
      phoneNumber: driver.phoneNumber,
      body,
      rideOfferId: null,
      status: SmsStatus.SENT,
      providerMessageId: `mock-msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }
}

@Injectable()
export class DispatcherChannel implements DriverChannelAdapter {
  readonly type = DriverChannel.DISPATCHER;
  private readonly logger = new Logger(DispatcherChannel.name);

  async sendOffer(offer: any, ride: any, driver: any): Promise<void> {
    this.logger.log(
      `[DISPATCHER CHANNEL] Routed offer ${offer.id} for ride #${ride.publicCode} to Terminal Console for Driver ${driver.driverCode} (${driver.fullName})`,
    );
  }

  async sendRideUpdate(driverId: string, ride: any, event: string): Promise<void> {
    this.logger.log(
      `[DISPATCHER CHANNEL] Ride #${ride.publicCode} status changed to ${event} for terminal driver ${driverId}`,
    );
  }
}

@Injectable()
export class ChannelsService {
  private adapters: Map<DriverChannel, DriverChannelAdapter> = new Map();

  constructor(
    @Inject(AppChannel) private readonly appAdapter: AppChannel,
    @Inject(SmsChannel) private readonly smsAdapter: SmsChannel,
    @Inject(DispatcherChannel) private readonly dispatcherAdapter: DispatcherChannel,
  ) {
    this.adapters.set(DriverChannel.APP, this.appAdapter);
    this.adapters.set(DriverChannel.SMS, this.smsAdapter);
    this.adapters.set(DriverChannel.DISPATCHER, this.dispatcherAdapter);
  }

  getAdapter(channel: DriverChannel): DriverChannelAdapter {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`No adapter found for driver channel: ${channel}`);
    }
    return adapter;
  }
}
