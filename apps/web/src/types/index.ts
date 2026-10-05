// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 'PASSENGER' | 'DRIVER' | 'DISPATCHER' | 'ADMIN'
export type DriverChannel = 'APP' | 'SMS' | 'DISPATCHER'
export type TrackingSource = 'LIVE_APP' | 'LAST_REPORTED' | 'TERMINAL' | 'GPS_TRACKER' | 'UNKNOWN'
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED'
export type DriverAvailability = 'OFFLINE' | 'AVAILABLE' | 'BUSY'
export type RideStatus =
  | 'REQUESTED'
  | 'DISPATCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'DRIVER_EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_DRIVER_FOUND'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED'
export type ZoneType = 'PICKUP' | 'TERMINAL' | 'AREA'

// ─── Core Entities ───────────────────────────────────────────

export interface Profile {
  id: string
  fullName: string | null
  phoneNumber: string | null
  email: string | null
  role: UserRole
  preferredLanguage: string
  isActive: boolean
  createdAt: string
}

export interface Zone {
  id: string
  code: string
  name: string
  zoneType: ZoneType
  center: { lat: number; lng: number }
  isActive: boolean
}

export interface VehicleType {
  id: string
  code: string
  name: string
  defaultCapacity: number
}

export interface Vehicle {
  id: string
  vehicleType: VehicleType
  plateOrBodyNo: string
  capacity: number
  approvalStatus: ApprovalStatus
  photoUrl: string | null
  isActive: boolean
}

export interface Driver {
  id: string
  profileId: string | null
  fullName: string
  phoneNumber: string | null
  licenseNo: string
  primaryChannel: DriverChannel
  approvalStatus: ApprovalStatus
  availability: DriverAvailability
  driverCode: string
  homeTerminalId: string | null
  createdAt: string
  currentVehicle?: Vehicle
}

export interface NearbyVehicle {
  driverId: string
  driverCode: string
  driverName: string
  vehicleType: string
  bodyNumber: string
  trackingSource: TrackingSource
  availability: DriverAvailability
  distanceMeters: number
  lat: number
  lng: number
  locationUpdatedAt: string
  primaryChannel: DriverChannel
}

export interface LocationPoint {
  lat: number
  lng: number
  label?: string
  zoneId?: string
}

export interface RideRequest {
  id: string
  passengerId: string
  pickup: LocationPoint
  destination: LocationPoint
  passengerCount: number
  notes?: string
  status: RideStatus
  assignedDriverId?: string
  assignedVehicleId?: string
  assignedDriver?: Driver
  assignedVehicle?: Vehicle
  createdAt: string
  updatedAt: string
}

export interface RideOffer {
  id: string
  rideId: string
  driverId: string
  driver: Driver
  status: OfferStatus
  sentAt: string
  respondedAt?: string
}

export interface Terminal {
  id: string
  name: string
  zoneId: string
  zone?: Zone
  lat: number
  lng: number
  isActive: boolean
}

export interface TerminalQueueEntry {
  id: string
  terminalId: string
  driverId: string
  driver: Driver
  position: number
  checkedInAt: string
}

export interface AdminDashboard {
  activeVehicles: number
  activeDrivers: number
  ridesToday: number
  pendingApprovals: number
  completedToday: number
  cancelledToday: number
}

// ─── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  statusCode: number
  code: string
  message: string
  details?: unknown
}

// ─── Auth ────────────────────────────────────────────────────

export interface AuthSession {
  user: {
    id: string
    email?: string
    phone?: string
  }
  access_token: string
  profile: Profile
}

// ─── UI State ────────────────────────────────────────────────

export type ModalType = 'confirm-request' | 'cancel-ride' | 'rate-ride' | 'report-incident' | null

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}
