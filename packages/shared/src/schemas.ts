import { z } from 'zod';
import {
  UserRole,
  DriverAvailability,
  ApprovalStatus,
  DriverChannel,
} from './enums.js';

export const authSyncSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.PASSENGER),
  preferredLanguage: z.string().default('en'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

export const registerDriverSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  licenseNo: z.string().min(3, 'License number is required'),
  vehicleTypeId: z.string().uuid('Invalid vehicle type'),
  plateOrBodyNo: z.string().min(1, 'Plate or Body number is required'),
  capacity: z.number().int().min(1).max(20).default(3),
  homeTerminalId: z.string().uuid().optional(),
});

export const updateDriverStatusSchema = z.object({
  availability: z.nativeEnum(DriverAvailability),
});

export const driverLocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
});

export const createRideSchema = z.object({
  pickup: z.object({
    lat: z.number(),
    lng: z.number(),
    label: z.string().min(1, 'Pickup location label is required'),
    zoneId: z.string().uuid().optional(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
    label: z.string().min(1, 'Destination location label is required'),
  }),
  passengerCount: z.number().int().min(1).max(10).default(1),
  notes: z.string().max(250).optional(),
});

export const cancelRideSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export const rateRideSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const reportIncidentSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(5),
});

export const assignRideSchema = z.object({
  driverId: z.string().min(1),
});

export const queueCheckInOutSchema = z.object({
  terminalId: z.string().min(1),
  driverId: z.string().min(1),
});

export const inboundSmsSchema = z.object({
  from: z.string().min(7),
  body: z.string().min(1),
  timestamp: z.string().optional(),
  signature: z.string().optional(),
});

export const updateApprovalSchema = z.object({
  status: z.nativeEnum(ApprovalStatus),
  notes: z.string().optional(),
});

export const updateDriverChannelSchema = z.object({
  channel: z.nativeEnum(DriverChannel),
});
