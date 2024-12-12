import { auth } from "@/config/firebase";

const API_URL = import.meta.env.VITE_API_URL;

export const reportBug = async (title: string, description: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const idToken = await user.getIdToken();

  const response = await fetch(`${API_URL}/bug/report/${user.uid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ title, description }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Server error:', errorData);
    throw new Error('Failed to submit bug report');
  }

  const data = await response.json();
  return data.bugReport;
};
