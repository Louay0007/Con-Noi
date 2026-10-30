import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mail: MailService,
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

  /**
   * Starts the password-reset flow.
   *
   * Always resolves successfully and never reveals whether the address is
   * registered — the caller returns the same message either way. Rate limiting
   * on the endpoint is what prevents enumeration by brute force.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmailWithSecrets(email.toLowerCase());
    if (!user || !user.isActive || user.deletedAt) {
      // Spend comparable time on the miss path so timing does not leak either.
      await bcrypt.hash(crypto.randomUUID(), 12);
      return;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const ttlMinutes = this.configService.get<number>('RESET_TOKEN_TTL_MINUTES', 60);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.usersService.setPasswordResetToken(user._id.toString(), tokenHash, expiresAt);

    const appUrl = this.configService
      .get<string>('FRONTEND_URL', 'http://localhost:8080')
      .split(',')[0]
      .trim();
    const link = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    await this.mail.send({
      to: user.email,
      subject: 'Reimposta la tua password — Con noi',
      text: [
        'Hai richiesto di reimpostare la password del tuo account Con noi.',
        '',
        `Apri questo link per scegliere una nuova password (valido ${ttlMinutes} minuti):`,
        link,
        '',
        'Se non hai richiesto tu il cambio, ignora questa email: la password attuale resta valida.',
      ].join('\n'),
      html: `
        <p>Hai richiesto di reimpostare la password del tuo account <strong>Con noi</strong>.</p>
        <p><a href="${link}">Scegli una nuova password</a> — il link scade tra ${ttlMinutes} minuti.</p>
        <p>Se non hai richiesto tu il cambio, ignora questa email: la password attuale resta valida.</p>
      `,
    });
  }

  /** Completes the reset. Invalid or expired tokens are rejected. */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByPasswordResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.setPasswordFromReset(user._id.toString(), passwordHash);

    await this.mail
      .send({
        to: user.email,
        subject: 'La tua password è stata aggiornata — Con noi',
        text: 'La password del tuo account Con noi è stata appena modificata. Se non sei stato tu, contatta subito l\'assistenza.',
      })
      .catch(() => undefined);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.usersService.toSafeProfile(user);
  }

  private async generateTokens(user: UserDocument) {
    type Ttl = `${number}${'s' | 'm' | 'h' | 'd'}`;
    const accessToken = this.jwtService.sign(
      { sub: user._id.toString(), role: user.role, typ: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as Ttl,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString(), role: user.role, typ: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') as Ttl,
      },
    );

    return { accessToken, refreshToken };
  }
}