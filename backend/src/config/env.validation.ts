import * as Joi from 'joi';

/**
 * Environment contract for the API.
 *
 * Exported so it can be used through `ConfigModule`'s `validate` hook rather
 * than `validationSchema`: @nestjs/config v12 validates against Standard
 * Schema, which Joi does not implement, so passing a Joi schema there throws
 * at boot time. `validate` receives the plain env object and must return it.
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  FRONTEND_URL: Joi.string().default('http://localhost:8080'),
  MONGO_URI: Joi.string().required(),
  MONGO_REPLICA_SET: Joi.string().allow('').optional(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_ACCESS_SECRET must be at least 32 characters',
    'any.required': 'JWT_ACCESS_SECRET is required',
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
    'any.required': 'JWT_REFRESH_SECRET is required',
  }),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  STORAGE_DRIVER: Joi.string().valid('disk', 's3').default('disk'),
  STORAGE_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE_MB: Joi.number().default(10),
  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  MAIL_HOST: Joi.string().allow('').optional(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.string().valid('true', 'false').default('false'),
  MAIL_USER: Joi.string().allow('').optional(),
  MAIL_PASSWORD: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().default('Con noi <no-reply@con-noi.local>'),
  RESET_TOKEN_TTL_MINUTES: Joi.number().default(60),
  SEED_ADMIN_EMAIL: Joi.string().email().default('admin@platform.it'),
  SEED_ADMIN_PASSWORD: Joi.string().default('ChangeMe!2026'),
}).unknown(true);

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const { error, value } = envSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  // Defaults resolved by Joi must be written back for ConfigService.
  return { ...config, ...value };
}
