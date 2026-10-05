export enum RideStatus {
  REQUESTED = 'REQUESTED',
  DISPATCHING = 'DISPATCHING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  NO_DRIVER_FOUND = 'NO_DRIVER_FOUND',
}

export enum DriverChannel {
  APP = 'APP',
  SMS = 'SMS',
  DISPATCHER = 'DISPATCHER',
}

export enum TrackingSource {
  LIVE_APP = 'LIVE_APP',
  LAST_REPORTED = 'LAST_REPORTED',
  TERMINAL = 'TERMINAL',
  GPS_TRACKER = 'GPS_TRACKER',
  UNKNOWN = 'UNKNOWN',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum DriverAvailability {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN',
}

export enum ActorType {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  SMS = 'SMS',
}

export enum ZoneType {
  PICKUP = 'PICKUP',
  TERMINAL = 'TERMINAL',
  AREA = 'AREA',
}

export enum SmsDirection {
  OUT = 'OUT',
  IN = 'IN',
}

export enum SmsStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
}
