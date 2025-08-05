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
      setFilteredBookmarks(bookmarksList);
      setBookmarkGroups(data);
      
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
      setFilteredBookmarks(allBookmarks);
      setBookmarkGroups(groupBookmarksByDomain(allBookmarks));
    } else if (fuse) {
      const results = fuse.search(query);
      const searchResults = results.map(result => result.item);
      setFilteredBookmarks(searchResults);
      setBookmarkGroups(groupBookmarksByDomain(searchResults));
    }
  }, [allBookmarks, fuse, groupBookmarksByDomain]);

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

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity
      style={styles.bookmarkItem}
      onPress={() => navigation.navigate('AddEditBookmark', { bookmark: item })}
    >
      <View style={styles.bookmarkContent}>
        <Text style={styles.bookmarkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        {item.url && (
          <TouchableOpacity onPress={() => handleOpenUrl(item.url!)}>
            <Text style={styles.bookmarkUrl} numberOfLines={1}>
              {item.url}
            </Text>
          </TouchableOpacity>
        )}
        
        {item.notes && (
          <Text style={styles.bookmarkNotes} numberOfLines={3}>
            {item.notes}
          </Text>
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
        
        <Text style={styles.bookmarkDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBookmark(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
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
              {searchQuery ? 'No bookmarks match your search' : 'No bookmarks yet'}
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
    backgroundColor: '#18181B',
  },
  header: {
    backgroundColor: '#27272A',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3F3F46',
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
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C4043',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#52525B',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
  },
  listContainer: {
    padding: 16,
  },
  bookmarkItem: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3F3F46',
    flexDirection: 'row',
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bookmarkUrl: {
    fontSize: 14,
    color: '#F97316',
    marginBottom: 8,
  },
  bookmarkNotes: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#0891B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#F97316',
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
    backgroundColor: '#27272A',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3F3F46',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  domainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  domainCount: {
    backgroundColor: '#0891B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  domainCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  searchResultsInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});