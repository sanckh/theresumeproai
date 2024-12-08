import { ResumeContent } from "./resumeContent";

export interface ResumeData {
  id?: string;
  user_id: string;
  name: string;
  data: ResumeContent;
  created_at?: string;
  updated_at?: string;
}