import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Fuse from 'fuse.js';
import { Bookmark } from '../types';
import { bookmarkService } from '../utils/bookmarks';
import { useAuth } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Colors } from '../config/colors';

interface Props {
  navigation: any;
}

export default function BookmarkListScreen({ navigation }: Props) {
  // Data states
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkGroups, setBookmarkGroups] = useState<Record<string, Bookmark[]>>({});
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Bookmark> | null>(null);
  const [showNotesOnly, setShowNotesOnly] = useState(false);
  
  // Loading states
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { logout } = useAuth();

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

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setInitialLoading(true);
      // Load all bookmarks without search query to get complete dataset
      const data = await bookmarkService.getAllBookmarks();
      const bookmarksList = Object.values(data).flat() as Bookmark[];
      
      // Store all bookmarks for local searching
      setAllBookmarks(bookmarksList);
      const filteredList = applyFilters(bookmarksList);
      setFilteredBookmarks(filteredList);
      setBookmarkGroups(groupBookmarksByDomain(filteredList));
      
      // Initialize fuzzy search
      initializeFuse(bookmarksList);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookmarks();
  };

  // Handle search with fuzzy matching
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      const filteredList = applyFilters(allBookmarks);
      setFilteredBookmarks(filteredList);
      setBookmarkGroups(groupBookmarksByDomain(filteredList));
    } else if (fuse) {
      const results = fuse.search(query);
      const searchResults = results.map(result => result.item);
      const filteredResults = applyFilters(searchResults);
      setFilteredBookmarks(filteredResults);
      setBookmarkGroups(groupBookmarksByDomain(filteredResults));
    }
  }, [allBookmarks, fuse, groupBookmarksByDomain, applyFilters]);

  // Handle filter toggle
  const handleFilterToggle = useCallback(() => {
    setShowNotesOnly(!showNotesOnly);
  }, [showNotesOnly]);

  // Update filters when showNotesOnly changes
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      const filteredList = applyFilters(allBookmarks);
      setFilteredBookmarks(filteredList);
      setBookmarkGroups(groupBookmarksByDomain(filteredList));
    }
  }, [showNotesOnly, searchQuery, allBookmarks, handleSearch, applyFilters, groupBookmarksByDomain]);

  const handleDeleteBookmark = (bookmark: Bookmark) => {
    Alert.alert(
      'Delete Bookmark',
      `Are you sure you want to delete "${bookmark.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookmarkService.deleteBookmark(bookmark.id);
              loadBookmarks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bookmark');
            }
          },
        },
      ]
    );
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open URL');
    });
  };

  const truncateUrl = (url: string, maxLength: number = 60): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={styles.bookmarkItem}
      onPress={() => item.url ? handleOpenUrl(item.url) : undefined}
    >
      <View style={styles.bookmarkContent}>
        <Text style={styles.bookmarkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        {item.url && (
          <Text style={styles.bookmarkUrl} numberOfLines={1}>
            {truncateUrl(item.url)}
          </Text>
        )}
        
        {item.notes && (
          <MarkdownRenderer content={item.notes} numberOfLines={3} />
        )}
        
        {item.tags && (
          <View style={styles.tagsContainer}>
            {item.tags.split(',').map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.bookmarkFooter}>
          <Text style={styles.bookmarkDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AddEditBookmark', { bookmark: item })}
        >
          <Ionicons name="pencil-outline" size={20} color={Colors.accentPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBookmark(item)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading bookmarks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Stash</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookmarks..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter toggle */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showNotesOnly && styles.filterButtonActive
            ]}
            onPress={handleFilterToggle}
          >
            <Ionicons 
              name="document-text-outline" 
              size={16} 
              color={showNotesOnly ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.filterButtonText,
              showNotesOnly && styles.filterButtonTextActive
            ]}>
              Notes Only
            </Text>
          </TouchableOpacity>
          
          {showNotesOnly && (
            <Text style={styles.filterStatus}>
              Showing items without URLs
            </Text>
          )}
          
          <Text style={styles.itemCount}>
            {filteredBookmarks.length} items
            {searchQuery && ` matching "${searchQuery}"`}
            {showNotesOnly && !searchQuery && " (notes only)"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {Object.keys(bookmarkGroups).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No bookmarks match your search' 
                : showNotesOnly 
                  ? 'No notes found' 
                  : 'No bookmarks yet'
              }
            </Text>
            {searchQuery ? (
              <Text style={styles.emptySubtext}>
                Try adjusting your search terms
              </Text>
            ) : (
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first bookmark
              </Text>
            )}
          </View>
        ) : (
          Object.entries(bookmarkGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([domain, domainBookmarks]) => (
              <View key={domain} style={styles.domainGroup}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainTitle}>{domain}</Text>
                  <View style={styles.domainCount}>
                    <Text style={styles.domainCountText}>{domainBookmarks.length}</Text>
                  </View>
                </View>
                {domainBookmarks.map((bookmark) => (
                  <View key={bookmark.id}>
                    {renderBookmark({ item: bookmark })}
                  </View>
                ))}
              </View>
              ))
        )}
        
        {/* Search results info */}
        {searchQuery && Object.keys(bookmarkGroups).length > 0 && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              Showing {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''} for "{searchQuery}"
              {showNotesOnly && " in notes only"}
            </Text>
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditBookmark')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.headerBg,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  logoutButton: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: Colors.white,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingVertical: 12,
  },
  listContainer: {
    padding: 16,
  },
  bookmarkItem: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    flexDirection: 'row',
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  bookmarkUrl: {
    fontSize: 14,
    color: Colors.accentPrimary,
    marginBottom: 8,
  },
  bookmarkNotes: {
    marginBottom: 8,
    maxHeight: 60, // Approximate height for 3 lines
    overflow: 'hidden',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: Colors.tagBlueBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.tagBlue,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookmarkDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.accentPrimary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  domainGroup: {
    backgroundColor: Colors.cardBgSecondary,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  domainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  domainCount: {
    backgroundColor: Colors.tagBlueBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainCountText: {
    fontSize: 12,
    color: Colors.tagBlue,
    fontWeight: '500',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  searchResultsInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchResultsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  filterContainer: {
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.inputBg,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimaryHover,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  filterStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});