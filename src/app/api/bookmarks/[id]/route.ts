import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookmarks } from '@/lib/db/schema';
import { verifyToken } from '@/lib/auth';
import { fallbackVerifyToken } from '@/lib/fallback-auth';
import { extractPageTitle, extractDomain, generateNoteTitle } from '@/lib/utils';
import { eq } from 'drizzle-orm';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    
    const body = await request.json();
    const { url, notes = '', tags = '' } = body;
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
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
    
    const [updatedBookmark] = await db.update(bookmarks)
      .set({
        url,
        title,
        notes,
        tags,
        domain,
      })
      .where(eq(bookmarks.id, id))
      .returning();

    if (!updatedBookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedBookmark);
  } catch (error: any) {
    console.error('Error updating bookmark:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    const result = await db.delete(bookmarks)
      .where(eq(bookmarks.id, id));

    return NextResponse.json({ 
      success: true, 
      message: 'Bookmark deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting bookmark:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}