import { ResumeData } from "./resumeData";
import { SavedCoverLetter } from "./coverLetterData";

export interface CoverLetterFormProps {
  savedResume: {
    id: string;
    name: string;
    data: ResumeData;
  } | null;
  savedCoverLetter?: SavedCoverLetter;
  onGenerate?: () => Promise<void>;
  onSave?: () => Promise<void>;
  isGenerating?: boolean;
  isSaving?: boolean;
}
