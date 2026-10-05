import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AuthSyncDto, UpdateProfileDto, ProfileDto, UserRole } from '@bao-bao/shared';

@Injectable()
export class UsersService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async syncProfile(userId: string, dto: AuthSyncDto): Promise<ProfileDto> {
    let profile = this.db.profiles.find((p) => p.id === userId);

    if (!profile) {
      profile = {
        id: userId,
        fullName: dto.fullName || 'New User',
        phoneNumber: dto.phoneNumber || null,
        email: dto.email || null,
        role: dto.role || UserRole.PASSENGER,
        preferredLanguage: dto.preferredLanguage || 'en',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.db.profiles.push(profile);
    } else {
      if (dto.fullName) profile.fullName = dto.fullName;
      if (dto.phoneNumber) profile.phoneNumber = dto.phoneNumber;
      if (dto.preferredLanguage) profile.preferredLanguage = dto.preferredLanguage;
    }

    return profile;
  }

  async getMe(userId: string): Promise<ProfileDto> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<ProfileDto> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');

    if (dto.fullName) profile.fullName = dto.fullName;
    if (dto.phoneNumber) profile.phoneNumber = dto.phoneNumber;
    if (dto.preferredLanguage) profile.preferredLanguage = dto.preferredLanguage;

    return profile;
  }

  async deactivateMe(userId: string): Promise<{ success: boolean }> {
    const profile = this.db.profiles.find((p) => p.id === userId);
    if (!profile) throw new NotFoundException('Profile not found');
    profile.isActive = false;
    return { success: true };
  }
}
