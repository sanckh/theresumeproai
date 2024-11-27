export interface JobEntry {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  duties?: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

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
  };
  created_at?: string;
  updated_at?: string;
}

const API_URL = '/api';

export async function saveResume(
  userId: string,
  resumeData: ResumeData['data'],
  name: string = "Untitled Resume",
  resumeId?: string
): Promise<string> {
  const response = await fetch(`${API_URL}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, resumeData, name, resumeId }),
  });

  if (!response.ok) {
    throw new Error('Failed to save resume');
  }

  const data = await response.json();
  return data.resumeId;
}

export async function getResume(userId: string, resumeId: string): Promise<ResumeData> {
  const response = await fetch(`${API_URL}/resume/${resumeId}?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load resume');
  }

  return response.json();
}

export async function getAllResumes(userId: string): Promise<ResumeData[]> {
  const response = await fetch(`${API_URL}/resumes?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load resumes');
  }

  return response.json();
}