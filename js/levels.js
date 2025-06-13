/**
 * Level Loader
 * This file handles loading and managing game levels
 */

import { DEFAULT_LEVELS, DEFAULT_LEVEL_NAMES, DEFAULT_PLAYER_START_POSITIONS } from './default_levels.js';

class LevelLoader {
    constructor() {
        // Level data
        this.levels = [];
        this.levelNames = [];
        this.playerStartPositions = [];
        this.spikeRotations = [];

        // Game state
        this.currentLevel = 0;
        this.unlockedLevels = 1; // Start with only the first level unlocked

        // Load default levels
        this.initialize();
    }

    /**
     * Initialize the level loader
     */
    initialize() {
        // Load default levels first
        this.loadDefaultLevels();

        // Check for saved levels in localStorage
        const hasSavedLevels = this.loadSavedLevels();
        if (!hasSavedLevels) {
            this.saveToStorage();
        }

        // Check if a test level is being requested
        this.checkTestLevel();

        // Load progress
        this.loadProgress();

        console.log(`Initialized Level Loader with ${this.levels.length} levels`);
    }

    /**
     * Load default levels
     */
    loadDefaultLevels() {
        this.levels = DEFAULT_LEVELS;
        this.levelNames = DEFAULT_LEVEL_NAMES;
        this.playerStartPositions = DEFAULT_PLAYER_START_POSITIONS;
        this.spikeRotations = [];
    }

    /**
     * Load levels from localStorage
     */
    loadSavedLevels() {
        try {
            const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS);
            const savedNames = localStorage.getItem(STORAGE_KEYS.LEVEL_NAMES);

            if (!savedLevels || !savedNames) return false;

            this.levels = JSON.parse(savedLevels);
            this.levelNames = JSON.parse(savedNames);

            // Load start positions if available
            const savedStartPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
            if (savedStartPositions) {
                this.playerStartPositions = JSON.parse(savedStartPositions);
            }

            // Load spike rotations if available
            const savedRotations = localStorage.getItem('platformerSpikeRotations');
            if (savedRotations) {
                this.spikeRotations = JSON.parse(savedRotations);
            }

            return true;
        } catch (error) {
            console.error("Error loading levels from storage:", error);
            return false;
        }
    }

    /**
     * Save current levels to localStorage
     */
    saveToStorage() {
        localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(this.levels));
        localStorage.setItem(STORAGE_KEYS.LEVEL_NAMES, JSON.stringify(this.levelNames));
        localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(this.playerStartPositions));

        if (this.spikeRotations.length > 0) {
            localStorage.setItem('platformerSpikeRotations', JSON.stringify(this.spikeRotations));
        }
    }

    /**
     * Check if a test level is being requested
     */
    checkTestLevel() {
        // First try to load from localStorage (level editor)
        if (!this.checkTestLevelFromStorage()) {
            // If no test level from storage, check URL parameters
            this.checkTestLevelFromURL();
        }
    }

    /**
     * Check if a test level is specified in localStorage
     */
    checkTestLevelFromStorage() {
        const testLevelIndex = localStorage.getItem('testPlayLevel');
        if (testLevelIndex === null) return false;

        const levelIndex = parseInt(testLevelIndex);
        if (this.isValidLevelIndex(levelIndex)) {
            this.unlockAndSetLevel(levelIndex);
            // Remove the test level from localStorage
            localStorage.removeItem('testPlayLevel');
            return true;
        }
        return false;
    }

    /**
     * Check if a test level is specified in URL parameters
     */
    checkTestLevelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTestLevel = urlParams.get('testLevel');
        if (urlTestLevel === null) return false;

        const levelIndex = parseInt(urlTestLevel);
        if (this.isValidLevelIndex(levelIndex)) {
            this.unlockAndSetLevel(levelIndex);
            return true;
        }
        return false;
    }

    /**
     * Load game progress from localStorage
     */
    loadProgress() {
        try {
            const savedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                this.unlockedLevels = progress.unlockedLevels || 1;
            }
        } catch (error) {
            console.error("Error loading progress:", error);
            this.unlockedLevels = 1;
        }
    }

    /**
     * Check if a level index is valid
     */
    isValidLevelIndex(index) {
        return !isNaN(index) && index >= 0 && index < this.levels.length;
    }

    /**
     * Unlock and set the current level
     */
    unlockAndSetLevel(levelIndex) {
        // Unlock this level for testing if needed
        if (levelIndex >= this.unlockedLevels) {
            this.unlockedLevels = levelIndex + 1;
            this.saveProgress();
        }
        this.currentLevel = levelIndex;
    }

    /**
     * Save progress to localStorage
     */
    saveProgress() {
        localStorage.setItem(STORAGE_KEYS.PROGRESS,
            JSON.stringify({ unlockedLevels: this.unlockedLevels }));
    }

    // ===== ACCESSOR METHODS =====

    /**
     * Get a level by index
     */
    getLevel(index) {
        return this.isValidLevelIndex(index) ? this.levels[index] : null;
    }

    /**
     * Get the current level
     */
    getCurrentLevel() {
        return this.getLevel(this.currentLevel);
    }

    /**
     * Set current level if it's valid and unlocked
     */
    setCurrentLevel(index) {
        if (index >= 0 && index < this.levels.length && index < this.unlockedLevels) {
            this.currentLevel = index;
            return true;
        }
        return false;
    }

    /**
     * Get level name by index
     */
    getLevelName(index) {
        return (index >= 0 && index < this.levelNames.length)
            ? this.levelNames[index]
            : `Level ${index + 1}`;
    }

    /**
     * Get the current level name
     */
    getCurrentLevelName() {
        return this.getLevelName(this.currentLevel);
    }

    /**
     * Advance to the next level and update progress
     */
    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            // Unlock the next level if it's not already unlocked
            if (this.currentLevel + 1 >= this.unlockedLevels) {
                this.unlockedLevels = this.currentLevel + 2;
                this.saveProgress();
            }
            this.currentLevel++;
            return true;
        }
        return false; // No more levels
    }

    /**
     * Get total number of levels
     */
    getLevelCount() {
        return this.levels.length;
    }

    /**
     * Check if a level is unlocked
     */
    isLevelUnlocked(index) {
        return index < this.unlockedLevels;
    }

    /**
     * Find a safe starting position for the player in the current level
     */
    findPlayerStartPosition() {
        // First try to use a custom start position if available
        const customPosition = this.getCustomStartPosition();
        if (customPosition) return customPosition;

        // Otherwise find a suitable position in the level
        return this.findSuitableStartPosition();
    }

    /**
     * Get custom start position for current level if available
     */
    getCustomStartPosition() {
        const pos = this.playerStartPositions[this.currentLevel];
        if (pos?.x !== undefined && pos?.y !== undefined) {
            return {
                x: pos.x * TILE_SIZE,
                y: pos.y * TILE_SIZE
            };
        }
        return null;
    }

    /**
     * Find a suitable starting position in the level
     */
    findSuitableStartPosition() {
        const level = this.getCurrentLevel();
        if (!level) return { x: 100, y: 100 }; // Default if no level

        // Find the first empty space above solid ground
        for (let y = 0; y < level.length - 1; y++) {
            for (let x = 0; x < level[y].length; x++) {
                if (level[y][x] === 0 && level[y+1][x] === 1) {
                    return { x: x * TILE_SIZE, y: y * TILE_SIZE };
                }
            }
        }

        // Default starting position if no suitable location found
        return { x: 100, y: 100 };
    }

    /**
     * Get spike rotation for a specific tile
     */
    getSpikeRotation(x, y) {
        if (this.spikeRotations?.[this.currentLevel]?.[y]?.[x] !== undefined) {
            return this.spikeRotations[this.currentLevel][y][x];
        }
        return 0; // Default rotation
    }
}

// Create and export the level loader instance
const levelLoader = new LevelLoader();
export { levelLoader };