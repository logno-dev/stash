import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './BookmarkList.css';

const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [newBookmark, setNewBookmark] = useState({
    url: '',
    notes: '',
    tags: ''
  });
  const { logout, token } = useAuth();

  const loadBookmarks = async (searchTerm = '') => {
    try {
      const apiUrl = searchTerm ? `/api/bookmarks?search=${encodeURIComponent(searchTerm)}` : '/api/bookmarks';
      console.log('Making request with token:', token);
      console.log('Axios default headers:', axios.defaults.headers.common);
      const response = await axios.get(apiUrl);
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      console.error('Request headers that were sent:', error.config?.headers);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // Add a small delay to ensure axios headers are set
      setTimeout(() => {
        loadBookmarks();
      }, 100);
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

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      loadBookmarks(query);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    loadBookmarks();
  };

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    
    if (!newBookmark.notes.trim()) {
      alert('Please enter some notes');
      return;
    }

    try {
      const response = await axios.post('/api/bookmarks', {
        url: newBookmark.url.trim() || null,
        notes: newBookmark.notes.trim(),
        tags: newBookmark.tags.trim()
      });
      
      console.log('Bookmark creation response:', response);

      setNewBookmark({ url: '', notes: '', tags: '' });
      setShowAddForm(false);
      loadBookmarks();
    } catch (error) {
      console.error('Error adding bookmark:', error);
      console.error('Error response:', error.response);
      alert('Failed to add bookmark');
    }
  };

  const handleDeleteBookmark = async (bookmarkId, bookmarkTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${bookmarkTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/bookmarks/${bookmarkId}`);
      loadBookmarks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      alert('Failed to delete bookmark');
    }
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark({
      id: bookmark.id,
      url: bookmark.url || '',
      notes: bookmark.notes || '',
      tags: bookmark.tags || ''
    });
    setShowEditForm(true);
  };

  const handleUpdateBookmark = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/bookmarks/${editingBookmark.id}`, {
        url: editingBookmark.url.trim() || null,
        notes: editingBookmark.notes.trim(),
        tags: editingBookmark.tags.trim()
      });

      setEditingBookmark(null);
      setShowEditForm(false);
      loadBookmarks(); // Refresh the list
    } catch (error) {
      console.error('Error updating bookmark:', error);
      alert('Failed to update bookmark');
    }
  };

  const renderBookmarkItem = (bookmark) => {
    const date = new Date(bookmark.created_at).toLocaleDateString();
    const tags = bookmark.tags ? bookmark.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    return (
      <div key={bookmark.id} className="bookmark-item" onClick={() => handleEditBookmark(bookmark)}>
        <div className="bookmark-title">
          {bookmark.url ? (
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {bookmark.title}
            </a>
          ) : (
            <span>{bookmark.title}</span>
          )}
        </div>
        
        {bookmark.url && (
          <div className="bookmark-url">{bookmark.url}</div>
        )}
        
        {bookmark.notes && (
          <div className="bookmark-notes">{bookmark.notes}</div>
        )}
        
        {tags.length > 0 && (
          <div className="bookmark-tags">
            {tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
        
        <div className="bookmark-footer">
          <div className="bookmark-date">Added: {date}</div>
          <button 
            className="delete-button"
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
      <div className="loading-container">
        <div className="loading">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="bookmark-app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <svg width="32" height="32" viewBox="0 0 593 181" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1,0,0,1,-52.2572,-165.86)">
                <g transform="matrix(0.1,0,0,-0.1,0,1715)">
                  <path d="M824,15376C655,15291 581,15145 608,14954C623,14856 659,14733 701,14642C717,14607 730,14577 730,14575C730,14564 810,14436 858,14370C1047,14110 1342,13925 1710,13836C2073,13749 2618,13749 3070,13836C3168,13855 3362,13916 3422,13946C3479,13975 3490,13975 3539,13950C3849,13792 4584,13724 5105,13806C5713,13902 6135,14233 6315,14755C6382,14948 6386,15099 6328,15214C6280,15308 6125,15410 6028,15410C5987,15410 5978,15406 5956,15378C5942,15359 5927,15319 5921,15286C5900,15173 5912,15143 5943,15230C5954,15259 5971,15287 5987,15297C6026,15323 6057,15299 6103,15211C6136,15147 6140,15130 6140,15067C6140,14949 6092,14868 5975,14784C5860,14703 5735,14658 5616,14657C5535,14656 5487,14674 5155,14830C5111,14851 5017,14896 4945,14930C4803,14998 4686,15053 4570,15107C4472,15152 4347,15193 4235,15215C4164,15229 4118,15231 4015,15227C3844,15219 3727,15185 3600,15107C3470,15027 3493,15030 3411,15084C3323,15143 3200,15193 3090,15216C2944,15245 2748,15229 2565,15172C2491,15149 2351,15085 1975,14905C1744,14794 1569,14715 1490,14684C1391,14646 1309,14647 1187,14688C1041,14737 924,14823 865,14924C806,15025 825,15177 910,15272C945,15311 949,15314 973,15303C999,15291 1040,15225 1040,15195C1040,15186 1045,15182 1050,15185C1075,15201 1050,15337 1013,15380C977,15423 916,15422 824,15376Z" 
                        fill="white" 
                        stroke="black" 
                        strokeWidth="16"/>
                </g>
              </g>
            </svg>
            Stash
          </h1>
          
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="clear-search">
                  Clear
                </button>
              )}
            </div>
            
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {Object.keys(bookmarks).length === 0 ? (
          <div className="empty-state">
            <p>No bookmarks found</p>
          </div>
        ) : (
          <div className="bookmark-groups">
            {Object.entries(bookmarks)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([domain, domainBookmarks]) => (
                <div key={domain} className="domain-group">
                  <div className="domain-header">
                    <span className="domain-name">{domain}</span>
                    <span className="bookmark-count">{domainBookmarks.length}</span>
                  </div>
                  <div className="bookmarks-list">
                    {domainBookmarks.map(renderBookmarkItem)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      <button 
        className="add-button"
        onClick={() => setShowAddForm(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Bookmark or Note</h3>
            <form onSubmit={handleAddBookmark}>
              <div className="form-group">
                <label>URL (optional):</label>
                <input
                  type="url"
                  value={newBookmark.url}
                  onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={newBookmark.notes}
                  onChange={(e) => setNewBookmark({...newBookmark, notes: e.target.value})}
                  placeholder="Add your notes here..."
                  required
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Tags (comma separated):</label>
                <input
                  type="text"
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark({...newBookmark, tags: e.target.value})}
                  placeholder="work, reference, tutorial"
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="save-button">Save</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editingBookmark && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Bookmark</h3>
            <form onSubmit={handleUpdateBookmark}>
              <div className="form-group">
                <label>URL (optional):</label>
                <input
                  type="url"
                  value={editingBookmark.url}
                  onChange={(e) => setEditingBookmark({...editingBookmark, url: e.target.value})}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={editingBookmark.notes}
                  onChange={(e) => setEditingBookmark({...editingBookmark, notes: e.target.value})}
                  placeholder="Add your notes here..."
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label>Tags (comma separated):</label>
                <input
                  type="text"
                  value={editingBookmark.tags}
                  onChange={(e) => setEditingBookmark({...editingBookmark, tags: e.target.value})}
                  placeholder="work, reference, tutorial"
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="save-button">Update</button>
                <button type="button" onClick={() => setShowEditForm(false)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkList;