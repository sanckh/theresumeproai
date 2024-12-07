interface UserCredential {
    user: {
      uid: string;
      email: string | null;
      emailVerified: boolean;
    };
    token?: string;
  }