import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ProfileDto,
  RegisterDriverDto,
  UpdateDriverStatusDto,
  DriverLocationUpdateDto,
  UserRole,
  RideStatus,
} from '@bao-bao/shared';

@ApiTags('Driver (App Channel)')
@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DriversController {
  constructor(@Inject(DriversService) private readonly driversService: DriversService) {}

  @Post('drivers/register')
  @ApiOperation({ summary: 'Submit driver profile + vehicle for approval' })
  async register(
    @CurrentUser() user: ProfileDto,
    @Body() dto: RegisterDriverDto,
  ) {
    return this.driversService.registerDriver(user, dto);
  }

  @Get('driver/me')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Driver profile, vehicle, and current status' })
  async getMe(@CurrentUser() user: ProfileDto) {
    return this.driversService.getDriverForUser(user.id);
  }

  @Post('driver/status')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle driver availability (AVAILABLE / OFFLINE)' })
  async updateStatus(
    @CurrentUser() user: ProfileDto,
    @Body() dto: UpdateDriverStatusDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateStatus(driver.id, dto);
  }

  @Post('driver/location')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update driver live GPS location',
    description: 'Sets tracking_source to LIVE_APP and refreshes timestamp',
  })
  async updateLocation(
    @CurrentUser() user: ProfileDto,
    @Body() dto: DriverLocationUpdateDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateLocation(driver.id, dto);
  }

  @Get('driver/offers')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Pending ride offers for driver' })
  async getOffers(@CurrentUser() user: ProfileDto) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.getOffers(driver.id);
  }

  @Post('driver/offers/:id/accept')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept ride offer (concurrency-locked)' })
  async acceptOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    return this.driversService.acceptOffer(offerId, user.id);
  }

  @Post('driver/offers/:id/decline')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline ride offer' })
  async declineOffer(
    @Param('id') offerId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    return this.driversService.declineOffer(offerId, user.id);
  }

  @Post('driver/rides/:id/en-route')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Heading to pickup location' })
  async enRoute(
    @Param('id') rideId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateRideStatus(
      driver.id,
      rideId,
      RideStatus.DRIVER_EN_ROUTE,
      user.id,
    );
  }

  @Post('driver/rides/:id/arrived')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arrived at pickup point' })
  async arrived(
    @Param('id') rideId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateRideStatus(
      driver.id,
      rideId,
      RideStatus.ARRIVED,
      user.id,
    );
  }

  @Post('driver/rides/:id/start')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Passenger boarded, start ride' })
  async startRide(
    @Param('id') rideId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateRideStatus(
      driver.id,
      rideId,
      RideStatus.IN_PROGRESS,
      user.id,
    );
  }

  @Post('driver/rides/:id/complete')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trip completed, dropped off passenger' })
  async completeRide(
    @Param('id') rideId: string,
    @CurrentUser() user: ProfileDto,
  ) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.updateRideStatus(
      driver.id,
      rideId,
      RideStatus.COMPLETED,
      user.id,
    );
  }

  @Get('driver/rides')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Driver ride history' })
  async getDriverRides(@CurrentUser() user: ProfileDto) {
    const driver = await this.driversService.getDriverForUser(user.id);
    return this.driversService.getDriverRides(driver.id);
  }
}
