/* eslint-disable @typescript-eslint/no-require-imports */
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase first
require('./firebase_options');

import admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './src/utils/logUtils';
import logRoutes from './src/routes/log_routes';
import resumeRoutes from './src/routes/resumeRoutes';
import stripeRoutes from './src/routes/stripeRoutes';
import subscriptionRoutes from './src/routes/subscriptionRoutes';
import coverLetterRoutes from './src/routes/coverLetterRoutes';
import openAiRoutes from './src/routes/openAiRoutes';
import bugRoutes from './src/routes/bugRoutes';


const app = express();
const port = Number(process.env.PORT) || 3000;

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,             // Max 100 requests per minute
  message: 'Too many requests. Please try again later.',
});

const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8080',
  'https://theresumeproai-dev.web.app',
  'https://theresumeproai-prod.web.app',
  'https://theresumeproai-dev.firebaseapp.com',
  'https://theresumeproai-prod.firebaseapp.com',
  'https://theresumeproai.com',
];

// Use Parameters utility to infer CORS options type
const corsOptions: Parameters<typeof cors>[0] = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // Allow requests with no origin

    if (allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false); // Block request
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'credentials', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply middleware
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(apiLimiter);

// Apply JSON body parser to all routes except webhook endpoints
app.use((req, res, next) => {
  if (
    req.originalUrl === '/api/subscription/stripe/webhook' ||
    req.originalUrl === '/api/stripe/webhook'
  ) {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

// API Routes
app.use('/api/logs', logRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/ai', openAiRoutes);
app.use('/api/bug', bugRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend running...');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
