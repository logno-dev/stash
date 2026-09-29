'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark } from '@/lib/db/schema';
import ConfirmationModal from './ConfirmationModal';
import MarkdownEditor from './MarkdownEditor';
import Fuse from 'fuse.js';

interface BookmarkFormData {
  url: string;
  notes: string;
  tags: string;
}

const INITIAL_LOAD_COUNT = 20;
const CHUNK_SIZE = 10;

const BookmarkList = () => {
  // Data states
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [displayedBookmarks, setDisplayedBookmarks] = useState<Record<string, Bookmark[]>>({});
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Bookmark> | null>(null);
  const [showNotesOnly, setShowNotesOnly] = useState(false);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<number | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [detailSaveState, setDetailSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<(Bookmark & BookmarkFormData) | null>(null);
  const [newBookmark, setNewBookmark] = useState<BookmarkFormData>({
    url: '',
    notes: '',
    tags: ''
  });

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<{ id: number; title: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { logout, token } = useAuth();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Initialize Fuse.js for fuzzy search
  const initializeFuse = useCallback((bookmarks: Bookmark[]) => {
    const fuseOptions = {
      keys: ['title', 'url', 'notes', 'tags'],
      threshold: 0.3,
      includeScore: true,
    };
    setFuse(new Fuse(bookmarks, fuseOptions));
  }, []);

  // Group bookmarks by domain
  const groupBookmarksByDomain = useCallback((bookmarks: Bookmark[]) => {
    return bookmarks.reduce((acc: Record<string, Bookmark[]>, bookmark) => {
      const domain = bookmark.domain;
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(bookmark);
      return acc;
    }, {});
  }, []);

  // Apply filters to bookmarks
  const applyFilters = useCallback((bookmarks: Bookmark[]) => {
    let filtered = bookmarks;

    // Apply notes-only filter
    if (showNotesOnly) {
      filtered = filtered.filter(bookmark => !bookmark.url || bookmark.url.trim() === '');
    }

    return filtered;
  }, [showNotesOnly]);

  // Load initial bookmarks (limited)
  const loadInitialBookmarks = async () => {
    try {
      const response = await fetch(`/api/bookmarks?limit=${INITIAL_LOAD_COUNT}`, {
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
      const bookmarksList = Object.values(data).flat() as Bookmark[];

      setDisplayedBookmarks(data);
      const filteredList = applyFilters(bookmarksList);
      setFilteredBookmarks(filteredList);
      setVisibleCount(filteredList.length);
    } catch (error) {
      console.error('Error loading initial bookmarks:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Load all bookmarks in background
  const loadAllBookmarks = async () => {
    try {
      setBackgroundLoading(true);
      const response = await fetch('/api/bookmarks?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load all bookmarks');
      }

      const data = await response.json();
      const bookmarksList = Object.values(data).flat() as Bookmark[];

      setAllBookmarks(bookmarksList);
      initializeFuse(bookmarksList);

      // If no search is active, update filtered bookmarks
      if (!searchQuery) {
        const filteredList = applyFilters(bookmarksList);
        setFilteredBookmarks(filteredList);
      }
    } catch (error) {
      console.error('Error loading all bookmarks:', error);
    } finally {
      setBackgroundLoading(false);
    }
  };

  // Handle search with fuzzy matching
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      const filteredList = applyFilters(allBookmarks);
      setFilteredBookmarks(filteredList);
      setVisibleCount(Math.min(INITIAL_LOAD_COUNT, filteredList.length));
    } else if (fuse) {
      const results = fuse.search(query);
      const searchResults = results.map(result => result.item);
      const filteredResults = applyFilters(searchResults);
      setFilteredBookmarks(filteredResults);
      setVisibleCount(filteredResults.length);
    }
  }, [allBookmarks, fuse, applyFilters]);

  // Handle filter toggle
  const handleFilterToggle = useCallback(() => {
    setShowNotesOnly(!showNotesOnly);
  }, [showNotesOnly]);

  // Load more bookmarks for infinite scroll
  const loadMoreBookmarks = useCallback(() => {
    if (loadingMore || searchQuery) return; // Don't load more during search

    setLoadingMore(true);
    setTimeout(() => {
      const newVisibleCount = Math.min(
        visibleCount + CHUNK_SIZE,
        filteredBookmarks.length
      );
      setVisibleCount(newVisibleCount);
      setLoadingMore(false);
    }, 100); // Small delay to show loading state
  }, [loadingMore, searchQuery, visibleCount, filteredBookmarks.length]);

  // Update displayed bookmarks when visible count or filtered bookmarks change
  useEffect(() => {
    const visibleBookmarks = filteredBookmarks.slice(0, visibleCount);
    const grouped = groupBookmarksByDomain(visibleBookmarks);
    setDisplayedBookmarks(grouped);
  }, [filteredBookmarks, visibleCount, groupBookmarksByDomain]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !searchQuery && visibleCount < filteredBookmarks.length) {
          loadMoreBookmarks();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreBookmarks, searchQuery, visibleCount, filteredBookmarks.length]);

  // Initial load
  useEffect(() => {
    if (token) {
      loadInitialBookmarks();
      // Start background loading after a short delay
      setTimeout(() => {
        loadAllBookmarks();
      }, 100);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Update filters when showNotesOnly changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      const filteredList = applyFilters(allBookmarks);
      setFilteredBookmarks(filteredList);
      setVisibleCount(Math.min(INITIAL_LOAD_COUNT, filteredList.length));
    }
  }, [showNotesOnly, searchQuery, allBookmarks, handleSearch, applyFilters]);

  const visibleBookmarks = Object.values(displayedBookmarks).flat();
  const selectedBookmark = allBookmarks.find(bookmark => bookmark.id === selectedBookmarkId)
    || visibleBookmarks.find(bookmark => bookmark.id === selectedBookmarkId)
    || null;
  const hasUnsavedChanges = Boolean(editingBookmark && selectedBookmark && (
    editingBookmark.url !== (selectedBookmark.url || '')
    || editingBookmark.notes !== (selectedBookmark.notes || '')
    || editingBookmark.tags !== (selectedBookmark.tags || '')
  ));

  useEffect(() => {
    if (selectedBookmarkId === null || !selectedBookmark) {
      setSelectedBookmarkId(visibleBookmarks[0]?.id ?? null);
      setShowMobileDetail(false);
    }
  }, [displayedBookmarks, selectedBookmarkId, selectedBookmark]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedBookmark && editingBookmark?.id !== selectedBookmark.id) {
      setEditingBookmark({
        ...selectedBookmark,
        url: selectedBookmark.url || '',
        notes: selectedBookmark.notes || '',
        tags: selectedBookmark.tags || ''
      });
      setDetailSaveState('idle');
    }
  }, [selectedBookmark?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    handleSearch(query);
  };

  const clearSearch = () => {
    handleSearch('');
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

      // Reload data after adding
      loadInitialBookmarks();
      loadAllBookmarks();
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

      if (bookmarkToDelete.id === selectedBookmarkId) {
        setSelectedBookmarkId(visibleBookmarks.find(bookmark => bookmark.id !== bookmarkToDelete.id)?.id ?? null);
        setEditingBookmark(null);
        setShowMobileDetail(false);
      }
      setSuccessMessage('Bookmark deleted successfully!');
      setShowSuccessModal(true);

      // Reload data after deleting
      loadInitialBookmarks();
      loadAllBookmarks();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      setSuccessMessage('Failed to delete bookmark. Please try again.');
      setShowSuccessModal(true);
    } finally {
      setBookmarkToDelete(null);
    }
  };

  const handleUpdateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBookmark) return;

    try {
      setDetailSaveState('saving');
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

      const updatedBookmark = await response.json() as Bookmark;
      setEditingBookmark({
        ...updatedBookmark,
        url: updatedBookmark.url || '',
        notes: updatedBookmark.notes || '',
        tags: updatedBookmark.tags || ''
      });
      setAllBookmarks(current => current.map(bookmark => bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark));
      setDetailSaveState('saved');

      // Reload data after updating
      loadInitialBookmarks();
      loadAllBookmarks();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      setDetailSaveState('idle');
      setSuccessMessage('Failed to update bookmark. Please try again.');
      setShowSuccessModal(true);
    }
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    if (bookmark.id !== selectedBookmarkId && hasUnsavedChanges && !window.confirm('Discard your unsaved changes?')) {
      return;
    }
    setSelectedBookmarkId(bookmark.id);
    setShowMobileDetail(true);
  };

  const renderBookmarkItem = (bookmark: Bookmark) => {
    const date = new Date(bookmark.createdAt || '').toLocaleDateString();
    const isSelected = selectedBookmarkId === bookmark.id;

    return (
      <button
        type="button"
        key={bookmark.id}
        aria-selected={isSelected}
        className={`mb-1 w-full overflow-hidden rounded-md border px-3 py-2.5 text-left transition-colors last:mb-0 ${
          isSelected
            ? 'border-slate-500 bg-slate-700/80'
            : 'border-transparent bg-transparent hover:border-slate-700 hover:bg-slate-800/70'
        }`}
        onClick={() => handleBookmarkClick(bookmark)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{bookmark.title}</span>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
            {bookmark.url ? 'Link' : 'Note'}
          </span>
        </div>
        <div className="mt-1 line-clamp-2 min-h-5 text-xs leading-relaxed text-slate-400">
          {bookmark.notes?.trim() || bookmark.url || 'Empty note'}
        </div>
        <div className="mt-1.5 text-[11px] text-slate-500">{date}</div>
      </button>
    );
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-muted mx-auto mb-4"></div>
          <div className="text-text-secondary">Loading bookmarks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <header className="sticky top-0 z-40 border-b border-slate-700/80" style={{ backgroundColor: 'var(--header-bg)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-5 lg:px-6">
          <div className="py-2">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 sm:gap-3 items-center">
              {/* Logo - first column */}
              <h1 className="flex items-center text-lg sm:text-xl font-semibold text-white min-w-0">
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
                          fill="var(--text-primary)"
                          stroke="var(--text-secondary)"
                          strokeWidth="16"
                        />
                    </g>
                  </g>
                </svg>
              </h1>

              {/* Search - middle column */}
              <div className="relative min-w-0">
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                    value={searchQuery}
                    onChange={handleSearchInput}
                    className="w-full px-3 py-2 bg-input-bg border border-input-border text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 placeholder-text-muted text-sm"
                  />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              {/* Logout - third column */}
              <button
                onClick={logout}
                className="justify-self-end border border-slate-600 rounded-md text-text-secondary px-2.5 py-2 hover:border-slate-400 hover:text-text-primary"
                aria-label="Logout"
                title="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                  <path d="M13 21H6A2 2 0 0 1 4 19V5a2 2 0 0 1 2-2h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter section */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-5 lg:px-6">
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFilterToggle}
              aria-pressed={showNotesOnly}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs transition-all duration-150 sm:text-sm ${showNotesOnly
                ? 'bg-slate-700 border-slate-500 text-slate-100 shadow-sm'
                : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500'
              }`}
            >
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-current text-[10px]">
                {showNotesOnly ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="8"></circle>
                  </svg>
                )}
              </span>
              <span className="font-medium">Notes Only</span>
            </button>

            {showNotesOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs rounded-full border border-slate-700 text-slate-400 bg-slate-800/40">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
                Items without URLs
              </span>
            )}
          </div>

          <div className="text-xs sm:text-sm text-slate-500">
            {filteredBookmarks.length} item{filteredBookmarks.length === 1 ? '' : 's'}
            {searchQuery && ` matching "${searchQuery}"`}
            {showNotesOnly && !searchQuery && ' (notes only)'}
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-5 lg:px-6 py-4">
        {Object.keys(displayedBookmarks).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg">
              {searchQuery
                ? 'No bookmarks match your search'
                : showNotesOnly
                  ? 'No notes found'
                  : 'No bookmarks found'
              }
            </div>
            {backgroundLoading && !searchQuery && (
              <div className="text-slate-500 text-sm mt-2">Loading more bookmarks...</div>
            )}
          </div>
        ) : (
          <div className="lg:grid lg:h-[calc(100dvh-9.5rem)] lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-4">
            <section className={`${showMobileDetail ? 'hidden lg:block' : 'block'} overflow-hidden rounded-lg border border-slate-700/80 bg-card-bg-secondary lg:overflow-y-auto`}>
              <div className="space-y-1 p-2">
                {Object.entries(displayedBookmarks)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([domain, domainBookmarks]) => (
                    <div key={domain}>
                      <div className="sticky top-0 z-10 flex items-center justify-between bg-card-bg-secondary px-2 pb-1 pt-3">
                        <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">{domain}</h2>
                        <span className="text-[11px] text-slate-500">{(domainBookmarks as Bookmark[]).length}</span>
                      </div>
                      {(domainBookmarks as Bookmark[]).map(renderBookmarkItem)}
                    </div>
                  ))}

                {!searchQuery && visibleCount < filteredBookmarks.length && (
                  <div ref={loadMoreRef} className="py-6 text-center text-sm text-slate-500">
                    {loadingMore ? 'Loading more...' : 'Scroll to load more...'}
                  </div>
                )}

                {searchQuery && (
                  <div className="py-4 text-center text-xs text-slate-500">
                    {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </section>

            <section className={`${showMobileDetail ? 'block' : 'hidden lg:block'} min-w-0 overflow-hidden rounded-lg border border-slate-700/80 bg-card-bg-secondary`}>
              {selectedBookmark && editingBookmark?.id === selectedBookmark.id ? (
                <form onSubmit={handleUpdateBookmark} className="mx-auto flex h-full min-h-[70dvh] max-w-5xl flex-col px-5 py-5 sm:px-8 lg:min-h-0 lg:px-10 lg:py-7">
                  <button
                    type="button"
                    onClick={() => {
                      if (!hasUnsavedChanges || window.confirm('Discard your unsaved changes?')) {
                        if (hasUnsavedChanges) {
                          setEditingBookmark({
                            ...selectedBookmark,
                            url: selectedBookmark.url || '',
                            notes: selectedBookmark.notes || '',
                            tags: selectedBookmark.tags || ''
                          });
                        }
                        setShowMobileDetail(false);
                      }
                    }}
                    className="mb-5 text-sm text-slate-400 hover:text-white lg:hidden"
                  >
                    ← Back to notes
                  </button>
                  <div className="flex items-start gap-4 border-b border-slate-700/70 pb-5">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                        {selectedBookmark.url ? selectedBookmark.domain : 'Note'} · {new Date(selectedBookmark.createdAt || '').toLocaleDateString()}
                      </div>
                      <h2 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">{selectedBookmark.title}</h2>
                      {editingBookmark.url && (
                        <a
                          href={editingBookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 block break-all text-sm text-slate-400 hover:text-white"
                        >
                          {editingBookmark.url} ↗
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="submit"
                        disabled={!hasUnsavedChanges || detailSaveState === 'saving'}
                        className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:cursor-default disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        {detailSaveState === 'saving' ? 'Saving...' : detailSaveState === 'saved' && !hasUnsavedChanges ? 'Saved' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBookmark(selectedBookmark.id, selectedBookmark.title)}
                        className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="min-h-64 flex-1 py-3 lg:min-h-0">
                    <MarkdownEditor
                      key={selectedBookmark.id}
                      value={editingBookmark.notes}
                      onChange={(notes) => {
                        setEditingBookmark({ ...editingBookmark, notes });
                        setDetailSaveState('idle');
                      }}
                      rows={18}
                      showHelp={false}
                      fillHeight
                      seamless
                    />
                  </div>

                  <details className="shrink-0 border-t border-slate-700/70 pt-4">
                    <summary className="cursor-pointer text-sm text-slate-400 hover:text-white">Bookmark details</summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-xs font-medium text-slate-300">
                        URL (optional)
                        <input
                          type="url"
                          value={editingBookmark.url}
                          onChange={(event) => {
                            setEditingBookmark({ ...editingBookmark, url: event.target.value });
                            setDetailSaveState('idle');
                          }}
                          placeholder="https://example.com"
                          className="mt-1 block w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-300">
                        Tags (comma separated)
                        <input
                          type="text"
                          value={editingBookmark.tags}
                          onChange={(event) => {
                            setEditingBookmark({ ...editingBookmark, tags: event.target.value });
                            setDetailSaveState('idle');
                          }}
                          placeholder="work, reference, tutorial"
                          className="mt-1 block w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                      </label>
                    </div>
                  </details>
                </form>
              ) : (
                <div className="flex h-full min-h-80 items-center justify-center p-8 text-slate-500">Select a note or bookmark</div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Add Button */}
      <button
        className="fixed bottom-5 right-5 bg-slate-700 text-white p-3 rounded-full shadow-sm hover:bg-slate-600 transition-colors duration-200"
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
            <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-md border border-slate-700 bg-card-bg-secondary shadow-lg" style={{ backgroundColor: 'var(--card-bg-secondary)' }}>
            <div className="p-3">
              <h3 className="text-sm font-semibold text-white mb-2">Add Bookmark or Note</h3>
              <form onSubmit={handleAddBookmark} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newBookmark.url}
                    onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-input-bg border border-input-border text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 placeholder-text-muted"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Notes
                  </label>
                    <MarkdownEditor
                      value={newBookmark.notes}
                      onChange={(value) => setNewBookmark({ ...newBookmark, notes: value })}
                      required
                      rows={10}
                      showHelp={false}
                    />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newBookmark.tags}
                    onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                    placeholder="work, reference, tutorial"
                    className="w-full px-3 py-2 bg-input-bg border border-input-border text-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 placeholder-text-muted"
                  />
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-700 text-white py-1.5 rounded-md hover:bg-slate-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-slate-700 text-slate-200 py-1.5 rounded-md hover:bg-slate-600 transition-colors"
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
