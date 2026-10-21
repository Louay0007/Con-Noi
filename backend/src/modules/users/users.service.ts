import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto, UpdateSpecialitiesDto, ChangePasswordDto, AdminUpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), deletedAt: null }).exec();
  }

  async findByEmailWithSecrets(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash +refreshTokenHash +failedLoginCount +lockedUntil +emailVerified +emailVerifyToken +resetToken +resetTokenExpires')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findByIdWithSecrets(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select('+passwordHash +refreshTokenHash +failedLoginCount +lockedUntil')
      .exec();
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    age?: number;
    phone?: string;
    city?: string;
    specialityIds: string[];
    role?: string;
  }): Promise<UserDocument> {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    return this.userModel.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      age: data.age ?? null,
      phone: data.phone ?? null,
      city: data.city ?? null,
      specialityIds: data.specialityIds.map((id) => new Types.ObjectId(id)),
      role: data.role || 'worker',
      onboardingCompleted: data.specialityIds.length > 0,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    await user.save();
    return user;
  }

  async replaceSpecialities(userId: string, specialityIds: string[]): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.specialityIds = specialityIds.map((id) => new Types.ObjectId(id));
    user.onboardingCompleted = specialityIds.length > 0 && !!user.resumeFileId;
    await user.save();
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    (user as any).refreshTokenHash = null;
    await user.save();
  }

  async deactivate(userId: string, adminId?: string): Promise<void> {
    const user = await this.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isActive = false;
    (user as any).refreshTokenHash = null;
    if (adminId) user.lastAdminActionBy = new Types.ObjectId(adminId);
    await user.save();
  }

  async softDelete(userId: string, adminId?: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.deletedAt = new Date();
    user.isActive = false;
    if (adminId) user.deletedBy = new Types.ObjectId(adminId);
    await user.save();
  }

  async updateRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash: hash }).exec();
  }

  async incrementFailedLogins(userId: string): Promise<number> {
    const user = await this.findByIdWithSecrets(userId);
    if (!user) return 0;

    user.failedLoginCount = (user.failedLoginCount || 0) + 1;
    if (user.failedLoginCount >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    return user.failedLoginCount;
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    ).exec();
  }

  toSafeProfile(user: UserDocument): Record<string, unknown> {
    const obj = user.toObject();
    delete (obj as any).passwordHash;
    delete (obj as any).refreshTokenHash;
    delete (obj as any).failedLoginCount;
    delete (obj as any).lockedUntil;
    delete (obj as any).emailVerifyToken;
    delete (obj as any).resetToken;
    delete (obj as any).resetTokenExpires;
    return obj;
  }

  async findAll(filters: {
    role?: string;
    isActive?: boolean;
    specialityId?: string;
    city?: string;
    q?: string;
    page: number;
    limit: number;
    sort?: string;
  }): Promise<{ items: UserDocument[]; total: number }> {
    const query: Record<string, unknown> = { deletedAt: null };
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.specialityId) query.specialityIds = new Types.ObjectId(filters.specialityId);
    if (filters.city) query.city = { $regex: filters.city, $options: 'i' };
    if (filters.q) query.$text = { $search: filters.q };

    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(filters.sort === 'fullName' ? { fullName: 1 } : { createdAt: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const profile = this.toSafeProfile(user);
    // In production, also fetch work history, applications, messages, files metadata
    return {
      exportedAt: new Date().toISOString(),
      user: profile,
    };
  }

  async gdprDelete(userId: string): Promise<void> {
    const user = await this.findByIdWithSecrets(userId);
    if (!user) throw new NotFoundException('User not found');
    // Anonymize PII
    user.email = `deleted-${userId}@gdpr.local`;
    user.fullName = 'Deleted User';
    (user as any).phone = null;
    (user as any).city = null;
    (user as any).province = null;
    (user as any).address = null;
    (user as any).bio = null;
    (user as any).avatarUrl = null;
    (user as any).birthDate = null;
    user.isActive = false;
    user.deletedAt = new Date();
    (user as any).refreshTokenHash = null;
    (user as any).emailVerifyToken = null;
    (user as any).resetToken = null;
    (user as any).resetTokenExpires = null;
    await user.save();
  }
}