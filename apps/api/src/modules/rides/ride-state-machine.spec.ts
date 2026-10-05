import { RideStatus, ActorType } from '@bao-bao/shared';
import { RideStateMachine, InvalidTransitionError } from './ride-state-machine';

describe('RideStateMachine', () => {
  it('should initialize with REQUESTED by default', () => {
    const sm = new RideStateMachine();
    expect(sm.getStatus()).toBe(RideStatus.REQUESTED);
  });

  describe('Allowed transitions', () => {
    it('REQUESTED -> DISPATCHING by SYSTEM', () => {
      const sm = new RideStateMachine(RideStatus.REQUESTED);
      expect(sm.canTransition(RideStatus.DISPATCHING, ActorType.SYSTEM)).toBe(true);
      sm.transition(RideStatus.DISPATCHING, ActorType.SYSTEM);
      expect(sm.getStatus()).toBe(RideStatus.DISPATCHING);
    });

    it('DISPATCHING -> OFFERED by SYSTEM', () => {
      const sm = new RideStateMachine(RideStatus.DISPATCHING);
      sm.transition(RideStatus.OFFERED, ActorType.SYSTEM);
      expect(sm.getStatus()).toBe(RideStatus.OFFERED);
    });

    it('OFFERED -> ACCEPTED by DRIVER, DISPATCHER, and SMS', () => {
      let sm = new RideStateMachine(RideStatus.OFFERED);
      sm.transition(RideStatus.ACCEPTED, ActorType.DRIVER);
      expect(sm.getStatus()).toBe(RideStatus.ACCEPTED);

      sm = new RideStateMachine(RideStatus.OFFERED);
      sm.transition(RideStatus.ACCEPTED, ActorType.DISPATCHER);
      expect(sm.getStatus()).toBe(RideStatus.ACCEPTED);

      sm = new RideStateMachine(RideStatus.OFFERED);
      sm.transition(RideStatus.ACCEPTED, ActorType.SMS);
      expect(sm.getStatus()).toBe(RideStatus.ACCEPTED);
    });

    it('Full lifecycle: ACCEPTED -> DRIVER_EN_ROUTE -> ARRIVED -> IN_PROGRESS -> COMPLETED', () => {
      const sm = new RideStateMachine(RideStatus.ACCEPTED);
      sm.transition(RideStatus.DRIVER_EN_ROUTE, ActorType.DRIVER);
      expect(sm.getStatus()).toBe(RideStatus.DRIVER_EN_ROUTE);

      sm.transition(RideStatus.ARRIVED, ActorType.DRIVER);
      expect(sm.getStatus()).toBe(RideStatus.ARRIVED);

      sm.transition(RideStatus.IN_PROGRESS, ActorType.DRIVER);
      expect(sm.getStatus()).toBe(RideStatus.IN_PROGRESS);

      sm.transition(RideStatus.COMPLETED, ActorType.DRIVER);
      expect(sm.getStatus()).toBe(RideStatus.COMPLETED);
    });

    it('Cancellation pre-IN_PROGRESS by PASSENGER', () => {
      const preTripStatuses = [
        RideStatus.REQUESTED,
        RideStatus.DISPATCHING,
        RideStatus.OFFERED,
        RideStatus.ACCEPTED,
        RideStatus.DRIVER_EN_ROUTE,
      ];

      for (const st of preTripStatuses) {
        const sm = new RideStateMachine(st);
        expect(sm.canTransition(RideStatus.CANCELLED, ActorType.PASSENGER)).toBe(true);
        sm.transition(RideStatus.CANCELLED, ActorType.PASSENGER);
        expect(sm.getStatus()).toBe(RideStatus.CANCELLED);
      }
    });

    it('Retry from NO_DRIVER_FOUND by PASSENGER', () => {
      const sm = new RideStateMachine(RideStatus.NO_DRIVER_FOUND);
      sm.transition(RideStatus.REQUESTED, ActorType.PASSENGER);
      expect(sm.getStatus()).toBe(RideStatus.REQUESTED);
    });

    it('Expiration from DISPATCHING by SYSTEM', () => {
      const sm = new RideStateMachine(RideStatus.DISPATCHING);
      sm.transition(RideStatus.EXPIRED, ActorType.SYSTEM);
      expect(sm.getStatus()).toBe(RideStatus.EXPIRED);
    });
  });

  describe('Disallowed transitions (Must throw InvalidTransitionError)', () => {
    it('Cannot transition REQUESTED -> ACCEPTED directly', () => {
      const sm = new RideStateMachine(RideStatus.REQUESTED);
      expect(() => sm.transition(RideStatus.ACCEPTED, ActorType.DRIVER)).toThrow(
        InvalidTransitionError,
      );
    });

    it('Passenger cannot accept an offer', () => {
      const sm = new RideStateMachine(RideStatus.OFFERED);
      expect(() => sm.transition(RideStatus.ACCEPTED, ActorType.PASSENGER)).toThrow(
        InvalidTransitionError,
      );
    });

    it('Passenger cannot cancel IN_PROGRESS ride', () => {
      const sm = new RideStateMachine(RideStatus.IN_PROGRESS);
      expect(sm.canTransition(RideStatus.CANCELLED, ActorType.PASSENGER)).toBe(false);
      expect(() => sm.transition(RideStatus.CANCELLED, ActorType.PASSENGER)).toThrow(
        InvalidTransitionError,
      );
    });

    it('Completed ride cannot transition to any status', () => {
      const sm = new RideStateMachine(RideStatus.COMPLETED);
      expect(() => sm.transition(RideStatus.REQUESTED, ActorType.PASSENGER)).toThrow(
        InvalidTransitionError,
      );
      expect(() => sm.transition(RideStatus.CANCELLED, ActorType.ADMIN)).toThrow(
        InvalidTransitionError,
      );
    });

    it('Driver cannot trigger system timeouts', () => {
      const sm = new RideStateMachine(RideStatus.DISPATCHING);
      expect(() => sm.transition(RideStatus.EXPIRED, ActorType.DRIVER)).toThrow(
        InvalidTransitionError,
      );
    });
  });
});
