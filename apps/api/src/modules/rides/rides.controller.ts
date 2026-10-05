import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateRideDto,
  CancelRideDto,
  RateRideDto,
  ReportIncidentDto,
  ProfileDto,
} from '@bao-bao/shared';

@ApiTags('Rides (Passenger)')
@Controller('rides')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class RidesController {
  constructor(@Inject(RidesService) private readonly ridesService: RidesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ride request' })
  @ApiResponse({ status: 201, description: 'Ride request created and dispatch initiated' })
  @ApiResponse({ status: 409, description: 'RIDE_ACTIVE_EXISTS: Passenger already has an active ride' })
  async createRide(
    @CurrentUser() passenger: ProfileDto,
    @Body() dto: CreateRideDto,
  ) {
    return this.ridesService.createRide(passenger, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active ride for passenger' })
  @ApiResponse({ status: 200, description: 'Current active ride or null' })
  async getActiveRide(@CurrentUser() passenger: ProfileDto) {
    return this.ridesService.getActiveRide(passenger.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride detail by ID' })
  @ApiResponse({ status: 200, description: 'Ride details (phone numbers redacted for passenger)' })
  async getRideById(
    @Param('id') id: string,
    @CurrentUser() user: ProfileDto,
  ) {
    return this.ridesService.getRideById(id, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get ride history for current passenger' })
  async getRideHistory(@CurrentUser() passenger: ProfileDto) {
    return this.ridesService.getRideHistory(passenger.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel ride request' })
  async cancelRide(
    @Param('id') id: string,
    @CurrentUser() actor: ProfileDto,
    @Body() dto: CancelRideDto,
  ) {
    return this.ridesService.cancelRide(id, actor, dto);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-request after NO_DRIVER_FOUND' })
  async retryRide(
    @Param('id') id: string,
    @CurrentUser() actor: ProfileDto,
  ) {
    return this.ridesService.retryRide(id, actor);
  }

  @Post(':id/rating')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Rate completed ride' })
  async rateRide(
    @Param('id') id: string,
    @CurrentUser() passenger: ProfileDto,
    @Body() dto: RateRideDto,
  ) {
    return this.ridesService.rateRide(id, passenger.id, dto);
  }

  @Post(':id/report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report incident on ride' })
  async reportIncident(
    @Param('id') id: string,
    @CurrentUser() reporter: ProfileDto,
    @Body() dto: ReportIncidentDto,
  ) {
    return this.ridesService.reportIncident(id, reporter.id, dto);
  }
}
