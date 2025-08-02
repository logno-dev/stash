class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('saveBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('testBtn').addEventListener('click', () => this.testConnection());
    }

    async loadSettings() {
        try {
            const result = await browser.storage.sync.get(['serverUrl', 'username', 'password']);
            
            if (result.serverUrl) {
                document.getElementById('serverUrl').value = result.serverUrl;
            }
            if (result.username) {
                document.getElementById('username').value = result.username;
            }
            if (result.password) {
                document.getElementById('password').value = result.password;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    async saveSettings() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!serverUrl || !username || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }

        // Validate URL format
        try {
            new URL(serverUrl);
        } catch (e) {
            this.showStatus('Please enter a valid server URL', 'error');
            return;
        }

        try {
            await browser.storage.sync.set({
                serverUrl: serverUrl,
                username: username,
                password: password
            });

            this.showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    async testConnection() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!serverUrl || !username || !password) {
            this.showStatus('Please fill in all fields before testing', 'error');
            return;
        }

        const testBtn = document.getElementById('testBtn');
        const originalText = testBtn.textContent;
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        try {
            // Test login
            const response = await fetch(`${serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                }),
            });

            if (response.ok) {
                const data = await response.json();
                this.showStatus('✅ Connection successful! Authentication working.', 'success');
            } else {
                const error = await response.json();
                this.showStatus(`❌ Authentication failed: ${error.error || 'Invalid credentials'}`, 'error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showStatus('❌ Could not connect to server. Check the URL and ensure the server is running.', 'error');
            } else {
                this.showStatus('❌ Network request failed', 'error');
            }
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = originalText;
        }
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});