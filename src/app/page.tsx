'use client';

import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import BookmarkList from '@/components/BookmarkList';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-muted mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading Stash...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <BookmarkList /> : <Login />;
}
