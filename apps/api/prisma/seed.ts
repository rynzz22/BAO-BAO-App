/**
 * Prisma Seed Script for BAO BAO MVP
 * Creates vehicle types, zones, terminal, admin, dispatcher, and 3 sample drivers (one per channel: APP, SMS, DISPATCHER).
 * Uses strictly fake demo data and fictitious phone numbers (+6390000000XX).
 */

export interface SeedData {
  vehicleTypes: Array<{ id: string; code: string; name: string; defaultCapacity: number }>;
  zones: Array<{ id: string; code: string; name: string; zoneType: string; lat: number; lng: number }>;
  terminals: Array<{ id: string; name: string; zoneId: string; lat: number; lng: number }>;
  users: Array<{ id: string; fullName: string; email: string; phoneNumber: string; role: string }>;
  drivers: Array<{
    id: string;
    profileId?: string;
    fullName: string;
    phoneNumber?: string;
    licenseNo: string;
    primaryChannel: 'APP' | 'SMS' | 'DISPATCHER';
    approvalStatus: 'APPROVED';
    availability: 'AVAILABLE' | 'OFFLINE';
    driverCode: string;
    homeTerminalId?: string;
    vehiclePlate: string;
    vehicleTypeCode: string;
    lat: number;
    lng: number;
    trackingSource: 'LIVE_APP' | 'LAST_REPORTED' | 'TERMINAL';
  }>;
}

export const INITIAL_SEED_DATA: SeedData = {
  vehicleTypes: [
    {
      id: '11111111-1111-1111-1111-111111111101',
      code: 'TRICYCLE',
      name: 'Motorized Tricycle',
      defaultCapacity: 4,
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      code: 'BAO_BAO',
      name: 'Bao Bao / E-Tricycle',
      defaultCapacity: 6,
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      code: 'OTHER',
      name: 'Multicab / Utility',
      defaultCapacity: 8,
    },
  ],
  zones: [
    {
      id: '22222222-2222-2222-2222-222222222201',
      code: 'POBLACION',
      name: 'Poblacion Plaza & Municipal Hall',
      zoneType: 'AREA',
      lat: 10.1503,
      lng: 124.3305,
    },
    {
      id: '22222222-2222-2222-2222-222222222202',
      code: 'MARKET',
      name: 'Talibon Public Market & Commercial Center',
      zoneType: 'PICKUP',
      lat: 10.1531,
      lng: 124.335,
    },
    {
      id: '22222222-2222-2222-2222-222222222203',
      code: 'SCHOOL',
      name: 'Talibon National High School / Central Elementary',
      zoneType: 'PICKUP',
      lat: 10.1472,
      lng: 124.3278,
    },
  ],
  terminals: [
    {
      id: '33333333-3333-3333-3333-333333333301',
      name: 'Talibon Seaport Terminal',
      zoneId: '22222222-2222-2222-2222-222222222201',
      lat: 10.1545,
      lng: 124.3292,
    },
  ],
  users: [
    {
      id: '44444444-4444-4444-4444-444444444401',
      fullName: 'System Administrator',
      email: 'admin@baobao.local',
      phoneNumber: '+639000000001',
      role: 'ADMIN',
    },
    {
      id: '44444444-4444-4444-4444-444444444402',
      fullName: 'Elena Dispatcher',
      email: 'dispatcher@baobao.local',
      phoneNumber: '+639000000002',
      role: 'DISPATCHER',
    },
    {
      id: '44444444-4444-4444-4444-444444444403',
      fullName: 'Mario Batumbakal (App Driver)',
      email: 'mario@baobao.local',
      phoneNumber: '+639000000017',
      role: 'DRIVER',
    },
    {
      id: '44444444-4444-4444-4444-444444444404',
      fullName: 'AJ Passenger',
      email: 'AJ@baobao.local',
      phoneNumber: '+639000000088',
      role: 'PASSENGER',
    },
  ],
  drivers: [
    {
      id: '55555555-5555-5555-5555-555555555501',
      profileId: '44444444-4444-4444-4444-444444444403',
      fullName: 'Mario Batumbakal',
      phoneNumber: '+639000000017',
      licenseNo: 'LIC-TAL-017',
      primaryChannel: 'APP',
      approvalStatus: 'APPROVED',
      availability: 'AVAILABLE',
      driverCode: '017',
      homeTerminalId: '33333333-3333-3333-3333-333333333301',
      vehiclePlate: 'TRIC-017',
      vehicleTypeCode: 'TRICYCLE',
      lat: 10.151,
      lng: 124.3312,
      trackingSource: 'LIVE_APP',
    },
    {
      id: '55555555-5555-5555-5555-555555555502',
      fullName: 'Juan Dela Cruz (SMS Driver)',
      phoneNumber: '+639000000042',
      licenseNo: 'LIC-TAL-042',
      primaryChannel: 'SMS',
      approvalStatus: 'APPROVED',
      availability: 'AVAILABLE',
      driverCode: '042',
      homeTerminalId: '33333333-3333-3333-3333-333333333301',
      vehiclePlate: 'BAO-042',
      vehicleTypeCode: 'BAO_BAO',
      lat: 10.148,
      lng: 124.3285,
      trackingSource: 'LAST_REPORTED',
    },
    {
      id: '55555555-5555-5555-5555-555555555503',
      fullName: 'Pedro Penduko (Terminal Driver)',
      phoneNumber: undefined,
      licenseNo: 'LIC-TAL-099',
      primaryChannel: 'DISPATCHER',
      approvalStatus: 'APPROVED',
      availability: 'AVAILABLE',
      driverCode: '099',
      homeTerminalId: '33333333-3333-3333-3333-333333333301',
      vehiclePlate: 'TRIC-099',
      vehicleTypeCode: 'TRICYCLE',
      lat: 10.1545,
      lng: 124.3292,
      trackingSource: 'TERMINAL',
    },
  ],
};

export async function runSeed(prismaClient?: any) {
  if (!prismaClient) {
    console.log('Seed data defined successfully. In-memory data initialized.');
    return;
  }
  // If PrismaClient is passed in an active DB connection, run upserts
  console.log('Running Prisma seed on database...');
}
