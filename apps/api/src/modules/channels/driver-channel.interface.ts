import { DriverChannel } from '@bao-bao/shared';

export interface DriverChannelAdapter {
  readonly type: DriverChannel;
  sendOffer(offer: any, ride: any, driver: any): Promise<void>;
  sendRideUpdate(driverId: string, ride: any, event: string): Promise<void>;
}
