import { EducationEntry } from "./educationEntry";
import { JobEntry } from "./jobEntry";
import admin from 'firebase-admin';
import { ResumeContent } from "./resumeContent";

export interface ResumeData {
    id?: string;
    user_id: string;
    name: string;
    data: ResumeContent;
    created_at?: admin.firestore.FieldValue;
    updated_at?: admin.firestore.FieldValue;
}