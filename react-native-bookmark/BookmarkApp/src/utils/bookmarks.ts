import { Bookmark } from '../types';
import { storage } from './storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

async function getAuthHeaders() {
  const token = await storage.getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const bookmarkService = {
  async getAllBookmarks(searchQuery?: string): Promise<Record<string, Bookmark[]>> {
    try {
      const headers = await getAuthHeaders();
      const url = searchQuery 
        ? `${API_BASE_URL}${API_ENDPOINTS.BOOKMARKS}?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}${API_ENDPOINTS.BOOKMARKS}`;
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }
      
      const data = await response.json();
      
      // Cache the bookmarks locally for offline access
      const flatBookmarks = Object.values(data).flat() as Bookmark[];
      await storage.setBookmarks(flatBookmarks);
      
      return data;
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      // Fallback to local storage if API fails
      const localBookmarks = await storage.getBookmarks();
      return this.groupBookmarksByDomain(localBookmarks);
    }
  },

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKMARKS}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: bookmark.url || null,
          notes: bookmark.title, // Using title as notes for API compatibility
          tags: bookmark.tags || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bookmark');
      }

      const newBookmark = await response.json();
      return newBookmark;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  },

  async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKMARK_BY_ID(id)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          url: updates.url || null,
          notes: updates.title || updates.notes, // Using title as notes for API compatibility
          tags: updates.tags || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      const updatedBookmark = await response.json();
      return updatedBookmark;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  },

  async deleteBookmark(id: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKMARK_BY_ID(id)}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  },

  groupBookmarksByDomain(bookmarks: Bookmark[]): Record<string, Bookmark[]> {
    return bookmarks.reduce((groups, bookmark) => {
      const domain = bookmark.domain;
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(bookmark);
      return groups;
    }, {} as Record<string, Bookmark[]>);
  },
};