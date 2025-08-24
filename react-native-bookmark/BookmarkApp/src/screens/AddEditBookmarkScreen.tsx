import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from '../types';
import { bookmarkService } from '../utils/bookmarks';
import { Colors } from '../config/colors';

interface Props {
  navigation: any;
  route: any;
}

export default function AddEditBookmarkScreen({ navigation, route }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  
  const bookmark = route.params?.bookmark as Bookmark | undefined;
  const sharedUrl = route.params?.url as string | undefined;
  const sharedTitle = route.params?.title as string | undefined;
  const sharedText = route.params?.text as string | undefined;
  const isEditing = !!bookmark;

  useEffect(() => {
    if (bookmark) {
      // Editing existing bookmark
      setUrl(bookmark.url || '');
      setTitle(bookmark.title);
      setNotes(bookmark.notes || '');
      setTags(bookmark.tags || '');
    } else if (sharedUrl || sharedTitle || sharedText) {
      // Handle shared content
      if (sharedUrl) {
        setUrl(sharedUrl);
        // Try to extract title from URL if available
        if (sharedTitle) {
          setTitle(sharedTitle);
        } else {
          // Use domain as title if no title provided
          try {
            const domain = new URL(sharedUrl).hostname;
            setTitle(domain);
          } catch {
            setTitle('Shared Link');
          }
        }
      }
      
      if (sharedText) {
        // Check if shared text is a URL
        if (sharedText.startsWith('http://') || sharedText.startsWith('https://')) {
          if (!sharedUrl) {
            setUrl(sharedText);
            try {
              const domain = new URL(sharedText).hostname;
              setTitle(domain);
            } catch {
              setTitle('Shared Link');
            }
          }
        } else {
          // Use shared text as notes
          setNotes(sharedText);
          if (!sharedTitle && !sharedUrl) {
            setTitle('Shared Note');
          }
        }
      }
      
      if (sharedTitle && !bookmark) {
        setTitle(sharedTitle);
      }
    }
  }, [bookmark, sharedUrl, sharedTitle, sharedText]);

  const handleSave = async () => {
    if (!title.trim() && !notes.trim()) {
      Alert.alert('Error', 'Please enter a title or notes');
      return;
    }

    setLoading(true);

    try {
      const bookmarkData = {
        url: url.trim() || undefined,
        title: title.trim() || notes.trim().substring(0, 50) + '...',
        notes: notes.trim(),
        tags: tags.trim(),
        domain: url.trim() ? new URL(url.trim()).hostname : 'Notes',
      };

      if (isEditing) {
        await bookmarkService.updateBookmark(bookmark.id, bookmarkData);
        Alert.alert('Success', 'Bookmark updated successfully');
      } else {
        await bookmarkService.addBookmark(bookmarkData);
        Alert.alert('Success', 'Bookmark added successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving bookmark:', error);
      Alert.alert('Error', 'Failed to save bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Bookmark' : (sharedUrl || sharedText || sharedTitle) ? 'Save Shared Content' : 'Add Bookmark'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com"
            placeholderTextColor="#9CA3AF"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add your notes here..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCapitalize="sentences"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="work, reference, tutorial"
            placeholderTextColor="#9CA3AF"
            value={tags}
            onChangeText={setTags}
            autoCapitalize="none"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    padding: 16,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
});