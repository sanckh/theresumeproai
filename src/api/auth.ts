interface UserCredential {
  user: {
    uid: string;
    email: string | null;
    emailVerified: boolean;
  };
  token?: string;
}

const API_URL = '/api/firebase';

export async function signUp(email: string, password: string): Promise<UserCredential> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign up');
  }

  return response.json();
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sign in');
  }

  return response.json();
}

export async function verifyToken(token: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/verify-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result.valid;
}
