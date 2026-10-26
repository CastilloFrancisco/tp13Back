export type AuthenticatedUser = {
  id: number;
  email: string;
  nombre?: string;
};

export type AuthTokenPayload = {
  userId: number;
  email?: string;
  iat?: number;
  exp?: number;
};
