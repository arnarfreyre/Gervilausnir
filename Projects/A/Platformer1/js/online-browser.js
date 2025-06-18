// online-browser.js - Handles the online level browsing interface

class OnlineLevelBrowser {
    constructor(uiManager, gameManager) {
        this.uiManager = uiManager;
        this.gameManager = gameManager;

        // Pagination state
        this.lastDoc = null;
        this.hasMore = true;
        this.currentFilter = {
            orderBy: 'createdAt',
            difficulty: null
        };

        // Current level being viewed
        this.currentViewedLevel = null;

        // Initialize
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Browse tab controls
        const sortBy = document.getElementById('sortBy');
        const difficultyFilter = document.getElementById('difficultyFilter');
        const loadMoreBtn = document.getElementById('loadMoreLevels');

        if (sortBy) {
            sortBy.addEventListener('change', () => this.applyFilters());
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => this.applyFilters());
        }

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreLevels());
        }

        // Search functionality
        const searchButton = document.getElementById('searchButton');
        const searchInput = document.getElementById('levelSearchInput');

        if (searchButton) {
            searchButton.addEventListener('click', () => this.searchLevels());
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchLevels();
            });
        }

        // Level details modal
        const modalClose = document.getElementById('levelDetailsClose');
        const playButton = document.getElementById('playOnlineLevel');
        const rateButton = document.getElementById('rateLevelButton');
        const submitRating = document.getElementById('submitRating');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeLevelDetails());
        }

        if (playButton) {
            playButton.addEventListener('click', () => this.playSelectedLevel());
        }

        if (rateButton) {
            rateButton.addEventListener('click', () => this.showRatingInterface());
        }

        if (submitRating) {
            submitRating.addEventListener('click', () => this.submitRating());
        }

        // Star rating input
        document.querySelectorAll('.star-rating-input .star').forEach(star => {
            star.addEventListener('click', (e) => this.selectRating(e.target));
            star.addEventListener('mouseenter', (e) => this.hoverRating(e.target));
        });

        document.querySelector('.star-rating-input')?.addEventListener('mouseleave',
            () => this.resetRatingHover());
    }

    async show() {
        // Show the online levels menu
        document.getElementById('onlineLevelsMenu').style.display = 'flex';

        // Load initial content
        await this.loadBrowseLevels();
    }

    hide() {
        document.getElementById('onlineLevelsMenu').style.display = 'none';
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const activeTab = document.getElementById(tabName + 'Tab');
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Load content for the tab
        switch (tabName) {
            case 'browse':
                this.loadBrowseLevels();
                break;
            case 'featured':
                this.loadFeaturedLevels();
                break;
            case 'my-levels':
                this.loadMyLevels();
                break;
        }
    }

    async loadBrowseLevels(reset = true) {
        if (reset) {
            this.lastDoc = null;
            this.hasMore = true;
            document.getElementById('onlineLevelsList').innerHTML = '';
        }

        try {
            const options = {
                orderBy: this.currentFilter.orderBy,
                startAfter: this.lastDoc,
                filters: {}
            };

            if (this.currentFilter.difficulty) {
                options.filters.difficulty = this.currentFilter.difficulty;
            }

            const result = await window.levelAPI.getLevels(options);

            this.displayLevels(result.levels, 'onlineLevelsList');
            this.lastDoc = result.lastDoc;
            this.hasMore = result.hasMore;

            // Update load more button
            const loadMoreBtn = document.getElementById('loadMoreLevels');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
            }

        } catch (error) {
            console.error('Error loading levels:', error);
            this.showError('Failed to load levels');
        }
    }

    async loadMoreLevels() {
        await this.loadBrowseLevels(false);
    }

    applyFilters() {
        this.currentFilter.orderBy = document.getElementById('sortBy').value;
        this.currentFilter.difficulty = document.getElementById('difficultyFilter').value || null;
        this.loadBrowseLevels();
    }

    async loadFeaturedLevels() {
        try {
            const featured = await window.levelAPI.getFeaturedLevels();

            this.displayLevels(featured.popular, 'popularLevels');
            this.displayLevels(featured.topRated, 'topRatedLevels');
            this.displayLevels(featured.recent, 'recentLevels');

        } catch (error) {
            console.error('Error loading featured levels:', error);
            this.showError('Failed to load featured levels');
        }
    }

    async searchLevels() {
        const searchTerm = document.getElementById('levelSearchInput').value.trim();

        if (!searchTerm) {
            this.showError('Please enter a search term');
            return;
        }

        try {
            const results = await window.levelAPI.searchLevels(searchTerm);
            this.displayLevels(results, 'searchResults');

            if (results.length === 0) {
                document.getElementById('searchResults').innerHTML =
                    '<p style="text-align: center; color: #888;">No levels found matching your search.</p>';
            }

        } catch (error) {
            console.error('Error searching levels:', error);
            this.showError('Failed to search levels');
        }
    }

    async loadMyLevels() {
        const authorName = localStorage.getItem('platformerAuthorName');

        if (!authorName) {
            document.querySelector('.no-levels-message').style.display = 'block';
            document.getElementById('myLevelsList').innerHTML = '';
            return;
        }

        try {
            const options = {
                filters: { author: authorName }
            };

            const result = await window.levelAPI.getLevels(options);

            if (result.levels.length === 0) {
                document.querySelector('.no-levels-message').style.display = 'block';
                document.getElementById('myLevelsList').innerHTML = '';
            } else {
                document.querySelector('.no-levels-message').style.display = 'none';
                this.displayLevels(result.levels, 'myLevelsList');
            }

        } catch (error) {
            console.error('Error loading my levels:', error);
            this.showError('Failed to load your levels');
        }
    }

    displayLevels(levels, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // For featured lists, clear existing content
        if (containerId.includes('Levels') && containerId !== 'onlineLevelsList') {
            container.innerHTML = '';
        }

        levels.forEach(level => {
            const card = this.createLevelCard(level);
            container.appendChild(card);
        });
    }

    createLevelCard(level) {
        const card = document.createElement('div');
        card.className = 'online-level-card';
        card.onclick = () => this.showLevelDetails(level);

        const difficultyClass = `difficulty-${level.difficulty || 'medium'}`;
        const rating = level.rating ? '★'.repeat(Math.round(level.rating)) : 'Not rated';

        card.innerHTML = `
            <div class="level-card-header">
                <h3 class="level-card-title">${this.escapeHtml(level.name)}</h3>
                <span class="difficulty-badge ${difficultyClass}">${level.difficulty || 'Medium'}</span>
            </div>
            <div class="level-card-stats">
                <div class="stat-item">
                    <span>🎮</span>
                    <span>${level.plays || 0} plays</span>
                </div>
                <div class="stat-item">
                    <span>✓</span>
                    <span>${level.completions || 0} completed</span>
                </div>
                <div class="stat-item">
                    <span>⭐</span>
                    <span>${rating}</span>
                </div>
                <div class="stat-item">
                    <span>📅</span>
                    <span>${this.formatDate(level.createdAt)}</span>
                </div>
            </div>
            <div class="level-card-author">by ${this.escapeHtml(level.author)}</div>
        `;

        return card;
    }

    async showLevelDetails(level) {
        this.currentViewedLevel = level;

        // Update modal content
        document.getElementById('levelDetailsName').textContent = level.name;
        document.getElementById('levelDetailsAuthor').textContent = level.author;
        document.getElementById('levelDetailsDifficulty').textContent = level.difficulty || 'Medium';
        document.getElementById('levelDetailsPlays').textContent = level.plays || 0;
        document.getElementById('levelDetailsCompletions').textContent = level.completions || 0;

        // Update rating display
        const ratingContainer = document.getElementById('levelDetailsRating');
        const rating = Math.round(level.rating || 0);
        ratingContainer.innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);

        // Draw level preview
        this.drawLevelPreview(level);

        // Show modal
        document.getElementById('levelDetailsModal').style.display = 'flex';

        // Hide rating interface initially
        document.getElementById('ratingInterface').style.display = 'none';
    }

    drawLevelPreview(level) {
        const canvas = document.getElementById('levelPreviewCanvas');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#000022';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scale
        const scale = canvas.width / (GRID_WIDTH * TILE_SIZE);
        const scaledTileSize = TILE_SIZE * scale;

        // Draw tiles
        if (level.grid) {
            for (let y = 0; y < level.grid.length; y++) {
                for (let x = 0; x < level.grid[y].length; x++) {
                    const tileId = level.grid[y][x];
                    if (tileId === 0) continue;

                    const tileType = TILE_TYPES[tileId];
                    if (!tileType) continue;

                    ctx.fillStyle = tileType.color;
                    ctx.fillRect(
                        x * scaledTileSize,
                        y * scaledTileSize,
                        scaledTileSize,
                        scaledTileSize
                    );
                }
            }
        }

        // Draw start position
        if (level.startPosition) {
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(
                level.startPosition.x * scaledTileSize,
                level.startPosition.y * scaledTileSize,
                PLAYER_WIDTH * scale,
                PLAYER_HEIGHT * scale
            );
        }
    }

    closeLevelDetails() {
        document.getElementById('levelDetailsModal').style.display = 'none';
        this.currentViewedLevel = null;
    }

    async playSelectedLevel() {
        if (!this.currentViewedLevel) return;

        try {
            const level = this.currentViewedLevel;

            // Parse grid and rotations
            if (typeof level.grid === 'string') {
                level.grid = JSON.parse(level.grid);
            }
            if (level.spikeRotations && typeof level.spikeRotations === 'string') {
                level.spikeRotations = JSON.parse(level.spikeRotations);
            }

            // Close UI
            this.closeLevelDetails();
            this.hide();

            // Store originals
            if (!window.originalLevels) {
                window.originalLevels = JSON.parse(JSON.stringify(window.levelLoader.levels));
                window.originalLevelNames = [...window.levelLoader.levelNames];
            }

            // Load level
            window.levelLoader.levels[0] = level.grid;
            window.levelLoader.levelNames[0] = level.name;
            if (level.startPosition && window.levelLoader.playerStartPositions) {
                window.levelLoader.playerStartPositions[0] = level.startPosition;
            }

            // Start game
            this.gameManager.startLevel(0);

        } catch (error) {
            console.error('Error loading level:', error);
            this.showError('Failed to load level');
        }
    }
    showRatingInterface() {
        document.getElementById('ratingInterface').style.display = 'block';
        document.getElementById('rateLevelButton').style.display = 'none';
    }

    selectRating(star) {
        const rating = parseInt(star.dataset.rating);

        document.querySelectorAll('.star-rating-input .star').forEach((s, index) => {
            s.classList.toggle('selected', index < rating);
            s.textContent = index < rating ? '★' : '☆';
        });

        star.dataset.selectedRating = rating;
    }

    hoverRating(star) {
        const rating = parseInt(star.dataset.rating);

        document.querySelectorAll('.star-rating-input .star').forEach((s, index) => {
            s.textContent = index < rating ? '★' : '☆';
        });
    }

    resetRatingHover() {
        document.querySelectorAll('.star-rating-input .star').forEach(s => {
            s.textContent = s.classList.contains('selected') ? '★' : '☆';
        });
    }

    async submitRating() {
        const selectedStar = document.querySelector('.star-rating-input .star.selected:last-of-type');

        if (!selectedStar || !this.currentViewedLevel) {
            this.showError('Please select a rating');
            return;
        }

        const rating = parseInt(selectedStar.dataset.rating) + 1; // Convert to 1-5 scale

        try {
            const success = await window.levelLoader.rateLevel(
                this.currentViewedLevel.id,
                rating
            );

            if (success) {
                // Hide rating interface
                document.getElementById('ratingInterface').style.display = 'none';

                // Show success message
                this.showNotification('Rating submitted successfully!');

                // Refresh level details
                const updatedLevel = await window.levelAPI.getLevel(this.currentViewedLevel.id);
                this.showLevelDetails(updatedLevel);
            }

        } catch (error) {
            console.error('Error submitting rating:', error);
            this.showError(error.message || 'Failed to submit rating');
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

        return date.toLocaleDateString();
    }

    showError(message) {
        // You can implement a toast notification here
        alert(message);
    }

    showNotification(message) {
        // Use the existing notification system if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 3000);
        } else {
            alert(message);
        }
    }
}

// Export for use in other modules
window.OnlineLevelBrowser = OnlineLevelBrowser;