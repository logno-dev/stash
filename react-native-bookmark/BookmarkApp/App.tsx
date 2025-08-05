import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import BookmarkListScreen from './src/screens/BookmarkListScreen';
import AddEditBookmarkScreen from './src/screens/AddEditBookmarkScreen';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

const Stack = createStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'stash://', 'https://stash.bunch.codes', 'http://stash.bunch.codes'],
  config: {
    screens: {
      BookmarkList: 'bookmarks',
      AddEditBookmark: {
        path: 'add',
        parse: {
          url: (url: string) => decodeURIComponent(url),
          title: (title: string) => decodeURIComponent(title),
          text: (text: string) => decodeURIComponent(text),
        },
      },
      Login: 'login',
    },
  },
};

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleIncomingURL(initialUrl);
      }
    };

    const handleIncomingURL = (url: string) => {
      console.log('Incoming URL:', url);
      // The navigation linking config will automatically handle routing
      // to the AddEditBookmark screen with the parsed parameters
    };

    handleInitialURL();

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingURL(url);
    });

    return () => {
      linkingSubscription?.remove();
    };
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="BookmarkList" component={BookmarkListScreen} />
            <Stack.Screen name="AddEditBookmark" component={AddEditBookmarkScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
