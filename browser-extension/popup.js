class BookmarkExtension {
    constructor() {
        this.currentTab = null;
        this.serverUrl = null;
        this.authToken = null;
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.bindEvents();
        await this.loadSettings();
        await this.checkAuthentication();
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

    bindEvents() {
        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const noteOnlyMode = document.getElementById('noteOnlyMode');

        saveBtn.addEventListener('click', () => this.saveBookmark());
        cancelBtn.addEventListener('click', () => window.close());
        settingsBtn.addEventListener('click', () => this.openSettings());
        noteOnlyMode.addEventListener('change', () => this.toggleNoteOnlyMode());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveBookmark();
            } else if (e.key === 'Escape') {
                window.close();
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['serverUrl', 'authToken', 'username', 'password']);
            this.serverUrl = result.serverUrl;
            this.authToken = result.authToken;
            this.username = result.username;
            this.password = result.password;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    openSettings() {
        chrome.runtime.openOptionsPage();
    }

    async checkAuthentication() {
        const authIndicator = document.getElementById('authIndicator');
        const authStatus = document.getElementById('authStatus');

        if (!this.serverUrl || !this.username || !this.password) {
            authIndicator.className = 'auth-indicator unauthenticated';
            authStatus.textContent = 'Not configured - click Settings';
            return false;
        }

        // If we have a token, try to verify it first
        if (this.authToken) {
            try {
                const response = await fetch(`${this.serverUrl}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated) {
                        authIndicator.className = 'auth-indicator authenticated';
                        authStatus.textContent = 'Authenticated';
                        return true;
                    }
                }
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }

        // Token is invalid or missing, try to get a new one
        try {
            const loginResponse = await fetch(`${this.serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: this.username, 
                    password: this.password 
                }),
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                this.authToken = loginData.token;
                
                // Save the new token
                await chrome.storage.sync.set({ authToken: loginData.token });
                
                authIndicator.className = 'auth-indicator authenticated';
                authStatus.textContent = 'Authenticated';
                return true;
            } else {
                authIndicator.className = 'auth-indicator unauthenticated';
                authStatus.textContent = 'Invalid credentials';
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            authIndicator.className = 'auth-indicator unauthenticated';
            authStatus.textContent = 'Connection failed';
            return false;
        }
    }

    toggleNoteOnlyMode() {
        const noteOnlyMode = document.getElementById('noteOnlyMode').checked;
        const currentPageGroup = document.getElementById('currentPageGroup');
        const saveBtn = document.getElementById('saveBtn');
        
        if (noteOnlyMode) {
            currentPageGroup.style.display = 'none';
            saveBtn.textContent = 'Save Note';
        } else {
            currentPageGroup.style.display = 'block';
            saveBtn.textContent = 'Save Bookmark';
        }
    }

    async saveBookmark() {
        const noteOnlyMode = document.getElementById('noteOnlyMode').checked;
        
        if (!noteOnlyMode && !this.currentTab) {
            this.showStatus('Error: No active tab found', 'error');
            return;
        }

        if (!this.serverUrl || !this.authToken) {
            this.showStatus('Please configure server settings first', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        const notes = document.getElementById('notes').value.trim();
        const tags = document.getElementById('tags').value.trim();

        if (!notes) {
            this.showStatus('Please enter some notes', 'error');
            return;
        }

        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const payload = {
                notes: notes,
                tags: tags
            };

            // Only include URL if not in note-only mode
            if (!noteOnlyMode) {
                payload.url = this.currentTab.url;
            }

            const response = await fetch(`${this.serverUrl}/api/bookmarks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const successMessage = noteOnlyMode ? 'Note saved successfully!' : 'Bookmark saved successfully!';
                this.showStatus(successMessage, 'success');
                setTimeout(() => window.close(), 1500);
            } else if (response.status === 401) {
                this.showStatus('Authentication failed - check settings', 'error');
            } else {
                const error = await response.json();
                this.showStatus(`Error: ${error.error || 'Failed to save'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            this.showStatus('Error: Could not connect to bookmark server', 'error');
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
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookmarkExtension();
});