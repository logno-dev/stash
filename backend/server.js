require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('./database');
const { getAvailablePort } = require('./port-utils');

const app = express();

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database();

app.use(cors());
app.use(express.json());

// Serve React build files
app.use(express.static(path.join(__dirname, 'dist')));

// Authentication configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Hash the admin password on startup
const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);

console.log(`🔐 Admin username: ${ADMIN_USERNAME}`);
console.log(`🔐 Admin password: ${ADMIN_PASSWORD}`);
console.log(`⚠️  Please change the default credentials in your .env file!`);

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Extract page title from URL
async function extractPageTitle(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    let title = $('title').text().trim();
    
    // Fallback to meta title if no title tag
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="title"]').attr('content') || 
              url;
    }
    
    return title;
  } catch (error) {
    console.error('Error extracting title:', error.message);
    return url; // Fallback to URL if extraction fails
  }
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check credentials
    if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, hashedPassword)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ 
      token,
      user: { username, role: 'admin' },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth verification endpoint
app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ 
    authenticated: true, 
    user: req.user 
  });
});

// API Routes
app.post('/api/bookmarks', requireAuth, async (req, res) => {
  try {
    console.log('Received bookmark request:', req.body);
    const { url, notes = '', tags = '' } = req.body;
    
    if (!url && !notes.trim()) {
      return res.status(400).json({ error: 'Either URL or notes is required' });
    }

    let title;
    if (url) {
      console.log('Extracting title for URL:', url);
      // Extract title from the webpage
      title = await extractPageTitle(url);
      console.log('Extracted title:', title);
    } else {
      // Generate date/time title for notes without URL
      const now = new Date();
      title = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('Generated title for note:', title);
    }
    
    console.log('Adding bookmark to database...');
    console.log('Parameters:', { url, title, notes, tags });
    const bookmark = await db.addBookmark(url, title, notes, tags);
    console.log('Bookmark added successfully:', bookmark);
    res.json(bookmark);
  } catch (error) {
    console.error('Error adding bookmark:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

app.get('/api/bookmarks', requireAuth, async (req, res) => {
  try {
    const { search } = req.query;
    
    let bookmarks;
    if (search) {
      bookmarks = await db.searchBookmarks(search);
    } else {
      bookmarks = await db.getAllBookmarks();
    }
    
    // Group bookmarks by domain
    const grouped = bookmarks.reduce((acc, bookmark) => {
      const domain = bookmark.domain;
      if (!acc[domain]) {
        acc[domain] = [];
      }
      acc[domain].push(bookmark);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

app.put('/api/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, notes = '', tags = '' } = req.body;
    
    console.log('Updating bookmark with ID:', id);
    console.log('Update data:', { url, notes, tags });
    
    if (!url && !notes.trim()) {
      return res.status(400).json({ error: 'Either URL or notes is required' });
    }

    let title;
    if (url) {
      console.log('Extracting title for URL:', url);
      // Extract title from the webpage
      title = await extractPageTitle(url);
      console.log('Extracted title:', title);
    } else {
      // Generate date/time title for notes without URL
      const now = new Date();
      title = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('Generated title for note:', title);
    }
    
    const updatedBookmark = await db.updateBookmark(id, url, title, notes, tags);
    
    if (updatedBookmark) {
      console.log('Bookmark updated successfully:', updatedBookmark);
      res.json(updatedBookmark);
    } else {
      console.log('Bookmark not found');
      res.status(404).json({ error: 'Bookmark not found' });
    }
  } catch (error) {
    console.error('Error updating bookmark:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

app.delete('/api/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting bookmark with ID:', id);
    
    const deleted = await db.deleteBookmark(id);
    
    if (deleted) {
      console.log('Bookmark deleted successfully');
      res.json({ success: true, message: 'Bookmark deleted successfully' });
    } else {
      console.log('Bookmark not found');
      res.status(404).json({ error: 'Bookmark not found' });
    }
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// Start server with automatic port detection
async function startServer() {
  try {
    // Initialize database first
    await db.init();
    console.log('📊 Database initialized successfully');
    
    const PORT = await getAvailablePort(process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);
    
    app.listen(PORT, () => {
      console.log(`🚀 Bookmark app running on port ${PORT}`);
      console.log(`📱 Web interface: http://localhost:${PORT}`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api/bookmarks`);
      
      if (PORT !== (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000)) {
        console.log(`⚠️  Note: Using port ${PORT} instead of ${process.env.PORT || 3000} (port was in use)`);
        console.log(`💡 Update your browser extension server URL to: http://localhost:${PORT}`);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await db.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();