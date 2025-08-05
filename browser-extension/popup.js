class BookmarkExtensionChrome {
    constructor() {
        this.currentTab = null;
        this.activeTabType = 'bookmark';
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.bindEvents();
        this.initTabs();
        this.handleCommandShortcut();
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
            document.getElementById('currentUrl').textContent = tab.url;
        } catch (error) {
            console.error('Error getting current tab:', error);
            document.getElementById('currentUrl').textContent = 'Error loading current page';
        }
    }

    initTabs() {
        const tabs = document.querySelectorAll('.tab');
        const panels = document.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                
                // Handle settings tab directly
                if (tabType === 'settings') {
                    chrome.runtime.openOptionsPage();
                    return;
                }
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active panel
                panels.forEach(p => p.classList.remove('active'));
                document.getElementById(`${tabType}-panel`).classList.add('active');
                
                this.activeTabType = tabType;
                
                // Focus on appropriate field
                if (tabType === 'bookmark') {
                    document.getElementById('bookmarkNotes').focus();
                } else if (tabType === 'note') {
                    document.getElementById('noteContent').focus();
                }
            });
        });
    }

    handleCommandShortcut() {
        // Check if popup was opened via the notes shortcut
        const urlParams = new URLSearchParams(window.location.search);
        const openTab = urlParams.get('tab');
        
        if (openTab === 'note') {
            // Switch to notes tab
            const noteTab = document.querySelector('[data-tab="note"]');
            const bookmarkTab = document.querySelector('[data-tab="bookmark"]');
            const panels = document.querySelectorAll('.tab-panel');
            
            // Update active tab
            bookmarkTab.classList.remove('active');
            noteTab.classList.add('active');
            
            // Update active panel
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById('note-panel').classList.add('active');
            
            this.activeTabType = 'note';
            
            // Focus on note content field
            setTimeout(() => {
                document.getElementById('noteContent').focus();
            }, 100);
        }
    }

    bindEvents() {
        // Save buttons
        document.getElementById('saveBookmarkBtn').addEventListener('click', () => this.saveBookmark());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());
        
        // Cancel buttons
        document.getElementById('cancelBtn').addEventListener('click', () => window.close());
        document.getElementById('cancelBtn2').addEventListener('click', () => window.close());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (this.activeTabType === 'bookmark') {
                    this.saveBookmark();
                } else if (this.activeTabType === 'note') {
                    this.saveNote();
                }
            } else if (e.key === 'Escape') {
                window.close();
            }
        });

        // Auto-focus on notes field for better UX
        document.getElementById('bookmarkNotes').focus();
    }

    async saveNote() {
        const notes = document.getElementById('noteContent').value.trim();
        const tags = document.getElementById('noteTags').value.trim();

        if (!notes) {
            this.showStatus('Please enter some notes', 'error');
            return;
        }

        await this.saveItem({
            url: null,
            notes: notes,
            tags: tags
        }, 'note');
    }

    async saveBookmark() {
        if (!this.currentTab) {
            this.showStatus('Error: No active tab found', 'error');
            return;
        }

        const notes = document.getElementById('bookmarkNotes').value.trim();
        const tags = document.getElementById('bookmarkTags').value.trim();

        await this.saveItem({
            url: this.currentTab.url,
            notes: notes,
            tags: tags
        }, 'bookmark');
    }

    async saveItem(payload, type) {
        const saveBtn = document.getElementById(type === 'bookmark' ? 'saveBookmarkBtn' : 'saveNoteBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            // Get stored credentials and server URL
            const settings = await chrome.storage.sync.get(['serverUrl', 'username', 'password']);
            
            if (!settings.serverUrl || !settings.username || !settings.password) {
                this.showStatus('Please configure your credentials in the extension settings', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                return;
            }

            // Validate URL format
            try {
                new URL(settings.serverUrl);
            } catch (e) {
                this.showStatus('Invalid server URL in settings', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                return;
            }

            // First, get authentication token
            const loginResponse = await fetch(`${settings.serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: settings.username,
                    password: settings.password
                }),
            });

            if (!loginResponse.ok) {
                const loginError = await loginResponse.json();
                this.showStatus(`Authentication failed: ${loginError.error || 'Invalid credentials'}`, 'error');
                return;
            }

            const loginData = await loginResponse.json();
            const token = loginData.token;

            // Now save the item with the token
            const response = await fetch(`${settings.serverUrl}/api/bookmarks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const item = await response.json();
                const successMessage = type === 'note' 
                    ? `Note saved successfully! Title: "${item.title}"`
                    : `Bookmark saved successfully! Title: "${item.title}"`;
                this.showStatus(successMessage, 'success');
                
                // Clear form fields
                if (type === 'bookmark') {
                    document.getElementById('bookmarkNotes').value = '';
                    document.getElementById('bookmarkTags').value = '';
                } else {
                    document.getElementById('noteContent').value = '';
                    document.getElementById('noteTags').value = '';
                }
                
                // Auto-close after successful save
                setTimeout(() => window.close(), 2000);
            } else {
                const error = await response.json();
                this.showStatus(`Error: ${error.error || 'Failed to save'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showStatus('Error: Could not connect to bookmark server. Check the URL and ensure the server is running.', 'error');
            } else {
                this.showStatus('Error: Network request failed', 'error');
            }
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';

        if (type === 'error') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 8000);
        }
    }
}

// Chrome-specific initialization
document.addEventListener('DOMContentLoaded', () => {
    new BookmarkExtensionChrome();
});