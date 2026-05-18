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
}
