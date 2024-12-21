import { ResumeData } from "./resumeData";
import { SavedCoverLetter } from "./savedCoverLetter";

export interface CoverLetterFormProps {
  resume: ResumeData | null;
  savedCoverLetter?: SavedCoverLetter;
  onGenerate?: () => Promise<void>;
  onSave?: () => Promise<void>;
  isGenerating?: boolean;
  isSaving?: boolean;
}
