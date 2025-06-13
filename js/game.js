/**
 * Game Manager
 * Handles game initialization, loop, and state management
 */
import { levelLoader } from './levels.js';
import { audioManager } from './audio.js';

class GameManager {
    /**
     * Initialize the game manager
     */
    constructor() {
        // Initialize canvas and subsystems
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);

        // Will be set by app.js after construction
        this.uiManager = null;

        // Game state
        this.gameState = {
            player: null,
            currentLevel: null,
            levelStartTime: 0,
            levelTime: 0,
            deaths: 0,
            keys: {},
            state: GameStates.MENU,
            particles: []
        };

        // Game loop timing
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / 60; // Target 60 FPS
        this.accumulatedTime = 0;
        this.animationFrameId = null;

        // Initialize game
        this.checkForTestLevel();
        this.loadSettings();
        this.setupEventListeners();
    }

    /**
     * Check if a test level is specified in the URL
     */
    checkForTestLevel() {
        const urlParams = new URLSearchParams(window.location.search);
        const testLevel = urlParams.get('testLevel');

        if (testLevel !== null) {
            this.testLevelIndex = parseInt(testLevel);
        }
    }

    /**
     * Load game settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            const settings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
            this.updateSettings(settings);
        } catch (error) {
            console.error("Error loading settings:", error);
            this.updateSettings(DEFAULT_SETTINGS);
        }
    }

    /**
     * Update game settings
     * @param {Object} settings - The settings to apply
     */
    updateSettings(settings) {
        // Update renderer settings
        if (settings.showFPS !== undefined) {
            this.renderer.settings.showFPS = settings.showFPS;
        }

        if (settings.pixelPerfect !== undefined) {
            this.renderer.settings.pixelPerfect = settings.pixelPerfect;
            this.renderer.updateRenderSettings();
        }

        // Update audio settings
        audioManager.updateSettings(settings);

        // Update UI to reflect new settings (if UI manager exists)
        if (this.uiManager) {
            this.uiManager.loadSettingsIntoUI(settings);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Keyboard events for player control
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Pause when tab is not active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameState.state === GameStates.PLAYING) {
                this.pauseGame();
            }
        });
    }

    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        this.gameState.keys[e.key] = true;

        // Handle special keys
        switch (e.key) {
            case 'Escape':
                if (this.gameState.state === GameStates.PLAYING) {
                    this.pauseGame();
                } else if (this.gameState.state === GameStates.PAUSED) {
                    this.resumeGame();
                }
                break;
            case 'r':
                if (this.gameState.state === GameStates.PLAYING) {
                    this.restartLevel();
                }
                break;
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        this.gameState.keys[e.key] = false;
    }

    /**
     * Start the game
     */
    startGame() {
        console.log("Starting game...");

        // If a test level was specified, start that level
        if (this.testLevelIndex !== undefined) {
            this.startLevel(this.testLevelIndex);
            this.testLevelIndex = undefined; // Clear test level index
        } else {
            this.startLevel(0); // Start from first level
        }
    }

    /**
     * Start a specific level
     * @param {number} levelIndex - The level index to start
     */
    startLevel(levelIndex) {
        console.log("Starting level:", levelIndex);

        if (!levelLoader.setCurrentLevel(levelIndex)) {
            console.error("Invalid level index:", levelIndex);
            return;
        }

        // When explicitly starting a level from level select, reset deaths counter
        if (this.gameState.state !== GameStates.PLAYING) {
            this.gameState.deaths = 0;
        }

        this.resetGameState();

        if (this.uiManager) {
            this.uiManager.hideAllMenus();
        }

        // Start game loop
        this.gameState.state = GameStates.PLAYING;
        this.lastUpdateTime = performance.now();
        this.accumulatedTime = 0;

        // Clear any existing animation frame
        this.cancelAnimationFrame();

        // Start the game loop
        this.gameLoop();

        // Start audio
        audioManager.initialize();
        audioManager.playMusic();
    }

    /**
     * Reset the game state for a new level
     */
    resetGameState() {
        // Get current level
        this.gameState.currentLevel = levelLoader.getCurrentLevel();

        // Find player start position
        const startPos = levelLoader.findPlayerStartPosition();

        // Create or reset player
        if (this.gameState.player) {
            this.gameState.player.reset(startPos.x, startPos.y);
        } else {
            this.gameState.player = new Player(startPos.x, startPos.y);
        }

        // Reset game state
        this.gameState.particles = [];
        this.gameState.levelStartTime = performance.now();
        this.gameState.levelTime = 0;

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameUI(levelLoader.currentLevel, this.gameState.deaths);
        }
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.gameState.state === GameStates.PLAYING) {
            this.gameState.state = GameStates.PAUSED;

            if (this.uiManager) {
                this.uiManager.showMenu(GameStates.PAUSED);
            }

            audioManager.pauseMusic();
            this.cancelAnimationFrame();
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        if (this.gameState.state === GameStates.PAUSED) {
            this.gameState.state = GameStates.PLAYING;

            if (this.uiManager) {
                this.uiManager.hideAllMenus();
            }

            audioManager.playMusic();

            // Reset timing to avoid large jumps
            this.lastUpdateTime = performance.now();
            this.accumulatedTime = 0;

            // Restart the game loop
            this.gameLoop();
        }
    }

    /**
     * Cancel the current animation frame
     */
    cancelAnimationFrame() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Exit to main menu
     */
    exitToMainMenu() {
        this.gameState.state = GameStates.MENU;

        if (this.uiManager) {
            this.uiManager.showMenu(GameStates.MENU);
        }

        audioManager.pauseMusic();
    }

    /**
     * Go to next level
     */
    nextLevel() {
        // Reset deaths counter when completing a level
        this.gameState.deaths = 0;

        if (levelLoader.currentLevel >= levelLoader.getLevelCount() - 1) {
            // No more levels, go back to menu
            this.exitToMainMenu();
        } else {
            levelLoader.nextLevel();
            this.startLevel(levelLoader.currentLevel);
        }
    }

    /**
     * Restart current level
     */
    restartLevel() {
        this.startLevel(levelLoader.currentLevel);
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        // Increment death counter
        this.gameState.deaths++;

        // Update UI
        if (this.uiManager) {
            this.uiManager.updateGameUI(levelLoader.currentLevel, this.gameState.deaths);
        }

        // Create death particles
        if (this.gameState.player) {
            this.gameState.player.createParticleEffect(this.gameState.particles, PARTICLE_TYPES.DEATH);
        }

        // Play death sound
        audioManager.playSound('death');

        // Reset level after a delay
        setTimeout(() => {
            this.resetGameState();
        }, 1000);
    }

    /**
     * Handle level completion
     */
    handleLevelComplete() {
        // Don't handle if already completed
        if (this.gameState.state === GameStates.LEVEL_COMPLETE) {
            return;
        }

        // Calculate level time
        this.gameState.levelTime = (performance.now() - this.gameState.levelStartTime) / 1000;

        // Set game state
        this.gameState.state = GameStates.LEVEL_COMPLETE;

        // Start player celebration effect and create goal particles
        if (this.gameState.player) {
            this.gameState.player.startCelebration();
            this.gameState.player.createGoalParticles(this.gameState.particles);
        }

        // Play completion sound
        audioManager.playSound('levelComplete');

        // Show level complete screen after a delay
        setTimeout(() => {
            if (this.uiManager) {
                this.uiManager.showLevelComplete(
                    this.gameState.deaths,
                    this.gameState.levelTime
                );
            }
        }, 1000); // Longer delay for celebration effect
    }

    /**
     * Update particles
     * @param {number} deltaTime - Time since last update in ms
     */
    updateParticles(deltaTime) {
        const timeScale = deltaTime / (1000 / 60); // Scale for 60 FPS

        for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
            const particle = this.gameState.particles[i];

            // Update particle physics
            particle.x += particle.velX * timeScale;
            particle.y += particle.velY * timeScale;
            particle.velY += particle.gravity * timeScale;
            particle.life -= timeScale;

            // Remove dead particles
            if (particle.life <= 0) {
                this.gameState.particles.splice(i, 1);
            }
        }
    }

    /**
     * Main update function
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime) {
        if (this.gameState.state !== GameStates.PLAYING) return;

        // Update player
        this.gameState.player.update(
            this.gameState.currentLevel,
            this.gameState.keys,
            this.gameState.particles,
            deltaTime
        );

        // Update particles
        this.updateParticles(deltaTime);

        // Check for level completion
        if (this.gameState.player &&
            this.gameState.player.alive &&
            this.gameState.player.isOnGoal(this.gameState.currentLevel)) {
            this.handleLevelComplete();
        }

        // Generate ice particles if player is moving on ice
        if (this.gameState.player &&
            this.gameState.player.onIce &&
            Math.abs(this.gameState.player.velX) > 5 &&
            this.gameState.player.grounded) {
            // Randomly generate ice slide particles
            if (Math.random() < 0.2) { // 20% chance each frame
                this.gameState.player.createParticleEffect(
                    this.gameState.particles,
                    PARTICLE_TYPES.ICE_SLIDE
                );
            }
        }
    }

    /**
     * Main game loop with fixed timestep
     */
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;

        // Accumulate time since last frame
        this.accumulatedTime += deltaTime;

        // Fixed timestep loop with catch-up
        const maxUpdates = 5; // Prevent spiral of death
        let updateCount = 0;

        while (this.accumulatedTime >= this.updateInterval && updateCount < maxUpdates) {
            this.update(this.updateInterval);
            this.accumulatedTime -= this.updateInterval;
            updateCount++;
        }

        // If we hit max updates, drop accumulated time to prevent lag
        if (updateCount >= maxUpdates) {
            this.accumulatedTime = 0;
        }

        // Render current state
        this.renderer.render(this.gameState);

        // Continue game loop if playing
        if (this.gameState.state === GameStates.PLAYING) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Export the GameManager class
export { GameManager };