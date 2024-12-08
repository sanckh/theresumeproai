export interface GenerateCoverLetterParams {
  resumeData: unknown;
  jobDescription?: string;
  jobUrl?: string;
}

export interface SaveCoverLetterParams {
  resumeId: string;
  content: string;
  jobDescription?: string;
  jobUrl?: string;
}

export interface CoverLetter {
  id: string;
  content: string;
  jobDescription?: string;
  jobUrl?: string;
  created_at: string;
  updated_at: string;
}

export interface CoverLetterResponse {
  coverLetter: string;
}

export interface SaveCoverLetterResponse {
  id: string;
}
