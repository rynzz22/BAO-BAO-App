import { DatabaseService } from '../src/modules/database/database.service';
import { ChannelsService, AppChannel, SmsChannel, DispatcherChannel } from '../src/modules/channels/channels.service';
import { DispatchService } from '../src/modules/dispatch/dispatch.service';
import { RidesService } from '../src/modules/rides/rides.service';
import { RideStatus, UserRole, ActorType } from '@bao-bao/shared';
import { ConflictException } from '@nestjs/common';

describe('E2E Ride Dispatch & Acceptance Flow', () => {
  let db: DatabaseService;
  let channelsService: ChannelsService;
  let dispatchService: DispatchService;
  let ridesService: RidesService;

  beforeEach(() => {
    db = new DatabaseService();
    db.seedInitialData();

    const appChannel = new AppChannel();
    const smsChannel = new SmsChannel(db);
    const dispChannel = new DispatcherChannel();
    channelsService = new ChannelsService(appChannel, smsChannel, dispChannel);

    dispatchService = new DispatchService(db, channelsService);
    ridesService = new RidesService(db, dispatchService);
  });

  it('create ride -> dispatch creates offer -> app driver accepts -> ride is ACCEPTED, second accept throws OFFER_ALREADY_TAKEN', async () => {
    // 1. Passenger submits ride request
    const passenger = {
      id: '44444444-4444-4444-4444-444444444404',
      fullName: 'Ana Passenger',
      email: 'ana@baobao.local',
      phoneNumber: '+639000000088',
      role: UserRole.PASSENGER,
      preferredLanguage: 'en',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const rideDto = {
      pickup: {
        lat: 10.1503,
        lng: 124.3305,
        label: 'Poblacion Plaza',
      },
      destination: {
        lat: 10.1531,
        lng: 124.335,
        label: 'Talibon Public Market',
      },
      passengerCount: 2,
    };

    const createdRide = await ridesService.createRide(passenger, rideDto);
    expect(createdRide.status).toBe(RideStatus.REQUESTED);
    expect(createdRide.publicCode).toBeDefined();

    // 2. Dispatch engine triggers dispatch
    const dispatched = await dispatchService.dispatch(createdRide.id);
    expect(dispatched).toBe(true);

    const rideAfterDispatch = db.rideRequests.find((r) => r.id === createdRide.id);
    expect(rideAfterDispatch?.status).toBe(RideStatus.OFFERED);

    // Verify an offer was created
    const offer = db.rideOffers.find((o) => o.rideId === createdRide.id);
    expect(offer).toBeDefined();
    expect(offer?.status).toBe('PENDING');

    // 3. Driver accepts offer
    const acceptRes = await dispatchService.acceptOffer(offer!.id, offer!.driverId, ActorType.DRIVER);
    expect(acceptRes.success).toBe(true);
    expect(acceptRes.status).toBe(RideStatus.ACCEPTED);

    const acceptedRide = db.rideRequests.find((r) => r.id === createdRide.id);
    expect(acceptedRide?.status).toBe(RideStatus.ACCEPTED);
    expect(acceptedRide?.driverId).toBe(offer!.driverId);

    // 4. Second acceptance attempt fails with OFFER_ALREADY_TAKEN (ConflictException 409)
    await expect(
      dispatchService.acceptOffer(offer!.id, 'some-other-driver', ActorType.DRIVER),
    ).rejects.toThrow(ConflictException);

    try {
      await dispatchService.acceptOffer(offer!.id, 'some-other-driver', ActorType.DRIVER);
    } catch (err: any) {
      expect(err.getStatus()).toBe(409);
      expect(err.getResponse().code).toBe('OFFER_ALREADY_TAKEN');
    }
  });
});
