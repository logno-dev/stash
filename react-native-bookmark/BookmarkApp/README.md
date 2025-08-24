# Stash - React Native Bookmark Manager

A lightweight React Native version of the Stash bookmark manager, built with Expo and designed specifically for Android.

## Features

- **Authentication**: Login with your existing Stash account
- **Bookmark Management**: Add, edit, delete bookmarks and notes
- **Search**: Search through bookmarks by title, notes, tags, or URL
- **Tags**: Organize bookmarks with comma-separated tags
- **URL Sharing**: Share URLs from other apps directly to Stash
- **Deep Linking**: Handle shared content automatically
- **Dark Theme**: Modern dark UI matching the original web app
- **Live Sync**: All changes sync with your web account

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **AsyncStorage** for local data persistence
- **Expo Vector Icons** for UI icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI: `npm install -g @expo/cli`

### Installation

1. Navigate to the project directory:
   ```bash
   cd react-native-bookmark/BookmarkApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (on port 3001 to avoid conflicts):
   ```bash
   npm start
   ```

4. Run on Android:
   ```bash
   npm run android
   ```

   Or scan the QR code with the Expo Go app on your Android device.

### Building for Android

1. Build the APK:
   ```bash
   npx expo build:android
   ```

2. Or create a development build:
   ```bash
   npx expo run:android
   ```

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── screens/
│   ├── LoginScreen.tsx      # Login/Register screen
│   ├── BookmarkListScreen.tsx # Main bookmarks list
│   └── AddEditBookmarkScreen.tsx # Add/Edit bookmark form
├── types/
│   └── index.ts            # TypeScript type definitions
└── utils/
    ├── storage.ts          # AsyncStorage utilities
    └── bookmarks.ts        # Bookmark management functions
```

## Key Differences from NextJS Version

- **Production API**: Connects to https://stash.bunch.codes for live data
- **Mobile UI**: Optimized for mobile touch interactions
- **Offline Cache**: Falls back to local storage when offline
- **Real Authentication**: Uses the same login system as the web app
- **Android Focus**: Configured specifically for Android builds

## Usage

1. **Login**: Use your existing Stash account credentials from https://stash.bunch.codes
2. **View Bookmarks**: See all your bookmarks organized by domain
3. **Search**: Use the search bar to find specific bookmarks
4. **Add Bookmarks**: Tap the + button to add new bookmarks or notes
5. **Share URLs**: From any app, use "Share" and select Stash to save URLs instantly
6. **Edit**: Tap any bookmark to edit it
7. **Delete**: Tap the trash icon to delete bookmarks
8. **Sync**: All changes sync with your web account automatically

### Sharing URLs to Stash

The app supports receiving shared content from other apps:

- **Share URLs**: From browsers, social media, or any app with a share button
- **Share Text**: Share plain text that will be saved as notes
- **Auto-populate**: URLs and titles are automatically filled in the bookmark form
- **Smart Detection**: Automatically detects if shared text contains URLs

## Customization

- **Colors**: Modify the color scheme in the StyleSheet objects
- **Storage**: Replace AsyncStorage with a more robust solution if needed
- **Authentication**: Integrate with a real backend API
- **Features**: Add sync, sharing, or other advanced features

## Building for Production

1. Configure signing in `app.json`
2. Build the APK: `npx expo build:android`
3. Test thoroughly on different Android devices
4. Submit to Google Play Store if desired

## License

This project is part of the Stash bookmark manager suite.
