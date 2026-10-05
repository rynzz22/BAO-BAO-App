import { Controller, Get, Query, ParseFloatPipe, DefaultValuePipe, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@ApiTags('Location')
@Controller('vehicles')
export class LocationController {
  constructor(@Inject(LocationService) private readonly locationService: LocationService) {}

  @Get('nearby')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Nearby available vehicles with tracking_source & location_updated_at',
    description:
      'Queries nearby drivers within radius using distance calculations, applying location freshness rules (LIVE_APP older than 2 minutes downgraded to LAST_REPORTED).',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in meters (default: 3000)' })
  @ApiResponse({ status: 200, description: 'List of nearby available vehicles with tracking freshness badges' })
  async getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new DefaultValuePipe(3000), ParseFloatPipe) radius: number,
  ) {
    return this.locationService.getNearbyVehicles(lat, lng, radius);
  }
}
