import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { fallbackRegisterUser } from '@/lib/fallback-auth';

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

    try {
      const registerResponse = await registerUser({
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
      });
      
      // Registration successful, but user needs to verify email
      // Return a success response that indicates email verification is needed
      return NextResponse.json({
        success: true,
        message: registerResponse.message,
        userId: registerResponse.userId,
        requiresVerification: true
      });
    } catch (authError: any) {
      console.log('Auth service failed, using fallback authentication');
      console.log('Auth error details:', {
        status: authError.response?.status,
        statusText: authError.response?.statusText,
        url: authError.config?.url,
        baseURL: authError.config?.baseURL
      });
      
      try {
        // Use fallback authentication
        const fallbackResponse = await fallbackRegisterUser({
          email,
          password,
          confirmPassword,
          firstName,
          lastName,
        });
        
        return NextResponse.json({
          success: true,
          message: fallbackResponse.message + ' (using fallback auth - auth service unavailable)',
          userId: fallbackResponse.userId,
          requiresVerification: false, // No email verification in fallback
          usingFallback: true
        });
      } catch (fallbackError: any) {
        if (fallbackError.status === 409) {
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 409 }
          );
        }
        throw fallbackError;
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.response?.status === 400) {
      return NextResponse.json(
        { error: error.response.data.error || 'Registration failed' },
        { status: 400 }
      );
    }
    
    if (error.response?.status === 405) {
      return NextResponse.json(
        { error: 'Registration endpoint not available. Please check your auth service configuration.' },
        { status: 503 }
      );
    }
    
    if (error.response?.status === 409 || error.response?.data?.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please try logging in instead.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}