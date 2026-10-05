import { RideStatus, ActorType } from './enums.js';

export interface TransitionRule {
  from: RideStatus;
  to: RideStatus;
  allowedActors: ActorType[];
}

export const ALLOWED_TRANSITIONS: TransitionRule[] = [
  {
    from: RideStatus.REQUESTED,
    to: RideStatus.DISPATCHING,
    allowedActors: [ActorType.SYSTEM],
  },
  {
    from: RideStatus.DISPATCHING,
    to: RideStatus.OFFERED,
    allowedActors: [ActorType.SYSTEM],
  },
  {
    from: RideStatus.OFFERED,
    to: RideStatus.ACCEPTED,
    allowedActors: [ActorType.DRIVER, ActorType.DISPATCHER, ActorType.SMS],
  },
  {
    from: RideStatus.OFFERED,
    to: RideStatus.DISPATCHING,
    allowedActors: [ActorType.SYSTEM],
  },
  {
    from: RideStatus.DISPATCHING,
    to: RideStatus.NO_DRIVER_FOUND,
    allowedActors: [ActorType.SYSTEM],
  },
  {
    from: RideStatus.ACCEPTED,
    to: RideStatus.DRIVER_EN_ROUTE,
    allowedActors: [ActorType.DRIVER, ActorType.DISPATCHER, ActorType.SYSTEM],
  },
  {
    from: RideStatus.DRIVER_EN_ROUTE,
    to: RideStatus.ARRIVED,
    allowedActors: [ActorType.DRIVER, ActorType.DISPATCHER, ActorType.SMS],
  },
  {
    from: RideStatus.ARRIVED,
    to: RideStatus.IN_PROGRESS,
    allowedActors: [ActorType.DRIVER, ActorType.DISPATCHER, ActorType.SMS],
  },
  {
    from: RideStatus.IN_PROGRESS,
    to: RideStatus.COMPLETED,
    allowedActors: [ActorType.DRIVER, ActorType.DISPATCHER, ActorType.SMS],
  },
  // Any pre-IN_PROGRESS -> CANCELLED
  {
    from: RideStatus.REQUESTED,
    to: RideStatus.CANCELLED,
    allowedActors: [ActorType.PASSENGER, ActorType.ADMIN, ActorType.DISPATCHER],
  },
  {
    from: RideStatus.DISPATCHING,
    to: RideStatus.CANCELLED,
    allowedActors: [ActorType.PASSENGER, ActorType.ADMIN, ActorType.DISPATCHER],
  },
  {
    from: RideStatus.OFFERED,
    to: RideStatus.CANCELLED,
    allowedActors: [ActorType.PASSENGER, ActorType.ADMIN, ActorType.DISPATCHER],
  },
  {
    from: RideStatus.ACCEPTED,
    to: RideStatus.CANCELLED,
    allowedActors: [ActorType.PASSENGER, ActorType.ADMIN, ActorType.DISPATCHER],
  },
  {
    from: RideStatus.DRIVER_EN_ROUTE,
    to: RideStatus.CANCELLED,
    allowedActors: [ActorType.PASSENGER, ActorType.ADMIN, ActorType.DISPATCHER],
  },
  // Overall TTL reached
  {
    from: RideStatus.REQUESTED,
    to: RideStatus.EXPIRED,
    allowedActors: [ActorType.SYSTEM],
  },
  {
    from: RideStatus.DISPATCHING,
    to: RideStatus.EXPIRED,
    allowedActors: [ActorType.SYSTEM],
  },
  // Passenger retry
  {
    from: RideStatus.NO_DRIVER_FOUND,
    to: RideStatus.REQUESTED,
    allowedActors: [ActorType.PASSENGER],
  },
];

export function isAllowedTransition(
  from: RideStatus,
  to: RideStatus,
  actor: ActorType,
): boolean {
  return ALLOWED_TRANSITIONS.some(
    (rule) =>
      rule.from === from &&
      rule.to === to &&
      rule.allowedActors.includes(actor),
  );
}
