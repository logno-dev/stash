import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookmarks } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { fallbackVerifyToken } from '@/lib/fallback-auth';
import { extractPageTitle, extractDomain, generateNoteTitle } from '@/lib/utils';
import { desc, eq } from 'drizzle-orm';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    // First try the main auth service
    const user = await verifyToken(token);
    console.log('Token verified with main auth service');
    return user;
  } catch (authError) {
    console.log('Main auth service failed, trying fallback auth');
    try {
      // Fallback to local auth
      const user = await fallbackVerifyToken(token);
      console.log('Token verified with fallback auth');
      return user;
    } catch (fallbackError) {
      console.error('Both auth systems failed:', { authError, fallbackError });
      throw new Error('Invalid token');
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { url, notes = '', tags = '' } = body;
    
    if (!url && !notes.trim()) {
      return NextResponse.json(
        { error: 'Either URL or notes is required' },
        { status: 400 }
      );
    }

    let title: string;
    let domain: string;

    if (url) {
      title = await extractPageTitle(url);
      domain = extractDomain(url);
    } else {
      title = generateNoteTitle();
      domain = 'Notes';
    }
    
    const [bookmark] = await db.insert(bookmarks).values({
      url,
      title,
      notes,
      tags,
      domain,
      userId: user.id,
    }).returning();

    return NextResponse.json(bookmark, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Error adding bookmark:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add bookmark' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const all = searchParams.get('all');
    
    let results;
    if (all === 'true') {
      // Return all bookmarks for background loading
      results = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, user.id))
        .orderBy(desc(bookmarks.createdAt));
    } else if (limit) {
      // Return limited results for initial load
      const limitNum = parseInt(limit, 10);
      results = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, user.id))
        .orderBy(desc(bookmarks.createdAt))
        .limit(limitNum);
    } else {
      // Default behavior - return all (for backward compatibility)
      results = await db.select().from(bookmarks)
        .where(eq(bookmarks.userId, user.id))
        .orderBy(desc(bookmarks.createdAt));
    }
    
    // Group bookmarks by domain
    const grouped = results.reduce((acc: Record<string, typeof results>, bookmark) => {
      const domain = bookmark.domain;
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(bookmark);
      return acc;
    }, {});
    
    return NextResponse.json(grouped, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}