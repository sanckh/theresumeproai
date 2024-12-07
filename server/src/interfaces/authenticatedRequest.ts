import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
      uid: string;
      email?: string;
    };
    headers: Request['headers'] & {
      authorization?: string;
    };
}