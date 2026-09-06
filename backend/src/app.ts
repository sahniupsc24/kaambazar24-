import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import hiringRoutes from './routes/hiring.routes';
import contractRoutes from './routes/contract.routes';
import workEntryRoutes from './routes/workEntry.routes';
import paymentRoutes from './routes/payment.routes';
import ratingRoutes from './routes/rating.routes';
import taxonomyRoutes from './routes/taxonomy.routes';
import adminRoutes from './routes/admin.routes';
import contactRoutes from './routes/contact.routes';
import planRoutes from './routes/plans.routes';
import seoRoutes from './routes/seo.routes';
import razorpayRoutes from './routes/razorpay.routes';
import chatRoutes from './routes/chat.routes';
import disputeRoutes from './routes/dispute.routes';
import exportRoutes from './routes/export.routes';

export function createApp() {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // 2. CORS
  app.use(cors({ 
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        env.corsOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    }, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 3. Rate Limiting (Global)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });
  app.use('/api', globalLimiter);

  // Strict Rate Limiting for Auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Limit each IP to 50 requests per 15 minutes for auth routes
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Set up public static folder for uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

  // SEO & Sitemap routes (served at root and /api for search engine crawlers)
  app.use('/', seoRoutes);

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/hirings', hiringRoutes);
  app.use('/api/contracts', contractRoutes);
  app.use('/api/work-entries', workEntryRoutes);
  app.use('/api/payments/razorpay', razorpayRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api', taxonomyRoutes); // /api/categories, /api/locations, /api/settings/featured-price
  app.use('/api/admin', adminRoutes);
  app.use('/api/contacts', contactRoutes);
  app.use('/api/plans', planRoutes);
  
  // Phase 5 & Upload Routes
  app.use('/api/chat', chatRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/export', exportRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
