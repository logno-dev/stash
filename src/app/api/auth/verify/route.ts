import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { fallbackVerifyToken } from '@/lib/fallback-auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    try {
      const user = await verifyToken(token);
      
      return NextResponse.json({
        authenticated: true,
        user,
      });
    } catch (authError: any) {
      console.log('Main auth service failed, trying fallback authentication');
      try {
        // Use fallback authentication
        const user = await fallbackVerifyToken(token);
        
        return NextResponse.json({
          authenticated: true,
          user,
        });
      } catch (fallbackError) {
        console.error('Both auth systems failed:', { authError, fallbackError });
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
    }
  } catch (error: any) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}