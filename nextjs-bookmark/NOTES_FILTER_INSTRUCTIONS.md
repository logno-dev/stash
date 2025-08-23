# Notes-Only Filter Implementation Instructions

## Changes needed in BookmarkList.tsx

### 1. Add state for notes-only filter
After line ~38 (after the search states), add:
```typescript
const [showNotesOnly, setShowNotesOnly] = useState(false);
```

### 2. Add filter function
After the `groupBookmarksByDomain` function, add:
```typescript
// Apply filters to bookmarks
const applyFilters = useCallback((bookmarks: Bookmark[]) => {
  let filtered = bookmarks;
  
  // Apply notes-only filter
  if (showNotesOnly) {
    filtered = filtered.filter(bookmark => !bookmark.url || bookmark.url.trim() === '');
  }
  
  return filtered;
}, [showNotesOnly]);
```

### 3. Update handleSearch function
Replace the existing `handleSearch` function with:
```typescript
// Handle search with fuzzy matching and filters
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
```

### 4. Add filter toggle handler
After the `handleSearch` function, add:
```typescript
// Handle filter toggle
const handleFilterToggle = useCallback(() => {
  setShowNotesOnly(!showNotesOnly);
}, [showNotesOnly]);
```

### 5. Add useEffect for filter changes
After the existing useEffect hooks, add:
```typescript
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
```

### 6. Update loadInitialBookmarks and loadAllBookmarks
In both functions, apply filters to the results:

In `loadInitialBookmarks`, replace:
```typescript
setFilteredBookmarks(bookmarksList);
```
with:
```typescript
const filteredList = applyFilters(bookmarksList);
setFilteredBookmarks(filteredList);
```

In `loadAllBookmarks`, replace:
```typescript
setFilteredBookmarks(bookmarksList);
```
with:
```typescript
const filteredList = applyFilters(bookmarksList);
setFilteredBookmarks(filteredList);
```

### 7. Add filter UI
After the search section in the header (around line ~540), add:
```jsx
{/* Filter row */}
<div className="mt-4 flex items-center justify-between">
  <div className="flex items-center space-x-4">
    <button
      onClick={handleFilterToggle}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
        showNotesOnly
          ? 'bg-orange-600 border-orange-500 text-white'
          : 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>
      <span className="text-sm font-medium">Notes Only</span>
    </button>
    
    {showNotesOnly && (
      <div className="text-sm text-zinc-400">
        Showing items without URLs
      </div>
    )}
  </div>
  
  <div className="text-sm text-zinc-500">
    {filteredBookmarks.length} items
    {searchQuery && ` matching "${searchQuery}"`}
    {showNotesOnly && !searchQuery && " (notes only)"}
  </div>
</div>
```

### 8. Update empty state message
In the empty state section, replace:
```jsx
{searchQuery ? 'No bookmarks match your search' : 'No bookmarks found'}
```
with:
```jsx
{searchQuery 
  ? 'No bookmarks match your search' 
  : showNotesOnly 
    ? 'No notes found' 
    : 'No bookmarks found'
}
```

### 9. Update search results info
In the search results info section, replace:
```jsx
Showing {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
```
with:
```jsx
Showing {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
{showNotesOnly && " in notes only"}
```

## How it works:
- The "Notes Only" button toggles between showing all items and only items without URLs
- When active, it filters out any bookmarks that have a URL
- The filter works with search - you can search within notes-only items
- The UI shows the current filter state and item counts
- The filter persists while navigating and searching