import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
// cookie-parser is CommonJS without a default export wrapper under this
// tsconfig (allowSyntheticDefaultImports only), so require it directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api/v1', { exclude: ['api/v1/docs'] });
  // Behind a reverse proxy (Caddy/nginx/Vercel) this is required for
  // correct client IPs in throttling and audit logs.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    helmet({
      // Swagger UI needs inline styles/scripts to render.
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              connectSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get<string>('FRONTEND_URL', 'http://localhost:8080')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  // Exactly one global filter: a second @Catch() filter made error precedence
  // ambiguous and let Mongo errors surface as 500s.
  app.useGlobalFilters(new AllExceptionsFilter());

  // API docs are a development aid; exposing the full surface in production
  // is an unnecessary attack surface for a customer deployment.
  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Con-Noi API')
      .setDescription('Worker placement platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');

  logger.log(`API listening on http://localhost:${port}/api/v1`);
  if (!isProd) logger.log(`Swagger docs at http://localhost:${port}/api/v1/docs`);
  if (!isProd) {
    const accessSecret = config.get<string>('JWT_ACCESS_SECRET');
    if (accessSecret && accessSecret.length < 32) {
      logger.warn('JWT_ACCESS_SECRET is shorter than 32 chars — do not ship this value.');
    }
  }
}

bootstrap().catch((err) => {
  // Fail loudly: a container that silently exits is harder to debug.
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});
