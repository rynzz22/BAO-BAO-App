import {
  RideStatus,
  DriverChannel,
  TrackingSource,
  ApprovalStatus,
  DriverAvailability,
  OfferStatus,
  UserRole,
  ActorType,
  ZoneType,
  IncidentStatus,
} from './enums.js';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ProfileDto {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  role: UserRole;
  preferredLanguage: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthSyncDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  role?: UserRole;
  preferredLanguage?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  preferredLanguage?: string;
}

export interface DriverDto {
  id: string;
  profileId: string | null;
  fullName: string;
  phoneNumber: string | null;
  licenseNo: string;
  primaryChannel: DriverChannel;
  approvalStatus: ApprovalStatus;
  availability: DriverAvailability;
  driverCode: string;
  homeTerminalId: string | null;
  createdAt: string;
  vehicle?: VehicleDto | null;
  currentLocation?: DriverLocationDto | null;
}

export interface RegisterDriverDto {
  fullName: string;
  phoneNumber?: string;
  licenseNo: string;
  vehicleTypeId: string;
  plateOrBodyNo: string;
  capacity?: number;
  homeTerminalId?: string;
}

export interface UpdateDriverStatusDto {
  availability: DriverAvailability;
}

export interface DriverLocationUpdateDto {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
}

export interface DriverLocationDto {
  driverId: string;
  lat: number;
  lng: number;
  trackingSource: TrackingSource;
  lastZoneId: string | null;
  updatedAt: string;
}

export interface NearbyVehicleDto {
  driverId: string;
  driverCode: string;
  driverName: string;
  channel: DriverChannel;
  vehicleType: string;
  plateOrBodyNo: string;
  capacity: number;
  lat: number;
  lng: number;
  trackingSource: TrackingSource;
  locationUpdatedAt: string;
  distanceMeters: number;
}

export interface VehicleTypeDto {
  id: string;
  code: string;
  name: string;
  defaultCapacity: number;
}

export interface VehicleDto {
  id: string;
  vehicleTypeId: string;
  vehicleTypeCode?: string;
  plateOrBodyNo: string;
  capacity: number;
  approvalStatus: ApprovalStatus;
  photoUrl: string | null;
  isActive: boolean;
}

export interface CreateRideDto {
  pickup: {
    lat: number;
    lng: number;
    label: string;
    zoneId?: string;
  };
  destination: {
    lat: number;
    lng: number;
    label: string;
  };
  passengerCount: number;
  notes?: string;
}

export interface RideOfferDto {
  id: string;
  rideId: string;
  driverId: string;
  channel: DriverChannel;
  status: OfferStatus;
  sequence: number;
  offeredAt: string;
  expiresAt: string;
  respondedAt: string | null;
  ride?: RideDto;
}

export interface RideStatusHistoryDto {
  id: string;
  rideId: string;
  fromStatus: RideStatus | null;
  toStatus: RideStatus;
  actorProfileId: string | null;
  actorType: ActorType;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

export interface RideDto {
  id: string;
  publicCode: string;
  passengerId: string;
  passengerName?: string;
  passengerCount: number;
  pickupPoint: GeoPoint;
  pickupLabel: string;
  pickupZoneId: string | null;
  destinationPoint: GeoPoint;
  destinationLabel: string;
  status: RideStatus;
  driverId: string | null;
  driverName?: string | null;
  driverCode?: string | null;
  driverChannel?: DriverChannel | null;
  vehicleId: string | null;
  vehicleBodyNo?: string | null;
  vehicleType?: string | null;
  channelUsed: string | null;
  etaMinutes: number | null;
  cancelReason: string | null;
  requestedAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  driverLocation?: {
    lat: number;
    lng: number;
    trackingSource: TrackingSource;
    updatedAt: string;
  } | null;
  history?: RideStatusHistoryDto[];
}

export interface CancelRideDto {
  reason: string;
}

export interface RateRideDto {
  score: number;
  comment?: string;
}

export interface ReportIncidentDto {
  category: string;
  description: string;
}

export interface ZoneDto {
  id: string;
  code: string;
  name: string;
  zoneType: ZoneType;
  center: GeoPoint;
  isActive: boolean;
}

export interface TerminalDto {
  id: string;
  name: string;
  zoneId: string | null;
  center: GeoPoint;
  isActive: boolean;
}

export interface TerminalQueueEntryDto {
  id: string;
  terminalId: string;
  driverId: string;
  driverName: string;
  driverCode: string;
  channel: DriverChannel;
  position: number;
  checkedInAt: string;
  checkedOutAt: string | null;
}

export interface InboundSmsWebhookDto {
  from: string;
  body: string;
  timestamp?: string;
  signature?: string;
}

export interface AdminDashboardStatsDto {
  activeDrivers: number;
  activeVehicles: number;
  ridesToday: number;
  pendingRequests: number;
  activeRides: number;
  acceptanceRateByChannel: Record<DriverChannel, number>;
}
