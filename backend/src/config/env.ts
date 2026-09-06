import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

// Railway (and most PaaS providers) supply a single DATABASE_URL.
// Parse it if present; otherwise fall back to individual DB_* vars.
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    ssl: parsed.searchParams.get('sslmode') !== 'disable',
  };
}

const dbUrl = process.env.DATABASE_URL;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),

  db: dbUrl
    ? parseDbUrl(dbUrl)
    : {
        host: required('DB_HOST', 'localhost'),
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: required('DB_USERNAME', 'postgres'),
        password: required('DB_PASSWORD', 'postgres'),
        database: required('DB_NAME', 'workforce_marketplace'),
        ssl: false,
      },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  corsOrigin: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  razorpay: {
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
};

// Enforce strong secrets in production
if (env.nodeEnv === 'production') {
  const weakSecrets = ['change_this_access_secret', 'change_this_refresh_secret', 'kaambazar_access_secret_super_safe_key_123', 'kaambazar_refresh_secret_super_safe_key_456'];
  if (weakSecrets.includes(env.jwt.accessSecret) || weakSecrets.includes(env.jwt.refreshSecret)) {
    throw new Error('FATAL: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to strong, unique values in production!');
  }
}
