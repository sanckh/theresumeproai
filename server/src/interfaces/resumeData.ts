import { EducationEntry } from "./educationEntry";
import { JobEntry } from "./jobEntry";
import admin from 'firebase-admin';

export interface ResumeData {
    id?: string;
    user_id: string;
    name: string;
    data: {
      fullName: string;
      email: string;
      phone: string;
      summary: string;
      jobs: JobEntry[];
      education: EducationEntry[];
      skills: string;
    };
    created_at?: admin.firestore.FieldValue;
    updated_at?: admin.firestore.FieldValue;
  }
  