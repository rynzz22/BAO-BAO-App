import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto, ProfileDto } from '@bao-bao/shared';

@ApiTags('User Profile')
@Controller('me')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile and role' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getMe(@CurrentUser() user: ProfileDto) {
    return this.usersService.getMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile details' })
  async updateMe(
    @CurrentUser() user: ProfileDto,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate own account' })
  async deactivateMe(@CurrentUser() user: ProfileDto) {
    return this.usersService.deactivateMe(user.id);
  }
}
