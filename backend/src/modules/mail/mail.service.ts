import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Transactional email.
 *
 * Two modes, chosen by configuration:
 *  - `MAIL_HOST` set  → real SMTP delivery.
 *  - `MAIL_HOST` empty → a "log" transport that prints messages to the
 *    container log. This keeps local development and demos working without
 *    an email provider, and makes it obvious in the logs that mail was sent
 *    but not delivered.
 *
 * Sending never throws into the caller: a failed password-reset email must
 * not return a 500 and leak that the address exists. Failures are logged.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private from = 'no-reply@localhost';
  private isLogTransport = true;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.from = this.config.get<string>('MAIL_FROM', 'no-reply@con-noi.local');
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT', 587);
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASSWORD');
    const secure = this.config.get<string>('MAIL_SECURE', 'false') === 'true';

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
      this.isLogTransport = false;
      this.logger.log(`SMTP transport ready (${host}:${port})`);
    } else {
      this.logger.warn(
        'MAIL_HOST is not set — emails will be written to the log instead of being delivered.',
      );
    }
  }

  /** Sends one email. Returns true when handed to a real transport. */
  async send(params: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(
        `[mail suppressed] to=${params.to} subject="${params.subject}"\n${params.text}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html ?? undefined,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send "${params.subject}" to ${params.to}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  get deliveryEnabled(): boolean {
    return !this.isLogTransport;
  }
}
