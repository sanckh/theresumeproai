import { ResumeContent } from "./resumeContent";

export interface ResumeFormProps {
    data: ResumeContent;
    onChange: (field: string, value: unknown) => void;
  }