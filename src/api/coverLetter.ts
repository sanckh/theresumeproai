import {
  GenerateCoverLetterParams,
  SaveCoverLetterParams,
  CoverLetter,
  CoverLetterResponse,
  SaveCoverLetterResponse
} from '@/interfaces/coverLetter';
import { auth } from '@/config/firebase';

const API_URL = import.meta.env.VITE_API_URL;

export const generateCoverLetter = async (params: GenerateCoverLetterParams): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(`${API_URL}/cover-letters/generate/${user.uid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to generate cover letter');
  }

  const data = await response.json();
  return data.coverLetter;
};

export const saveCoverLetter = async (params: SaveCoverLetterParams): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(`${API_URL}/cover-letters/save/${user.uid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to save cover letter');
  }

  const data = await response.json();
  return data.id;
};

export const getCoverLetter = async (id: string): Promise<CoverLetter> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(`${API_URL}/cover-letters/${user.uid}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get cover letter');
  }

  return response.json();
};

export const getAllCoverLetters = async (): Promise<CoverLetter[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const response = await fetch(`${API_URL}/cover-letters/${user.uid}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get cover letters');
  }

  return response.json();
};
