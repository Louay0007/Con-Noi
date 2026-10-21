import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      age: dto.age,
      phone: dto.phone,
      city: dto.city,
      specialityIds: dto.specialityIds,
    });

    const tokens = await this.generateTokens(user);
    const refreshHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.usersService.updateRefreshTokenHash(user._id.toString(), refreshHash);

    return {
      user: this.usersService.toSafeProfile(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithSecrets(dto.email.toLowerCase());
    if (!user) {
      await bcrypt.compare(dto.password, '$2b$12$dummy.hash.to.prevent.timing.attacks');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (user.deletedAt) throw new UnauthorizedException('Account has been deleted');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Try again later.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.usersService.incrementFailedLogins(user._id.toString());
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.resetFailedLogins(user._id.toString());

    const tokens = await this.generateTokens(user);
    const refreshHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.usersService.updateRefreshTokenHash(user._id.toString(), refreshHash);

    return {
      user: this.usersService.toSafeProfile(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');

    let payload: { sub: string; role: string; typ: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.typ !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const user = await this.usersService.findByIdWithSecrets(payload.sub);
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User no longer active');
    }

    const storedHash = user.refreshTokenHash;
    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (!storedHash || storedHash !== incomingHash) {
      // Token reuse detected — revoke all sessions
      await this.usersService.updateRefreshTokenHash(user._id.toString(), null);
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    const tokens = await this.generateTokens(user);
    const newRefreshHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await this.usersService.updateRefreshTokenHash(user._id.toString(), newRefreshHash);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.usersService.toSafeProfile(user);
  }

  private async generateTokens(user: UserDocument) {
    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), role: user.role, typ: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), role: user.role, typ: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d'),
      },
    );

    return { accessToken, refreshToken };
  }
}