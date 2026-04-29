class BookmarkExtensionFirefox {
    constructor() {
        this.currentTab = null;
        this.activeTabType = 'bookmark';
        this.searchMode = 'input';
        this.bookmarksCache = [];
        this.filteredBookmarks = [];
        this.selectedSearchIndex = 0;
        this.searchLoaded = false;
        this.isEditingNotes = false;
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
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tabs[0];
            document.getElementById('currentUrl').textContent = this.currentTab.url;
        } catch (error) {
            console.error('Error getting current tab:', error);
            document.getElementById('currentUrl').textContent = 'Error loading current page';
        }
    }

    initTabs() {
        const tabs = document.querySelectorAll('.tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;

                if (tabType === 'settings') {
                    browser.runtime.openOptionsPage();
                    return;
                }

                this.switchToTab(tabType);
            });
        });
    }

    switchToTab(tabType) {
        const tabs = document.querySelectorAll('.tab');
        const panels = document.querySelectorAll('.tab-panel');

        tabs.forEach(t => t.classList.remove('active'));
        const targetTab = document.querySelector(`[data-tab="${tabType}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        panels.forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(`${tabType}-panel`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        this.activeTabType = tabType;

        if (tabType === 'bookmark') {
            document.getElementById('bookmarkNotes').focus();
        } else if (tabType === 'note') {
            document.getElementById('noteContent').focus();
        } else if (tabType === 'search') {
            this.searchMode = 'input';
            this.updateSearchHint();
            this.focusSearchInput();
            this.loadBookmarksForSearch();
        }
    }

    handleCommandShortcut() {
        const urlParams = new URLSearchParams(window.location.search);
        const openTab = urlParams.get('tab');

        if (openTab === 'note') {
            this.switchToTab('note');
            setTimeout(() => document.getElementById('noteContent').focus(), 100);
        }

        if (openTab === 'search') {
            this.switchToTab('search');
            setTimeout(() => this.focusSearchInput(), 100);
        }
    }

    bindEvents() {
        document.getElementById('saveBookmarkBtn').addEventListener('click', () => this.saveBookmark());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());

        document.getElementById('cancelBtn').addEventListener('click', () => window.close());
        document.getElementById('cancelBtn2').addEventListener('click', () => window.close());

        const searchInput = document.getElementById('bookmarkSearchInput');
        searchInput.addEventListener('input', () => {
            this.searchMode = 'input';
            this.updateSearchHint();
            this.filterSearchResults(searchInput.value);
        });

        document.getElementById('bookmarkSearchResults').addEventListener('click', (event) => {
            const item = event.target.closest('li[data-index]');
            if (!item) {
                return;
            }

            this.selectedSearchIndex = Number(item.dataset.index);
            this.searchMode = 'list';
            this.updateSearchHint();
            this.cancelNotesEdit();
            this.renderSearchResults();
            this.updateNotesPreview();
        });

        document.getElementById('editNotesBtn').addEventListener('click', () => this.startNotesEdit());
        document.getElementById('saveNotesBtn').addEventListener('click', () => this.saveEditedNotes());
        document.getElementById('cancelNotesBtn').addEventListener('click', () => this.cancelNotesEdit());

        document.addEventListener('keydown', (e) => {
            if (this.activeTabType === 'search') {
                if (this.isEditingNotes && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    this.saveEditedNotes();
                    return;
                }

                if (this.isEditingNotes && e.key === 'Enter') {
                    return;
                }

                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.toggleSearchMode();
                    return;
                }

                if (e.key === 'j' && this.searchMode === 'list') {
                    e.preventDefault();
                    this.moveSearchSelection(1);
                    return;
                }

                if (e.key === 'k' && this.searchMode === 'list') {
                    e.preventDefault();
                    this.moveSearchSelection(-1);
                    return;
                }

                if (e.key === 'Enter') {
                    if (this.searchMode === 'input' && this.filteredBookmarks.length === 1) {
                        e.preventDefault();
                        this.openSearchResult(0);
                        return;
                    }

                    if (this.searchMode === 'list' && this.filteredBookmarks.length > 0) {
                        e.preventDefault();
                        this.openSearchResult(this.selectedSearchIndex);
                        return;
                    }
                }
            }

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

        document.getElementById('bookmarkNotes').focus();
    }

    async loadBookmarksForSearch() {
        if (this.searchLoaded) {
            this.filterSearchResults(document.getElementById('bookmarkSearchInput').value);
            return;
        }

        try {
            const token = await this.authenticate();
            const settings = await browser.storage.sync.get(['serverUrl']);
            const response = await fetch(`${settings.serverUrl}/api/bookmarks/search?limit=2000`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load bookmarks');
            }

            const data = await response.json();
            this.bookmarksCache = Array.isArray(data.bookmarks) ? data.bookmarks : [];
            this.searchLoaded = true;
            this.filterSearchResults(document.getElementById('bookmarkSearchInput').value);
        } catch (error) {
            console.error('Error loading bookmarks for search:', error);
            this.showStatus(error.message || 'Failed to load bookmarks for search', 'error');
        }
    }

    filterSearchResults(rawQuery) {
        const query = rawQuery.trim().toLowerCase();

        if (!query) {
            this.filteredBookmarks = this.bookmarksCache.slice(0, 100);
            this.selectedSearchIndex = 0;
            this.renderSearchResults();
            return;
        }

        const scored = this.bookmarksCache
            .map(bookmark => ({
                bookmark,
                score: this.fuzzyScore(query, `${bookmark.title || ''} ${bookmark.url || ''} ${bookmark.tags || ''} ${bookmark.notes || ''} ${bookmark.domain || ''}`)
            }))
            .filter(entry => entry.score >= 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 100)
            .map(entry => entry.bookmark);

        this.filteredBookmarks = scored;
        this.selectedSearchIndex = 0;
        this.renderSearchResults();
    }

    fuzzyScore(query, value) {
        const text = value.toLowerCase();

        if (text.includes(query)) {
            return 1000 - text.indexOf(query);
        }

        let textIndex = 0;
        let score = 0;
        let streak = 0;

        for (const char of query) {
            const foundIndex = text.indexOf(char, textIndex);
            if (foundIndex === -1) {
                return -1;
            }

            if (foundIndex === textIndex) {
                streak += 1;
                score += 5 + streak;
            } else {
                streak = 0;
                score += 1;
            }

            textIndex = foundIndex + 1;
        }

        return score;
    }

    renderSearchResults() {
        const resultsNode = document.getElementById('bookmarkSearchResults');
        const emptyNode = document.getElementById('bookmarkSearchEmpty');
        resultsNode.innerHTML = '';

        if (this.filteredBookmarks.length === 0) {
            emptyNode.style.display = 'block';
            return;
        }

        emptyNode.style.display = 'none';

        this.filteredBookmarks.forEach((bookmark, index) => {
            const item = document.createElement('li');
            item.dataset.index = String(index);
            if (index === this.selectedSearchIndex && this.searchMode === 'list') {
                item.classList.add('selected');
            }

            const notesSnippet = this.clipText((bookmark.notes || '').trim(), 140);

            item.innerHTML = `
                <div class="result-title">${this.escapeHtml(bookmark.title || '(untitled)')}</div>
                <div class="result-url">${this.escapeHtml(bookmark.url || '')}</div>
                <div class="result-notes">${this.escapeHtml(notesSnippet || 'No notes')}</div>
            `;

            resultsNode.appendChild(item);
        });

        this.updateNotesPreview();
    }

    clipText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 1)}...`;
    }

    updateNotesPreview() {
        const previewNode = document.getElementById('bookmarkNotesPreviewContent');
        const editButton = document.getElementById('editNotesBtn');
        if (!previewNode) {
            return;
        }

        const selected = this.filteredBookmarks[this.selectedSearchIndex];
        if (!selected) {
            this.isEditingNotes = false;
            document.getElementById('bookmarkNotesPreviewContent').style.display = 'block';
            document.getElementById('bookmarkNotesEditor').style.display = 'none';
            document.getElementById('editNotesBtn').style.display = 'inline-block';
            document.getElementById('saveNotesBtn').style.display = 'none';
            document.getElementById('cancelNotesBtn').style.display = 'none';
            previewNode.textContent = 'Select a bookmark to read notes';
            editButton.disabled = true;
            return;
        }

        editButton.disabled = false;
        const notes = (selected.notes || '').trim();
        if (!this.isEditingNotes) {
            previewNode.textContent = notes || 'No notes on this bookmark';
        }
    }

    startNotesEdit() {
        const selected = this.filteredBookmarks[this.selectedSearchIndex];
        if (!selected) {
            return;
        }

        this.isEditingNotes = true;
        const preview = document.getElementById('bookmarkNotesPreviewContent');
        const editor = document.getElementById('bookmarkNotesEditor');
        const editBtn = document.getElementById('editNotesBtn');
        const saveBtn = document.getElementById('saveNotesBtn');
        const cancelBtn = document.getElementById('cancelNotesBtn');

        editor.value = selected.notes || '';
        preview.style.display = 'none';
        editor.style.display = 'block';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        editor.focus();
        editor.setSelectionRange(editor.value.length, editor.value.length);
    }

    cancelNotesEdit() {
        this.isEditingNotes = false;
        const preview = document.getElementById('bookmarkNotesPreviewContent');
        const editor = document.getElementById('bookmarkNotesEditor');
        const editBtn = document.getElementById('editNotesBtn');
        const saveBtn = document.getElementById('saveNotesBtn');
        const cancelBtn = document.getElementById('cancelNotesBtn');

        preview.style.display = 'block';
        editor.style.display = 'none';
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        this.updateNotesPreview();
    }

    async saveEditedNotes() {
        const selected = this.filteredBookmarks[this.selectedSearchIndex];
        if (!selected) {
            return;
        }

        const editor = document.getElementById('bookmarkNotesEditor');
        const updatedNotes = editor.value.trim();

        try {
            const token = await this.authenticate();
            const settings = await browser.storage.sync.get(['serverUrl']);
            const response = await fetch(`${settings.serverUrl}/api/bookmarks/${selected.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    url: selected.url,
                    notes: updatedNotes,
                    tags: selected.tags || ''
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update notes');
            }

            selected.notes = updatedNotes;
            const cacheMatch = this.bookmarksCache.find((bookmark) => bookmark.id === selected.id);
            if (cacheMatch) {
                cacheMatch.notes = updatedNotes;
            }

            this.cancelNotesEdit();
            this.renderSearchResults();
            this.showStatus('Notes updated', 'success');
        } catch (error) {
            console.error('Error updating notes:', error);
            this.showStatus(error.message || 'Failed to update notes', 'error');
        }
    }

    escapeHtml(text) {
        return text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    toggleSearchMode() {
        if (this.searchMode === 'input') {
            if (this.filteredBookmarks.length === 0) {
                return;
            }

            this.searchMode = 'list';
            document.getElementById('bookmarkSearchInput').blur();
        } else {
            this.searchMode = 'input';
            this.focusSearchInput();
        }

        this.updateSearchHint();
        this.renderSearchResults();
    }

    updateSearchHint() {
        const hint = document.getElementById('searchModeHint');

        if (this.searchMode === 'input') {
            hint.textContent = 'Mode: typing (Tab toggles to list)';
        } else {
            hint.textContent = 'Mode: list navigation (j/k move, Enter opens, Tab returns to typing)';
        }
    }

    moveSearchSelection(direction) {
        const count = this.filteredBookmarks.length;
        if (count === 0) {
            return;
        }

        this.selectedSearchIndex = (this.selectedSearchIndex + direction + count) % count;
        this.renderSearchResults();
        this.updateNotesPreview();

        const selected = document.querySelector('#bookmarkSearchResults li.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }

    openSearchResult(index) {
        const bookmark = this.filteredBookmarks[index];

        if (!bookmark || !bookmark.url) {
            this.showStatus('Selected item has no URL to open', 'error');
            return;
        }

        browser.tabs.create({ url: bookmark.url, active: true });
        window.close();
    }

    focusSearchInput() {
        const input = document.getElementById('bookmarkSearchInput');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    }

    async authenticate() {
        const settings = await browser.storage.sync.get(['serverUrl', 'username', 'password']);

        if (!settings.serverUrl || !settings.username || !settings.password) {
            throw new Error('Please configure your credentials in the extension settings');
        }

        try {
            new URL(settings.serverUrl);
        } catch {
            throw new Error('Invalid server URL in settings');
        }

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
            throw new Error(`Authentication failed: ${loginError.error || 'Invalid credentials'}`);
        }

        const loginData = await loginResponse.json();
        return loginData.token;
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

    async saveItem(payload, type) {
        const saveBtn = document.getElementById(type === 'bookmark' ? 'saveBookmarkBtn' : 'saveNoteBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const settings = await browser.storage.sync.get(['serverUrl']);
            const token = await this.authenticate();

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

                if (type === 'bookmark') {
                    document.getElementById('bookmarkNotes').value = '';
                    document.getElementById('bookmarkTags').value = '';
                } else {
                    document.getElementById('noteContent').value = '';
                    document.getElementById('noteTags').value = '';
                }

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
                this.showStatus(error.message || 'Error: Network request failed', 'error');
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

document.addEventListener('DOMContentLoaded', () => {
    new BookmarkExtensionFirefox();
});
