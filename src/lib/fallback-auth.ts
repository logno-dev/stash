import { LoginData, RegisterData, loginUser, registerUser, verifyToken, User } from './auth';

export async function fallbackRegisterUser(data: RegisterData) {
  const response = await registerUser(data);

  return {
    message: response.message,
    userId: response.userId,
  };
}

export async function fallbackLoginUser(data: LoginData) {
  return loginUser(data);
}

export async function fallbackVerifyToken(token: string): Promise<User> {
  return verifyToken(token);
}
