import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { HealthController } from './health.controller';
import { AuthController } from './modules/auth/auth.controller';
import { UsersController } from './modules/users/users.controller';
import { UsersService } from './modules/users/users.service';
import { ZonesController } from './modules/zones/zones.controller';
import { LocationController } from './modules/location/location.controller';
import { LocationService } from './modules/location/location.service';
import { RidesController } from './modules/rides/rides.controller';
import { RidesService } from './modules/rides/rides.service';
import { DriversController } from './modules/drivers/drivers.controller';
import { DriversService } from './modules/drivers/drivers.service';
import { SmsController } from './modules/sms/sms.controller';
import { SmsService, ConsoleSmsProvider } from './modules/sms/sms.service';
import { DispatcherController } from './modules/dispatcher/dispatcher.controller';
import { DispatcherService } from './modules/dispatcher/dispatcher.service';
import { AdminController } from './modules/admin/admin.controller';
import { AdminService } from './modules/admin/admin.service';

import { DatabaseService } from './modules/database/database.service';
import { ChannelsService, AppChannel, SmsChannel, DispatcherChannel } from './modules/channels/channels.service';
import { DispatchService } from './modules/dispatch/dispatch.service';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    ZonesController,
    LocationController,
    RidesController,
    DriversController,
    SmsController,
    DispatcherController,
    AdminController,
  ],
  providers: [
    DatabaseService,
    AppChannel,
    SmsChannel,
    DispatcherChannel,
    ChannelsService,
    DispatchService,
    RidesService,
    DriversService,
    LocationService,
    ConsoleSmsProvider,
    SmsService,
    UsersService,
    DispatcherService,
    AdminService,
    SupabaseAuthGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [DatabaseService, DispatchService, RidesService],
})
export class AppModule {}
