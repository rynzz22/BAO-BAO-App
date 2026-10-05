import {
  Controller,
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
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  ApprovalStatus,
  DriverChannel,
  ProfileDto,
} from '@bao-bao/shared';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin KPI summary metrics' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('drivers')
  @ApiOperation({ summary: 'List all drivers with channel and status' })
  async getDrivers() {
    return this.adminService.getDrivers();
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver details' })
  async getDriverById(@Param('id') id: string) {
    return this.adminService.getDriverById(id);
  }

  @Patch('drivers/:id/approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, suspend, or reject a driver' })
  async updateDriverApproval(
    @Param('id') id: string,
    @Body() body: { status: ApprovalStatus },
    @CurrentUser() adminUser: ProfileDto,
  ) {
    return this.adminService.updateDriverApproval(id, body.status, adminUser);
  }

  @Patch('drivers/:id/channel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change primary driver channel (APP, SMS, DISPATCHER)' })
  async updateDriverChannel(
    @Param('id') id: string,
    @Body() body: { channel: DriverChannel },
    @CurrentUser() adminUser: ProfileDto,
  ) {
    return this.adminService.updateDriverChannel(id, body.channel, adminUser);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List all vehicles' })
  async getVehicles() {
    return this.adminService.getVehicles();
  }

  @Patch('vehicles/:id/approval')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or suspend a vehicle' })
  async updateVehicleApproval(
    @Param('id') id: string,
    @Body() body: { status: ApprovalStatus },
  ) {
    return this.adminService.updateVehicleApproval(id, body.status);
  }

  @Get('rides')
  @ApiOperation({ summary: 'All ride requests' })
  async getRides() {
    return this.adminService.getAllRides();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Audit trail of administrative actions' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }
}
