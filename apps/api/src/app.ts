import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';
import { metricsMiddleware } from './middleware/metrics';
import { healthRoutes, sendHealthResponse } from './routes/health';

export const app = express();

// Security — allow inline CSS for the Chronos health dashboard
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
      },
    },
  })
);
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:1420',
  ],
  credentials: true,
}));

// Stripe webhook needs the raw request body to verify the signature. It MUST be
// mounted before the global express.json() parser below, otherwise the body is
// already consumed/parsed as JSON and signature verification fails.
app.use('/v1/billing/webhook', express.raw({ type: 'application/json' }));

// Body parsing (skipped for the webhook route above, which keeps its raw Buffer body)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging + request metrics for health dashboard
app.use(morgan('short'));
app.use(metricsMiddleware);

// Root health dashboard (Chronos branded)
app.get('/', sendHealthResponse);
app.use('/health', healthRoutes);

// Routes
app.use('/v1', router);

// Error handler
app.use(errorHandler);
