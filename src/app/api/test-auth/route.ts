import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const AUTH_BASE_URL = process.env.AUTH_BASE_URL || 'https://auth.bunch.codes/api';
const AUTH_API_KEY = process.env.AUTH_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('Testing auth service connection...');
    console.log('AUTH_BASE_URL:', AUTH_BASE_URL);
    console.log('AUTH_API_KEY:', AUTH_API_KEY ? 'SET' : 'NOT SET');

    // Test basic connectivity to the auth service
    const testUrl = `${AUTH_BASE_URL}/health`;
    
    try {
      const response = await axios.get(testUrl, {
        headers: {
          'x-api-key': AUTH_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      return NextResponse.json({
        success: true,
        message: 'Auth service is reachable',
        status: response.status,
        data: response.data
      });
    } catch (healthError: any) {
      console.log('Health check failed, trying registration endpoint directly...');
      
      // If health endpoint doesn't exist, try to get info about the registration endpoint
      try {
        const response = await axios.options(`${AUTH_BASE_URL}/auth/register`, {
          headers: {
            'x-api-key': AUTH_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 5000
        });
        
        return NextResponse.json({
          success: true,
          message: 'Registration endpoint is reachable via OPTIONS',
          status: response.status,
          headers: response.headers
        });
      } catch (optionsError: any) {
        return NextResponse.json({
          success: false,
          message: 'Auth service connection failed',
          error: {
            status: optionsError.response?.status,
            statusText: optionsError.response?.statusText,
            data: optionsError.response?.data,
            message: optionsError.message
          }
        }, { status: 503 });
      }
    }
  } catch (error: any) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test auth service',
      error: error.message
    }, { status: 500 });
  }
}