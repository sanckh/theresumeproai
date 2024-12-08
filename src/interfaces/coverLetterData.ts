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

export interface SavedCoverLetter {
  id: string;
  content: string;
  jobDescription?: string;
  jobUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetterMetadata {
  id?: string;
  userId: string;
  resumeId: string;
}
