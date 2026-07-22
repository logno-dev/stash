import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const user = await verifyToken(token);

    return NextResponse.json({
      authenticated: true,
      user,
    }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401, headers: CORS_HEADERS }
    );
  }
}
