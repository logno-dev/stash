'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import BookmarkList from '@/components/BookmarkList';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-stone-300">Loading Stash...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <BookmarkList /> : <Login />;
}
