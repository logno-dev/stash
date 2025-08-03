import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { fallbackLoginUser } from '@/lib/fallback-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    // Accept either email or username field
    const loginEmail = email || username;

    if (!loginEmail || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    try {
      const authResponse = await loginUser({ email: loginEmail, password });
      
      return NextResponse.json({
        token: authResponse.accessToken,
        user: authResponse.user,
        message: 'Login successful'
      });
    } catch (authError: any) {
      console.log('Auth service failed, using fallback authentication');
      
      // Use fallback authentication
      const fallbackResponse = await fallbackLoginUser({ email: loginEmail, password });
      
      return NextResponse.json({
        token: fallbackResponse.accessToken,
        user: fallbackResponse.user,
        message: 'Login successful (using fallback auth)'
      });
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    
    if (error && typeof error === 'object' && 'response' in error && 
        (error as any).response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}