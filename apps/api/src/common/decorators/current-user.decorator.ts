import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProfileDto } from '@bao-bao/shared';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ProfileDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
