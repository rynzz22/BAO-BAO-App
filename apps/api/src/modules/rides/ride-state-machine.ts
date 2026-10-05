import { RideStatus, ActorType, isAllowedTransition } from '@bao-bao/shared';
import { ConflictException } from '@nestjs/common';

export class InvalidTransitionError extends ConflictException {
  constructor(from: RideStatus, to: RideStatus, actor: ActorType) {
    super({
      statusCode: 409,
      code: 'RIDE_INVALID_TRANSITION',
      message: `Invalid transition from ${from} to ${to} for actor ${actor}`,
    });
  }
}

export class RideStateMachine {
  private currentStatus: RideStatus;

  constructor(initialStatus: RideStatus = RideStatus.REQUESTED) {
    this.currentStatus = initialStatus;
  }

  public getStatus(): RideStatus {
    return this.currentStatus;
  }

  public canTransition(to: RideStatus, actor: ActorType): boolean {
    return isAllowedTransition(this.currentStatus, to, actor);
  }

  public transition(to: RideStatus, actor: ActorType): RideStatus {
    if (!this.canTransition(to, actor)) {
      throw new InvalidTransitionError(this.currentStatus, to, actor);
    }
    this.currentStatus = to;
    return this.currentStatus;
  }

  public static validate(from: RideStatus, to: RideStatus, actor: ActorType): void {
    if (!isAllowedTransition(from, to, actor)) {
      throw new InvalidTransitionError(from, to, actor);
    }
  }
}
