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
import authRoutes from './src/routes/authRoutes';
import logRoutes from './src/routes/log_routes';
import resumeRoutes from './src/routes/resumeRoutes';
import stripeRoutes from './src/routes/stripeRoutes';

const app = express();
const port = process.env.PORT || 3000;

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,             // Max 100 requests per minute
  message: 'Too many requests. Please try again later.',
});

const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8080',
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
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204, // For legacy browsers like IE11
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests (OPTIONS method)
app.options('*', cors(corsOptions));
app.use(requestLogger);
app.use(bodyParser.json());
app.use(apiLimiter);

// Handle preflight requests
app.options('*', cors(corsOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/stripe', stripeRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Backend running...');
});

app.listen(3000, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});