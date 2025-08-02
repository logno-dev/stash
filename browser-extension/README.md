# Bookmark Manager - Chrome Extension

Chrome-compatible version of the Bookmark Manager browser extension.

## Installation

### Method 1: Developer Mode (Recommended)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The extension will appear in your toolbar

### Method 2: Pack and Install
1. In Chrome extensions page, click "Pack extension"
2. Select the `browser-extension` folder as the root directory
3. Click "Pack Extension" to create a `.crx` file
4. Drag and drop the `.crx` file into Chrome to install

## Features

- **Chrome-optimized**: Uses Chrome's Material Design styling
- **Manifest V3**: Uses the latest Chrome extension format
- **Keyboard shortcuts**: Ctrl/Cmd+Enter to save, Escape to close
- **Persistent storage**: Server URL is saved across browser sessions
- **Error handling**: Clear error messages for connection issues

## Configuration

1. Click the bookmark extension icon in your Chrome toolbar
2. Enter your bookmark server URL (default: `http://localhost:3000`)
3. The URL will be saved automatically for future use

## Usage

1. Navigate to any webpage you want to bookmark
2. Click the bookmark extension icon
3. Add optional notes and tags
4. Click "Save Bookmark" or press Ctrl/Cmd+Enter
5. The bookmark will be saved to your server

## Troubleshooting

### Extension won't load
- Make sure Developer mode is enabled
- Check for any error messages in the Chrome extensions page
- Verify all files are present in the extension folder

### Can't connect to server
- Verify your bookmark server is running on the specified URL
- Check that the server URL includes the protocol (http:// or https://)
- For HTTPS servers, ensure the SSL certificate is valid

### Bookmarks not saving
- Check the browser console for any error messages
- Verify the API endpoint is responding correctly
- Try testing the API directly with curl or a REST client