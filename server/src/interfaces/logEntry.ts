/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LogEntry {
    eventType: string;
    message: string;
    data?: any;
    timestamp: string;
  }