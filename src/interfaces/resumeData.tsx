import { EducationEntry } from "./educationEntry";
import { JobEntry } from "./jobEntry";

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
  }
  created_at?: string;
  updated_at?: string;
}