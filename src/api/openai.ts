const API_URL = import.meta.env.VITE_API_URL;

import { ParsedResume } from "@/interfaces/parsedResume";
import { ResumeData } from "@/interfaces/resumeData";
import { auth } from "@/config/firebase";
import { ResumeContent } from "@/interfaces/resumeContent";

const getAuthHeader = async () => {
  const token = await auth.currentUser?.getIdToken();
  return { Authorization: `Bearer ${token}` };
};

export const parseResumeAPI = async (userId: string, resumeText: string): Promise<ResumeContent> => {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/ai/parse-resume/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      body: JSON.stringify({ resumeText }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

export const analyzeResumeAPI = async (
  userId: string,
  resumeData: string | ResumeContent
): Promise<{
  score: number;
  suggestions: string[];
  strengths: string[];
}> => {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/ai/analyze-resume/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      body: JSON.stringify({ resumeData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const enhanceWithAIAPI = async (userId: string, resumeData: ResumeData["data"]) => {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/ai/enhance-resume/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      body: JSON.stringify({ resumeData }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error enhancing resume:", error);
    throw error;
  }
};

export const classifyResumeSectionAPI = async (
  userId: string,
  text: string,
  context: string
): Promise<{
  sectionType: string;
  confidence: number;
}> => {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/ai/classify-section/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      body: JSON.stringify({ text, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error classifying section:", error);
    throw error;
  }
};

export const generateCoverLetterAPI = async (
  userId: string,
  resumeData: ResumeContent,
  jobDescription?: string,
  jobUrl?: string
): Promise<string> => {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/ai/generate-cover-letter/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include',
      body: JSON.stringify({
        resumeData,
        jobDescription,
        jobUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both object response and direct string response
    if (typeof data === 'string') {
      return data;
    } else if (data && typeof data.coverLetter === 'string') {
      return data.coverLetter;
    } else {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw error;
  }
};