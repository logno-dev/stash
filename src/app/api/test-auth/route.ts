import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET(request: NextRequest) {
  try {
    const dbUrl = process.env.TURSO_DATABASE_URL;
    const dbToken = process.env.TURSO_AUTH_TOKEN;

    if (!dbUrl || !dbToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database environment variables are not configured',
          error: {
            missing: {
              TURSO_DATABASE_URL: !dbUrl,
              TURSO_AUTH_TOKEN: !dbToken,
            },
          },
        },
        { status: 503 }
      );
    }

    const client = createClient({
      url: dbUrl,
      authToken: dbToken,
    });

    try {
      const ping = await client.execute('SELECT 1 as ok');
      const usersTable = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");

      return NextResponse.json({
        success: true,
        message: 'Local auth system is reachable',
        ping: ping.rows,
        tables: {
          usersTablePresent: usersTable.rows.length > 0,
        },
      });
    } catch (dbError: any) {
      return NextResponse.json(
        {
          success: false,
          message: 'Auth database check failed',
          error: {
            status: dbError?.code,
            message: dbError?.message,
          },
        },
        { status: 503 }
      );
    } finally {
      client.close();
    }
  } catch (error: any) {
    console.error('Test auth error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test local auth system',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
