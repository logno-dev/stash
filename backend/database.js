const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

class BookmarkDatabase {
  constructor() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'bookmarks.db');
    this.db = createClient({
      url: `file:${dbPath}`
    });
    this.init();
  }

  async init() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT,
        title TEXT,
        notes TEXT,
        tags TEXT,
        domain TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async addBookmark(url, title, notes, tags) {
    const domain = url ? this.extractDomain(url) : 'Notes';
    const result = await this.db.execute({
      sql: `INSERT INTO bookmarks (url, title, notes, tags, domain)
            VALUES (?, ?, ?, ?, ?)`,
      args: [url, title, notes, tags, domain]
    });
    
    return { 
      id: Number(result.lastInsertRowid), 
      url, 
      title, 
      notes, 
      tags, 
      domain 
    };
  }

  async getAllBookmarks() {
    const result = await this.db.execute(`
      SELECT * FROM bookmarks 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async searchBookmarks(query) {
    const searchTerm = `%${query}%`;
    const result = await this.db.execute({
      sql: `SELECT * FROM bookmarks 
            WHERE title LIKE ? OR url LIKE ? OR notes LIKE ? OR tags LIKE ?
            ORDER BY created_at DESC`,
      args: [searchTerm, searchTerm, searchTerm, searchTerm]
    });
    return result.rows;
  }

  async deleteBookmark(id) {
    const result = await this.db.execute({
      sql: `DELETE FROM bookmarks WHERE id = ?`,
      args: [id]
    });
    return result.rowsAffected > 0;
  }

  async updateBookmark(id, url, title, notes, tags) {
    const domain = url ? this.extractDomain(url) : 'Notes';
    const result = await this.db.execute({
      sql: `UPDATE bookmarks 
            SET url = ?, title = ?, notes = ?, tags = ?, domain = ?
            WHERE id = ?`,
      args: [url, title, notes, tags, domain, id]
    });
    
    if (result.rowsAffected > 0) {
      return { 
        id: Number(id), 
        url, 
        title, 
        notes, 
        tags, 
        domain 
      };
    }
    return null;
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return 'unknown';
    }
  }

  async close() {
    await this.db.close();
  }
}

module.exports = BookmarkDatabase;