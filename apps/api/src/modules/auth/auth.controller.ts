import { Controller, Post, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthSyncDto, ProfileDto } from '@bao-bao/shared';

@ApiTags('Auth & Profile')
@Controller('auth')
export class AuthController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Post('sync')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or synchronize profile in database after Supabase Auth',
    description: 'Ensures a profiles table row exists for the Supabase user ID with role and settings.',
  })
  @ApiResponse({ status: 200, description: 'Profile synchronized' })
  async syncProfile(
    @CurrentUser() user: ProfileDto,
    @Body() dto: AuthSyncDto,
  ) {
    return this.usersService.syncProfile(user.id, dto);
  }
}
