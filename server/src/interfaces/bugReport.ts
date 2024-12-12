export interface BugReport {
    id?: string;
    userId: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    createdAt: Date;
  }