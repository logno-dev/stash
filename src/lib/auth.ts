import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './db/schema';

const JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'replace-this-with-a-strong-secret';
const APP_ID = process.env.APP_ID || process.env.AUTH_APP_ID || 'local';

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createAuthError(message: string, status = 500): Error {
  const error = new Error(message);
  (error as any).status = status;
  return error;
}

function createToken(user: Omit<User, 'appId'>) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      appId: APP_ID,
    },
    JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

function toPublicUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    appId: row.appId || APP_ID,
  };
}

export async function registerUser(data: RegisterData): Promise<RegisterResponse> {
  if (!data.email || !data.password || !data.confirmPassword || !data.firstName || !data.lastName) {
    throw createAuthError('All fields are required', 400);
  }

  if (data.password !== data.confirmPassword) {
    throw createAuthError('Passwords do not match', 400);
  }

  const email = normalizeEmail(data.email);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw createAuthError('An account with this email already exists. Please try logging in instead.', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const userId = randomUUID();

  const [createdUser] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: 'user',
      appId: APP_ID,
    })
    .returning({
      id: users.id,
    });

  return {
    message: 'User registered successfully',
    userId: createdUser?.id || userId,
  };
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const email = normalizeEmail(data.email);

  if (!email || !data.password) {
    throw createAuthError('Email and password are required', 400);
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const userRow = userRows[0];
  if (!userRow) {
    throw createAuthError('Invalid credentials', 401);
  }

  const validPassword = await bcrypt.compare(data.password, userRow.passwordHash);
  if (!validPassword) {
    throw createAuthError('Invalid credentials', 401);
  }

  const user = toPublicUser(userRow);
  const accessToken = createToken(user);

  return {
    accessToken,
    refreshToken: accessToken,
    user,
  };
}

export async function verifyToken(token: string): Promise<User> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      sub?: string;
    };

    if (!decoded.sub) {
      throw createAuthError('Invalid token payload', 401);
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .limit(1);

    const userRow = userRows[0];
    if (!userRow) {
      throw createAuthError('User not found', 401);
    }

    return toPublicUser(userRow);
  } catch (error: any) {
    if (error.status === 401) {
      throw error;
    }

    throw createAuthError('Invalid token', 401);
  }
}

export async function getUserProfile(token: string): Promise<User> {
  return verifyToken(token);
}
