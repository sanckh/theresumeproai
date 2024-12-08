export interface CoverLetterFormData {
  recipientName: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  customization: {
    keyPoints: string[];
    tone: string;
    specificAchievements: string[];
  };
  additionalNotes: string;
}