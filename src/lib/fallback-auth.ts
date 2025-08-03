// Temporary fallback authentication for testing
// Remove this when auth.bunch.codes is properly configured

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

// In-memory user store (replace with database in production)
const users: Array<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  appId: string;
}> = [];

export async function fallbackRegisterUser(data: {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}) {
  // Check if user already exists
  const existingUser = users.find(u => u.email === data.email);
  if (existingUser) {
    const error = new Error('An account with this email already exists. Please try logging in instead.');
    (error as any).status = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const user = {
    id: `user_${Date.now()}`,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    password: hashedPassword,
    role: 'user',
    appId: process.env.AUTH_APP_ID || 'fallback-app'
  };

  users.push(user);

  return {
    message: 'User registered successfully',
    userId: user.id
  };
}

export async function fallbackLoginUser(data: {
  email: string;
  password: string;
}) {
  // Find user
  const user = users.find(u => u.email === data.email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isValidPassword = await bcrypt.compare(data.password, user.password);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken: accessToken, // Using same token for simplicity
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      appId: user.appId
    }
  };
}

export async function fallbackVerifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      appId: user.appId
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}