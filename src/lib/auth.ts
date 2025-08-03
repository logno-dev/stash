import axios from 'axios';

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'https://your-auth-server.com/api';
const AUTH_API_KEY = process.env.AUTH_API_KEY!;
const AUTH_APP_ID = process.env.AUTH_APP_ID!;

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  appId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'x-api-key': AUTH_API_KEY,
    'Content-Type': 'application/json',
  },
});

export async function registerUser(data: RegisterData): Promise<RegisterResponse> {
  console.log('Attempting registration with:', {
    baseURL: AUTH_BASE_URL,
    fullURL: `${AUTH_BASE_URL}/auth/register`,
    appId: AUTH_APP_ID,
    email: data.email,
    headers: {
      'x-api-key': AUTH_API_KEY ? 'SET' : 'NOT SET',
      'Content-Type': 'application/json'
    }
  });
  
  try {
    const response = await authApi.post('/auth/register', {
      ...data,
      appId: AUTH_APP_ID,
    });
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Registration API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      fullURL: error.config?.baseURL + error.config?.url,
      requestData: error.config?.data
    });
    throw error;
  }
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  console.log('Attempting login with:', {
    url: `${AUTH_BASE_URL}/auth/login`,
    appId: AUTH_APP_ID,
    email: data.email
  });
  
  try {
    const response = await authApi.post('/auth/login', {
      ...data,
      appId: AUTH_APP_ID,
    });
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    throw error;
  }
}

export async function verifyToken(token: string): Promise<User> {
  console.log('Verifying token with auth service...');
  try {
    const response = await authApi.get('/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Token verification successful:', response.data);
    return response.data.user;
  } catch (error: any) {
    console.error('Token verification failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
}

export async function getUserProfile(token: string): Promise<User> {
  const response = await authApi.get('/user/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.user;
}