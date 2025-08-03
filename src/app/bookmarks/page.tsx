import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import BookmarkList from '@/components/BookmarkList';

export default async function BookmarksPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    await verifyToken(token);
    return <BookmarkList />;
  } catch (error) {
    redirect('/');
  }
}