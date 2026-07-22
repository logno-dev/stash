import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, firstName, lastName } = body;

    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

      const registerResponse = await registerUser({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
      });

      return NextResponse.json({
        success: true,
        message: registerResponse.message,
        userId: registerResponse.userId,
        requiresVerification: false,
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.status === 400) {
        return NextResponse.json(
          { error: error.message || 'Registration failed' },
          { status: 400 }
        );
      }

      if (error.status === 409 || error.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please try logging in instead.' },
          { status: 409 }
        );
      }

      if (error.status === 401) {
        return NextResponse.json(
          { error: error.message || 'Invalid credentials' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
