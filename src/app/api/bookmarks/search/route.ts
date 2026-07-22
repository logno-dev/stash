import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookmarks } from '@/lib/db/schema';

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

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    return await verifyToken(token);
  } catch {
    throw new Error('Invalid token');
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const parsedLimit = Number.parseInt(limitParam ?? '1000', 10);
    const limit = Number.isNaN(parsedLimit) ? 1000 : Math.min(Math.max(parsedLimit, 1), 5000);

    const results = await db
      .select({
        id: bookmarks.id,
        title: bookmarks.title,
        url: bookmarks.url,
        notes: bookmarks.notes,
        tags: bookmarks.tags,
        domain: bookmarks.domain,
        createdAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, user.id))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit);

    return NextResponse.json({ bookmarks: results }, { headers: CORS_HEADERS });
  } catch (error: any) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
    }

    console.error('Error fetching bookmarks for extension:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks for extension' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
