import { ResumeData } from "@/interfaces/resumeData";
const API_URL = import.meta.env.VITE_API_URL;

export async function saveResume(
  userId: string,
  resumeData: ResumeData['data'],
  name: string = "Untitled Resume",
  resumeId?: string
): Promise<string> {
  const response = await fetch(`${API_URL}/resume/saveresume/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ resumeData, name, resumeId }),
  });

  if (!response.ok) {
    throw new Error('Failed to save resume');
  }

  const data = await response.json();
  return data.resumeId;
}

export async function getResume(userId: string, resumeId: string): Promise<ResumeData> {
  const response = await fetch(`${API_URL}/resume/getresume/${userId}/${resumeId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to load resume');
  }

  return response.json();
}

export async function getAllResumes(userId: string): Promise<ResumeData[]> {
  const response = await fetch(`${API_URL}/resume/getallresumes/${userId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to load resumes');
  }

  return response.json();
}

export async function deleteResume(userId: string, resumeId: string): Promise<void> {
  const response = await fetch(`${API_URL}/resume/deleteresume/${userId}/${resumeId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete resume');
  }
}
