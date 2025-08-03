import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookmarks } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { fallbackVerifyToken } from '@/lib/fallback-auth';
import { extractPageTitle, extractDomain, generateNoteTitle } from '@/lib/utils';
import { desc, or, like } from 'drizzle-orm';

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
    await requireAuth(request);
    
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
    }).returning();

    return NextResponse.json(bookmark);
  } catch (error: any) {
    console.error('Error adding bookmark:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add bookmark' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let results;
    if (search) {
      const searchTerm = `%${search}%`;
      results = await db.select().from(bookmarks)
        .where(
          or(
            like(bookmarks.title, searchTerm),
            like(bookmarks.url, searchTerm),
            like(bookmarks.notes, searchTerm),
            like(bookmarks.tags, searchTerm)
          )
        )
        .orderBy(desc(bookmarks.createdAt));
    } else {
      results = await db.select().from(bookmarks)
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
    
    return NextResponse.json(grouped);
  } catch (error: any) {
    console.error('Error fetching bookmarks:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}