import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'List all pickup zones, terminals, and coverage areas in Talibon' })
  @ApiResponse({ status: 200, description: 'List of active zones' })
  async getZones() {
    return this.db.zones.filter((z) => z.isActive);
  }
}
