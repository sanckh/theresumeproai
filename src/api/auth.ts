const API_URL = import.meta.env.VITE_API_URL;

export const register = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error);
  }
  return data;
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Check if email is verified
    if (!data.user.emailVerified) {
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }

    return data;
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Network request failed:', error.message);
    } else {
      console.error('Network request failed:', error);
    }
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      method: 'GET',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const signout = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/signout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to sign out');
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/auth/resetpassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset email');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error resetting password:', error.message);
    } else {
      console.error('Error resetting password:', error);
    }
    throw error;
  }
};

export const confirmPasswordReset = async (oobCode: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/confirmpasswordreset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oobCode, newPassword }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to reset password');
  }
};

export const resendVerificationEmail = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to resend verification email');
    }

    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to resend verification email:', error.message);
    } else {
      console.error('Failed to resend verification email:', error);
    }
    throw error;
  }
};
