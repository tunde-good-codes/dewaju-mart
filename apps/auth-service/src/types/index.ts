export type RegisterUserData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  refreshToken: string;
  password?: string;
  isAdmin?: boolean;
  role?: string;
};

export interface GoogleUserData {
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  googleId?: string;
}

export interface ForgotPasswordCache {
  otp: string;
  email: string;
  firstName: string;
}
