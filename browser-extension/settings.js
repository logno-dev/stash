class SettingsManager {
    constructor() {
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadSettings();
        await this.testConnection();
    }

    bindEvents() {
        const saveBtn = document.getElementById('saveBtn');
        const testBtn = document.getElementById('testBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const serverUrl = document.getElementById('serverUrl');
        const username = document.getElementById('username');
        const password = document.getElementById('password');

        saveBtn.addEventListener('click', () => this.saveSettings());
        testBtn.addEventListener('click', () => this.testConnection());
        cancelBtn.addEventListener('click', () => window.close());
        
        // Auto-test connection when credentials change
        serverUrl.addEventListener('input', () => this.debounceTest());
        username.addEventListener('input', () => this.debounceTest());
        password.addEventListener('input', () => this.debounceTest());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.saveSettings();
            } else if (e.key === 'Escape') {
                window.close();
            }
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['serverUrl', 'username', 'password', 'authToken']);
            
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

        if (!serverUrl) {
            this.showStatus('Please enter a server URL', 'error');
            return;
        }

        if (!username || !password) {
            this.showStatus('Please enter both username and password', 'error');
            return;
        }

        try {
            // First, try to login and get a token
            const loginResponse = await fetch(`${serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                
                await chrome.storage.sync.set({ 
                    serverUrl: serverUrl,
                    username: username,
                    password: password,
                    authToken: loginData.token
                });
                
                this.showStatus('Settings saved and authenticated successfully!', 'success');
                
                // Test connection after saving
                setTimeout(() => this.testConnection(), 1000);
            } else {
                const error = await loginResponse.json();
                this.showStatus(`Authentication failed: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error connecting to server', 'error');
        }
    }

    debounceTest() {
        clearTimeout(this.testTimeout);
        this.testTimeout = setTimeout(() => this.testConnection(), 1000);
    }

    async testConnection() {
        const serverUrl = document.getElementById('serverUrl').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const testBtn = document.getElementById('testBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const connectionText = document.getElementById('connectionText');

        if (!serverUrl || !username || !password) {
            this.updateConnectionStatus(false, 'Missing URL or credentials');
            return;
        }

        const originalText = testBtn.textContent;
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        connectionText.textContent = 'Testing connection...';
        statusIndicator.className = 'status-indicator';

        try {
            // First try to login
            const loginResponse = await fetch(`${serverUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                
                // Then verify the token
                const verifyResponse = await fetch(`${serverUrl}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${loginData.token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (verifyResponse.ok) {
                    this.updateConnectionStatus(true, 'Connected and authenticated');
                    this.showStatus('Connection successful!', 'success');
                } else {
                    this.updateConnectionStatus(false, 'Token verification failed');
                    this.showStatus('Token verification failed', 'error');
                }
            } else {
                const error = await loginResponse.json();
                this.updateConnectionStatus(false, 'Invalid credentials');
                this.showStatus(`Login failed: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            this.updateConnectionStatus(false, 'Connection failed');
            this.showStatus('Could not connect to server. Check URL and network.', 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = originalText;
        }
    }

    updateConnectionStatus(connected, message) {
        const statusIndicator = document.getElementById('statusIndicator');
        const connectionText = document.getElementById('connectionText');

        statusIndicator.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
        connectionText.textContent = message;
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
        } else if (type === 'error') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});