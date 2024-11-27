import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logToFirestore } from '../services/logs_service';

export const generateCorrelationId = (): string => uuidv4();

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['correlation-id'] as string || generateCorrelationId();
  req.headers['correlation-id'] = correlationId;

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log only errors (statusCode >= 400)
    if (res.statusCode >= 400) {
      logToFirestore({
        eventType: 'ERROR_RESPONSE',
        message: 'Error in response',
        data: {
          endpoint: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          correlationId,
        },
        timestamp: new Date().toISOString(),
      }).catch((error) => console.error('Failed to log error response:', error));
    }
  });

  next();
};
