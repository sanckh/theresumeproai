import { EducationEntry } from "./educationEntry";
import { JobEntry } from "./jobEntry";

export interface ResumeContent {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  jobs: JobEntry[];
  education: EducationEntry[];
  skills: string;
}
