import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService, calculateDistanceMeters } from '../database/database.service';
import { calculateLocationFreshness } from './location-freshness';
import { NearbyVehicleDto, DriverAvailability, ApprovalStatus } from '@bao-bao/shared';

@Injectable()
export class LocationService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async getNearbyVehicles(
    lat: number,
    lng: number,
    radiusMeters: number = 3000,
  ): Promise<NearbyVehicleDto[]> {
    const nearby: NearbyVehicleDto[] = [];
    const now = new Date();

    for (const driver of this.db.drivers) {
      if (driver.approvalStatus !== ApprovalStatus.APPROVED) continue;
      if (driver.availability !== DriverAvailability.AVAILABLE) continue;

      const loc = this.db.driverLocations.get(driver.id);
      if (!loc) continue;

      // Freshness check: Downgrades LIVE_APP older than 2 minutes to LAST_REPORTED.
      // If older than 30 minutes, hidden from map.
      const freshness = calculateLocationFreshness(loc.trackingSource, loc.updatedAt, now);
      if (freshness.isHidden) continue;

      const distance = calculateDistanceMeters(lat, lng, loc.lat, loc.lng);
      if (distance <= radiusMeters) {
        const dv = this.db.driverVehicles.find(
          (rel) => rel.driverId === driver.id && rel.isCurrent,
        );
        const vehicle = dv ? this.db.vehicles.find((v) => v.id === dv.vehicleId) : null;
        const vType = vehicle
          ? this.db.vehicleTypes.find((vt) => vt.id === vehicle.vehicleTypeId)
          : null;

        nearby.push({
          driverId: driver.id,
          driverCode: driver.driverCode,
          driverName: driver.fullName,
          channel: driver.primaryChannel,
          vehicleType: vType?.code || 'TRICYCLE',
          plateOrBodyNo: vehicle?.plateOrBodyNo || 'N/A',
          capacity: vehicle?.capacity || 3,
          lat: loc.lat,
          lng: loc.lng,
          trackingSource: freshness.effectiveSource,
          locationUpdatedAt: loc.updatedAt,
          distanceMeters: distance,
        });
      }
    }

    return nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
}
