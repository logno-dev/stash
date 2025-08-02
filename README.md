# 📚 Bookmark Manager

A modern bookmark manager with React frontend, Node.js backend, JWT authentication, and browser extension.

## ✨ Features

- **🔐 JWT Authentication**: Secure login with username/password
- **⚛️ React Frontend**: Modern, responsive UI built with React + Vite
- **🚀 Node.js Backend**: Express API with SQLite database
- **🐳 Docker Ready**: Multi-stage builds with development tools
- **🔍 Smart Search**: Search across titles, URLs, notes, and tags
- **🏷️ Domain Grouping**: Automatically groups bookmarks by domain
- **📱 Browser Extensions**: Chrome and Firefox extensions with settings
- **🔄 Auto-rebuild**: File watching and cache management tools
- **📊 Real-time Updates**: Live bookmark management

## 🚀 Quick Start

### Production (Docker)
```bash
# Build and start
npm run docker:build

# Or use Docker Compose directly
docker-compose up -d
```

### Development (Local)
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend-react && npm install && cd ..

# Start both frontend and backend
npm run dev
```

### Local Installation (Alternative to Docker)

If you prefer to run without Docker:

1. **Install Node.js 20+** on your system
2. **Clone the project** and navigate to the backend directory
3. **Install dependencies**: `npm install`
4. **Configure environment** (optional): Copy `.env.example` to `.env` and modify as needed
5. **Start the server**: `npm start`

The app will automatically find an available port starting from 3000.

## Browser Extension Setup

### Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `browser-extension` folder
4. The bookmark extension will appear in your toolbar
5. Configure the server URL (default: `http://localhost:3000`)

### Firefox Extension
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on..."
4. Navigate to the `browser-extension-firefox` folder and select `manifest.json`
5. Configure the server URL (default: `http://localhost:3000`)

See the individual README files in each extension folder for detailed installation instructions.

## API Usage

### Add a Bookmark
```bash
POST /api/bookmarks
Content-Type: application/json

{
  "url": "https://example.com/page",
  "notes": "Optional notes about this bookmark",
  "tags": "tag1, tag2, tag3"
}
```

### Get All Bookmarks
```bash
GET /api/bookmarks
```

### Search Bookmarks
```bash
GET /api/bookmarks?search=query
```

## Project Structure

```
bookmark-app/
├── backend/
│   ├── server.js          # Express server
│   ├── database.js        # SQLite database operations
│   └── package.json       # Node.js dependencies
├── frontend/
│   ├── index.html         # Main UI
│   ├── style.css          # Styling
│   └── script.js          # Frontend JavaScript
├── browser-extension/         # Chrome extension
│   ├── manifest.json      # Chrome extension manifest (v3)
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Extension logic
│   └── README.md          # Chrome installation guide
├── browser-extension-firefox/ # Firefox extension
│   ├── manifest.json      # Firefox extension manifest (v2)
│   ├── popup.html         # Firefox-optimized popup UI
│   ├── popup.js           # Firefox-specific logic
│   └── README.md          # Firefox installation guide
├── Dockerfile             # Container definition
├── docker-compose.yml     # Docker Compose configuration
└── README.md             # This file
```

## Database Schema

The SQLite database contains a single `bookmarks` table:

```sql
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  tags TEXT,
  domain TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory (see `.env.example` for reference):

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Future authentication options (not yet implemented)
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=your_secure_password
```

### Automatic Port Detection

The application automatically detects if the specified port is in use and finds the next available port. This prevents conflicts when running multiple instances or when other services are using the default port.

### Data Persistence

- **Docker**: SQLite database is stored in `/app/data/bookmarks.db` and persisted using Docker volumes
- **Local**: Database is stored in `backend/data/bookmarks.db`

## Browser Extension Features

### Chrome Extension
- **Manifest V3** - Latest Chrome extension format
- **Material Design** - Chrome-optimized styling
- **Auto-fill current page URL**
- **Configurable server URL** with persistent storage
- **Keyboard shortcuts** (Ctrl/Cmd+Enter to save, Escape to close)

### Firefox Extension  
- **Manifest V2** - Firefox-compatible format
- **Photon Design** - Firefox-optimized styling and colors
- **Enhanced UX** - Auto-focus on notes field, longer error timeouts
- **Native Firefox APIs** - Uses `browser.*` instead of `chrome.*`
- **Better error handling** - More descriptive error messages

### Common Features
- **Optional notes and tags**
- **Status feedback** for successful saves and errors
- **URL validation** and connection testing
- **Cross-platform compatibility**

## Development

### Backend Dependencies
- Express.js - Web framework
- SQLite3 - Database
- Axios - HTTP client for fetching page metadata
- Cheerio - HTML parsing for title extraction
- CORS - Cross-origin resource sharing

### Frontend
- Vanilla JavaScript (no frameworks)
- Responsive CSS Grid/Flexbox layout
- Fetch API for HTTP requests

## License

MIT License - feel free to use this project for personal or commercial purposes.