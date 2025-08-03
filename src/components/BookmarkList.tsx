'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark } from '@/lib/db/schema';
import ConfirmationModal from './ConfirmationModal';

interface BookmarkFormData {
  url: string;
  notes: string;
  tags: string;
}

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState<Record<string, Bookmark[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<(Bookmark & BookmarkFormData) | null>(null);
  const [newBookmark, setNewBookmark] = useState<BookmarkFormData>({
    url: '',
    notes: '',
    tags: ''
  });
  const { logout, token } = useAuth();

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<{ id: number; title: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadBookmarks = async (searchTerm = '') => {
    try {
      const apiUrl = searchTerm ? `/api/bookmarks?search=${encodeURIComponent(searchTerm)}` : '/api/bookmarks';
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return;
        }
        throw new Error('Failed to load bookmarks');
      }

      const data = await response.json();
      setBookmarks(data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookmarks();
    }
  }, [token]);

  useEffect(() => {
    // Check for shared content from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrl = urlParams.get('url');
    const sharedTitle = urlParams.get('title');
    const sharedText = urlParams.get('text');
    
    if (sharedUrl || sharedTitle || sharedText) {
      setNewBookmark({
        url: sharedUrl || '',
        notes: sharedTitle || sharedText || '',
        tags: ''
      });
      setShowAddForm(true);
      
      // Clear URL parameters after processing
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      loadBookmarks(query);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    loadBookmarks();
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBookmark.notes.trim()) {
      setSuccessMessage('Please enter some notes');
      setShowSuccessModal(true);
      return;
    }

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: newBookmark.url.trim() || null,
          notes: newBookmark.notes.trim(),
          tags: newBookmark.tags.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bookmark');
      }

      setNewBookmark({ url: '', notes: '', tags: '' });
      setShowAddForm(false);
      setSuccessMessage('Bookmark added successfully!');
      setShowSuccessModal(true);
      loadBookmarks();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      setSuccessMessage('Failed to add bookmark. Please try again.');
      setShowSuccessModal(true);
    }
  };

  const handleDeleteBookmark = (bookmarkId: number, bookmarkTitle: string) => {
    setBookmarkToDelete({ id: bookmarkId, title: bookmarkTitle });
    setShowDeleteModal(true);
  };

  const confirmDeleteBookmark = async () => {
    if (!bookmarkToDelete) return;

    try {
      const response = await fetch(`/api/bookmarks/${bookmarkToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      setSuccessMessage('Bookmark deleted successfully!');
      setShowSuccessModal(true);
      loadBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      setSuccessMessage('Failed to delete bookmark. Please try again.');
      setShowSuccessModal(true);
    } finally {
      setBookmarkToDelete(null);
    }
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark({
      ...bookmark,
      url: bookmark.url || '',
      notes: bookmark.notes || '',
      tags: bookmark.tags || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBookmark) return;

    try {
      const response = await fetch(`/api/bookmarks/${editingBookmark.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: editingBookmark.url.trim() || null,
          notes: editingBookmark.notes.trim(),
          tags: editingBookmark.tags.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      setEditingBookmark(null);
      setShowEditForm(false);
      setSuccessMessage('Bookmark updated successfully!');
      setShowSuccessModal(true);
      loadBookmarks();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      setSuccessMessage('Failed to update bookmark. Please try again.');
      setShowSuccessModal(true);
    }
  };

  const renderBookmarkItem = (bookmark: Bookmark) => {
    const date = new Date(bookmark.createdAt || '').toLocaleDateString();
    const tags = bookmark.tags ? bookmark.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    return (
      <div 
        key={bookmark.id} 
        className="bg-stone-700 rounded-lg shadow-sm border border-stone-600 p-4 hover:shadow-md hover:bg-stone-600 transition-all cursor-pointer"
        onClick={() => handleEditBookmark(bookmark)}
      >
        <div className="mb-2">
          {bookmark.url ? (
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-orange-400 hover:text-orange-300 font-medium text-lg"
            >
              {bookmark.title}
            </a>
          ) : (
            <span className="font-medium text-lg text-white">{bookmark.title}</span>
          )}
        </div>
        
        {bookmark.url && (
          <div className="text-sm text-stone-400 mb-2 truncate">{bookmark.url}</div>
        )}
        
        {bookmark.notes && (
          <div className="text-stone-300 mb-3">{bookmark.notes}</div>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-block bg-orange-900 text-orange-200 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm text-stone-400">
          <div>Added: {date}</div>
          <button 
            className="text-red-400 hover:text-red-300 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBookmark(bookmark.id, bookmark.title);
            }}
            title="Delete bookmark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-stone-300">Loading bookmarks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <header className="bg-stone-800 shadow-sm border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 items-center">
              {/* Logo - first column, first row */}
              <h1 className="flex items-center text-xl font-bold text-white">
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 593 181" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-3"
                >
                  <g transform="matrix(1,0,0,1,-52.2572,-165.86)">
                    <g transform="matrix(0.1,0,0,-0.1,0,1715)">
                      <path 
                        d="M824,15376C655,15291 581,15145 608,14954C623,14856 659,14733 701,14642C717,14607 730,14577 730,14575C730,14564 810,14436 858,14370C1047,14110 1342,13925 1710,13836C2073,13749 2618,13749 3070,13836C3168,13855 3362,13916 3422,13946C3479,13975 3490,13975 3539,13950C3849,13792 4584,13724 5105,13806C5713,13902 6135,14233 6315,14755C6382,14948 6386,15099 6328,15214C6280,15308 6125,15410 6028,15410C5987,15410 5978,15406 5956,15378C5942,15359 5927,15319 5921,15286C5900,15173 5912,15143 5943,15230C5954,15259 5971,15287 5987,15297C6026,15323 6057,15299 6103,15211C6136,15147 6140,15130 6140,15067C6140,14949 6092,14868 5975,14784C5860,14703 5735,14658 5616,14657C5535,14656 5487,14674 5155,14830C5111,14851 5017,14896 4945,14930C4803,14998 4686,15053 4570,15107C4472,15152 4347,15193 4235,15215C4164,15229 4118,15231 4015,15227C3844,15219 3727,15185 3600,15107C3470,15027 3493,15030 3411,15084C3323,15143 3200,15193 3090,15216C2944,15245 2748,15229 2565,15172C2491,15149 2351,15085 1975,14905C1744,14794 1569,14715 1490,14684C1391,14646 1309,14647 1187,14688C1041,14737 924,14823 865,14924C806,15025 825,15177 910,15272C945,15311 949,15314 973,15303C999,15291 1040,15225 1040,15195C1040,15186 1045,15182 1050,15185C1075,15201 1050,15337 1013,15380C977,15423 916,15422 824,15376Z" 
                        fill="#F97316" 
                        stroke="#FB923C" 
                        strokeWidth="16"
                      />
                    </g>
                  </g>
                </svg>
                Stash
              </h1>
              
              {/* Logout - second column, first row on mobile; third column on large screens */}
              <button 
                onClick={logout} 
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors whitespace-nowrap justify-self-end sm:col-start-3"
              >
                Logout
              </button>
              
              {/* Search - spans both columns on mobile (second row); middle column on large screens */}
              <div className="relative col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                />
                {searchQuery && (
                  <button 
                    onClick={clearSearch} 
                    className="absolute right-2 top-2 text-stone-400 hover:text-stone-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.keys(bookmarks).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-stone-400 text-lg">No bookmarks found</div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(bookmarks)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([domain, domainBookmarks]) => (
                <div key={domain} className="bg-stone-800 rounded-lg shadow-sm border border-stone-700">
                  <div className="bg-stone-700 px-6 py-4 border-b border-stone-600 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">{domain}</h2>
                      <span className="bg-orange-900 text-orange-200 text-sm px-2 py-1 rounded-full">
                        {domainBookmarks.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      {domainBookmarks.map(renderBookmarkItem)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Add Button */}
      <button 
        className="fixed bottom-6 right-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-colors"
        onClick={() => setShowAddForm(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Add Form Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}
        >
          <div className="bg-stone-800 rounded-lg shadow-xl w-full max-w-md border border-stone-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add Bookmark or Note</h3>
              <form onSubmit={handleAddBookmark} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newBookmark.notes}
                    onChange={(e) => setNewBookmark({...newBookmark, notes: e.target.value})}
                    placeholder="Add your notes here..."
                    required
                    rows={4}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newBookmark.tags}
                    onChange={(e) => setNewBookmark({...newBookmark, tags: e.target.value})}
                    placeholder="work, reference, tutorial"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="flex-1 bg-stone-600 text-stone-200 py-2 px-4 rounded-md hover:bg-stone-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingBookmark && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowEditForm(false)}
        >
          <div className="bg-stone-800 rounded-lg shadow-xl w-full max-w-md border border-stone-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Bookmark</h3>
              <form onSubmit={handleUpdateBookmark} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    value={editingBookmark.url}
                    onChange={(e) => setEditingBookmark({...editingBookmark, url: e.target.value})}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editingBookmark.notes}
                    onChange={(e) => setEditingBookmark({...editingBookmark, notes: e.target.value})}
                    placeholder="Add your notes here..."
                    rows={4}
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingBookmark.tags}
                    onChange={(e) => setEditingBookmark({...editingBookmark, tags: e.target.value})}
                    placeholder="work, reference, tutorial"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Update
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowEditForm(false)} 
                    className="flex-1 bg-stone-600 text-stone-200 py-2 px-4 rounded-md hover:bg-stone-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBookmarkToDelete(null);
        }}
        onConfirm={confirmDeleteBookmark}
        title="Delete Bookmark"
        message={`Are you sure you want to delete "${bookmarkToDelete?.title}"? This action cannot be undone.`}
        type="warning"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Success/Error Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successMessage.includes('Failed') || successMessage.includes('Please enter') ? 'Error' : 'Success'}
        message={successMessage}
        type={successMessage.includes('Failed') || successMessage.includes('Please enter') ? 'error' : 'success'}
        showConfirmButton={false}
      />
    </div>
  );
};

export default BookmarkList;