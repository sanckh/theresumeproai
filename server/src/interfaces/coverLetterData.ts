import admin from 'firebase-admin'

export interface CoverLetterData {
    id?: string;
    user_id: string;
    resume_id: string;
    cover_id?: string;
    content: string;
    job_description?: string;
    job_url?: string;
    created_at: admin.firestore.FieldValue;
    updated_at: admin.firestore.FieldValue;
  }