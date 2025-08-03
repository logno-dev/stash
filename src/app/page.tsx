'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import BookmarkList from '@/components/BookmarkList';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-muted mx-auto mb-4"></div>
          <p className="text-zinc-300">Loading Stash...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <BookmarkList /> : <Login />;
}
