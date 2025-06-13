/**
 * Main entry point for the Pixel Platformer Game
 * This file coordinates the loading and initialization of all game components
 */

import { levelLoader } from './levels.js';  // Changed from levelManager to levelLoader
import { audioManager } from './audio.js';
import { GameManager } from './game.js';
import { UIManager } from './ui.js';

// Create global reference to key components for debugging
window.levelLoader = levelLoader;  // Updated reference

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing game...");

    // Initialize audio manager first
    audioManager.initialize();
    window.audioManager = audioManager;

    // Create game manager
    const gameManager = new GameManager();
    window.gameManager = gameManager;

    // Create UI manager with reference to game manager
    const uiManager = new UIManager(gameManager);
    gameManager.uiManager = uiManager;
    window.uiManager = uiManager;

    // Initialize level selection menu
    uiManager.initLevelSelectMenu();

    // Show the main menu
    gameManager.gameState.state = GameStates.MENU;
    uiManager.showMenu(GameStates.MENU);

    console.log("Game initialized with", levelLoader.getLevelCount(), "levels");  // Updated reference
});