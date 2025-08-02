# Bookmark Manager - Firefox Extension

Firefox-compatible version of the Bookmark Manager browser extension.

## Installation

### Method 1: Temporary Installation (Development)
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the `browser-extension-firefox` folder and select `manifest.json`
5. The extension will be loaded temporarily (until Firefox restarts)

### Method 2: Permanent Installation (Unsigned)
1. Open Firefox and navigate to `about:config`
2. Search for `xpinstall.signatures.required` and set it to `false`
3. Zip the entire `browser-extension-firefox` folder contents (not the folder itself)
4. Rename the zip file to have a `.xpi` extension (e.g., `bookmark-manager.xpi`)
5. Drag and drop the `.xpi` file into Firefox to install

## Features

- **Firefox-optimized UI**: Uses Firefox's Photon design system colors and styling
- **Native Firefox APIs**: Uses `browser.*` APIs instead of `chrome.*`
- **Enhanced UX**: Auto-focus on notes field, longer error message timeouts
- **Keyboard shortcuts**: Ctrl/Cmd+Enter to save, Escape to close
- **URL validation**: Validates server URL format before attempting to save
- **Better error handling**: More descriptive error messages for Firefox users

## Configuration

1. Click the bookmark extension icon in your Firefox toolbar
2. Enter your bookmark server URL (default: `http://localhost:3000`)
3. The URL will be saved automatically for future use

## Usage

1. Navigate to any webpage you want to bookmark
2. Click the bookmark extension icon
3. Add optional notes and tags
4. Click "Save Bookmark" or press Ctrl/Cmd+Enter
5. The bookmark will be saved to your server and the popup will close

## Differences from Chrome Version

- Uses Firefox's `browser.*` APIs instead of Chrome's `chrome.*` APIs
- Manifest v2 format (Firefox's current standard)
- Firefox-specific styling and colors
- Enhanced error handling and user feedback
- Auto-focus on notes field for better keyboard navigation
- Longer timeout for error messages

## Troubleshooting

### Extension won't load
- Make sure you're selecting the `manifest.json` file, not the folder
- Check the Firefox console for any error messages

### Can't connect to server
- Verify your bookmark server is running on the specified URL
- Check that the server URL includes the protocol (http:// or https://)
- Ensure there are no firewall issues blocking the connection

### Bookmarks not saving
- Check the server logs for any error messages
- Verify the API endpoint is responding correctly
- Try testing the API directly with curl or a REST client