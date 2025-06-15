// online-levels.js - Modified level loader for online functionality
import { DEFAULT_LEVELS, DEFAULT_LEVEL_NAMES, DEFAULT_PLAYER_START_POSITIONS } from './default_levels.js';

class OnlineLevelLoader {
    constructor() {
        // Level data
        this.localLevels = [];
        this.onlineLevels = [];
        this.currentLevelSet = 'default'; // 'default', 'local', 'online'

        // Current level tracking
        this.currentLevel = 0;
        this.currentOnlineLevelId = null;

        // Progress tracking
        this.localProgress = { unlockedLevels: 1 };
        this.onlineProgress = new Map(); // Map of levelId -> completion status

        // Initialize
        this.initialize();
    }

    async initialize() {
        // Load default levels
        this.loadDefaultLevels();

        // Load local custom levels
        this.loadLocalLevels();

        // Try to load online levels
        await this.loadOnlineLevels();

        // Load progress
        this.loadProgress();

        console.log('Online Level Loader initialized');
    }

    loadDefaultLevels() {
        this.defaultLevels = DEFAULT_LEVELS;
        this.defaultLevelNames = DEFAULT_LEVEL_NAMES;
        this.defaultStartPositions = DEFAULT_PLAYER_START_POSITIONS;
    }

    loadLocalLevels() {
        try {
            const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS);
            const savedNames = localStorage.getItem(STORAGE_KEYS.LEVEL_NAMES);
            const savedPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);

            if (savedLevels && savedNames) {
                this.localLevels = JSON.parse(savedLevels);
                this.localLevelNames = JSON.parse(savedNames);
                this.localStartPositions = savedPositions ? JSON.parse(savedPositions) : [];
            }
        } catch (error) {
            console.error('Error loading local levels:', error);
        }
    }

    async loadOnlineLevels(options = {}) {
        try {
            const result = await window.levelAPI.getLevels(options);
            this.onlineLevels = result.levels;
            return result;
        } catch (error) {
            console.error('Error loading online levels:', error);
            return { levels: [], hasMore: false };
        }
    }

    async loadFeaturedLevels() {
        try {
            return await window.levelAPI.getFeaturedLevels();
        } catch (error) {
            console.error('Error loading featured levels:', error);
            return { popular: [], topRated: [], recent: [] };
        }
    }

    async loadOnlineLevel(levelId) {
        try {
            const level = await window.levelAPI.getLevel(levelId);
            this.currentOnlineLevelId = levelId;
            return level;
        } catch (error) {
            console.error('Error loading online level:', error);
            throw error;
        }
    }

    // Get current level based on active set
    getCurrentLevel() {
        switch (this.currentLevelSet) {
            case 'default':
                return this.defaultLevels[this.currentLevel];
            case 'local':
                return this.localLevels[this.currentLevel];
            case 'online':
                const onlineLevel = this.onlineLevels.find(l => l.id === this.currentOnlineLevelId);
                return onlineLevel ? onlineLevel.grid : null;
            default:
                return null;
        }
    }

    getCurrentLevelInfo() {
        switch (this.currentLevelSet) {
            case 'default':
                return {
                    name: this.defaultLevelNames[this.currentLevel],
                    startPosition: this.defaultStartPositions[this.currentLevel],
                    type: 'default',
                    index: this.currentLevel
                };
            case 'local':
                return {
                    name: this.localLevelNames[this.currentLevel],
                    startPosition: this.localStartPositions[this.currentLevel],
                    type: 'local',
                    index: this.currentLevel
                };
            case 'online':
                const onlineLevel = this.onlineLevels.find(l => l.id === this.currentOnlineLevelId);
                return onlineLevel ? {
                    name: onlineLevel.name,
                    startPosition: onlineLevel.startPosition,
                    type: 'online',
                    id: onlineLevel.id,
                    author: onlineLevel.author,
                    rating: onlineLevel.rating,
                    plays: onlineLevel.plays
                } : null;
            default:
                return null;
        }
    }

    // Switch between level sets
    switchToDefaultLevels() {
        this.currentLevelSet = 'default';
        this.currentLevel = 0;
    }

    switchToLocalLevels() {
        this.currentLevelSet = 'local';
        this.currentLevel = 0;
    }

    switchToOnlineLevels() {
        this.currentLevelSet = 'online';
        this.currentOnlineLevelId = null;
    }

    // Save level completion
    async saveCompletion(completionData) {
        const levelInfo = this.getCurrentLevelInfo();

        if (levelInfo.type === 'online' && levelInfo.id) {
            // Save online completion
            try {
                await window.levelAPI.recordCompletion(levelInfo.id, completionData);

                // Update local progress
                this.onlineProgress.set(levelInfo.id, {
                    completed: true,
                    bestTime: completionData.time,
                    bestDeaths: completionData.deaths
                });

                this.saveProgress();
            } catch (error) {
                console.error('Error saving online completion:', error);
            }
        } else if (levelInfo.type === 'default' || levelInfo.type === 'local') {
            // Update local progress
            if (this.currentLevel + 1 >= this.localProgress.unlockedLevels) {
                this.localProgress.unlockedLevels = this.currentLevel + 2;
                this.saveProgress();
            }
        }
    }

    // Rate an online level
    async rateLevel(levelId, rating) {
        try {
            const userId = this.getUserId(); // Implement user identification
            await window.levelAPI.rateLevel(levelId, rating, userId);
            return true;
        } catch (error) {
            console.error('Error rating level:', error);
            return false;
        }
    }

    // Progress management
    loadProgress() {
        try {
            // Load local progress
            const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                this.localProgress = progress;
            }

            // Load online progress
            const onlineProgressData = localStorage.getItem('platformerOnlineProgress');
            if (onlineProgressData) {
                const data = JSON.parse(onlineProgressData);
                this.onlineProgress = new Map(data);
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }

    saveProgress() {
        // Save local progress
        localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.localProgress));

        // Save online progress
        const onlineProgressArray = Array.from(this.onlineProgress.entries());
        localStorage.setItem('platformerOnlineProgress', JSON.stringify(onlineProgressArray));
    }

    // Helper methods
    getUserId() {
        // Simple implementation - in production, use proper authentication
        let userId = localStorage.getItem('platformerUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('platformerUserId', userId);
        }
        return userId;
    }

    getLevelCount() {
        switch (this.currentLevelSet) {
            case 'default':
                return this.defaultLevels.length;
            case 'local':
                return this.localLevels.length;
            case 'online':
                return this.onlineLevels.length;
            default:
                return 0;
        }
    }

    isLevelUnlocked(index) {
        if (this.currentLevelSet === 'online') {
            return true; // All online levels are accessible
        }
        return index < this.localProgress.unlockedLevels;
    }

    findPlayerStartPosition() {
        const levelInfo = this.getCurrentLevelInfo();
        const startPos = levelInfo?.startPosition || { x: 1, y: 12 };

        return {
            x: startPos.x * TILE_SIZE,
            y: startPos.y * TILE_SIZE
        };
    }
}

// Create singleton instance
const onlineLevelLoader = new OnlineLevelLoader();
export { onlineLevelLoader as levelLoader };