require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  AUTH_LIMIT_PER_MIN: z.coerce.number().int().positive().default(10),
  SUBMIT_LIMIT_PER_MIN: z.coerce.number().int().positive().default(5),
  ANSWER_MIN_LEN: z.coerce.number().int().positive().default(50),
  ANSWER_MAX_LEN: z.coerce.number().int().positive().default(3000),
  WEAK_THRESHOLD: z.coerce.number().min(0).max(10).default(6),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  GEMINI_FALLBACK_MODEL: z.string().min(1).default('gemini-2.0-flash'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  MOCK_AI: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  DEMO_ON_AI_FAILURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

module.exports = Object.freeze(result.data);
