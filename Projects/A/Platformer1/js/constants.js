/**
 * Game Constants
 * This file contains all global constants used throughout the game
 */

//-----------------------------------------------------------------------------
// DISPLAY CONSTANTS
//-----------------------------------------------------------------------------

/** Size of each tile in pixels */
const TILE_SIZE = 32;

/** Width of the game grid in tiles */
const GRID_WIDTH = 25;

/** Height of the game grid in tiles */
const GRID_HEIGHT = 16;

/** Width of the canvas in pixels */
const CANVAS_WIDTH = 800;

/** Height of the canvas in pixels */
const CANVAS_HEIGHT = 600;

//-----------------------------------------------------------------------------
// PLAYER CONSTANTS
//-----------------------------------------------------------------------------

/** Width of the player character in pixels */
const PLAYER_WIDTH = 24;

/** Height of the player character in pixels */
const PLAYER_HEIGHT = 32;

/** Downward acceleration applied each frame */
const GRAVITY = 0.5;

/** Initial upward velocity when jumping (negative for up) */
const JUMP_FORCE = -12;

/** Horizontal movement speed of the player */
const MOVE_SPEED =  10.2;

/** Maximum movement speed on ice */
const ICE_MAX_SPEED = 8;

//-----------------------------------------------------------------------------
// PHYSICS CONSTANTS
//-----------------------------------------------------------------------------

/** Default friction applied to horizontal movement */
const DEFAULT_FRICTION = 0.8;

/** Friction applied on ice tiles (higher = more slippery) */
const ICE_FRICTION = 0.9;

/** Multiplier to jump force when bouncing */
const BOUNCE_MULTIPLIER = 1.5;

/** Acceleration multiplier when on ice */
const ICE_ACCELERATION_MULTIPLIER = 1.1;

//-----------------------------------------------------------------------------
// TILE TYPES
//-----------------------------------------------------------------------------

/**
 * Definitions for all tile types in the game
 * Properties:
 * - color: The CSS color of the tile
 * - solid: Whether the player collides with the tile
 * - deadly: Whether the tile kills the player on contact
 * - ice: Whether the tile has slippery physics
 * - bounce: Whether the tile causes the player to bounce
 * - goal: Whether the tile triggers level completion
 * - name: Display name of the tile
 */
const TILE_TYPES = {
    0: null, // Empty space
    1: { color: '#4c6baf', solid: true, name: 'Platform' }, // Standard platform
    2: { color: '#d03535', solid: false, deadly: true, name: 'Spike (Up)' }, // Spike pointing up
    3: { color: '#41a547', solid: true, name: 'Goal', goal: true }, // Goal platform - added goal property
    4: { color: '#8b4513', solid: true, name: 'Dirt' }, // Dirt
    5: { color: '#a58d5d', solid: true, name: 'Wood' }, // Wood
    6: { color: '#808080', solid: true, name: 'Stone' }, // Stone
    7: { color: '#6d8ad0', solid: true, ice: true, name: 'Ice' }, // Ice (slippery)
    8: { color: '#555555', solid: true, bounce: true, name: 'Bounce' }, // Bouncy
    // New spike types with different rotations
    10: { color: '#d03535', solid: false, deadly: true, name: 'Spike (Up)', rotation: 0 },    // Triangle pointing up
    11: { color: '#d03535', solid: false, deadly: true, name: 'Spike (Right)', rotation: 90 }, // Triangle pointing right
    12: { color: '#d03535', solid: false, deadly: true, name: 'Spike (Down)', rotation: 180 }, // Triangle pointing down
    13: { color: '#d03535', solid: false, deadly: true, name: 'Spike (Left)', rotation: 270 }  // Triangle pointing left
};

//-----------------------------------------------------------------------------
// GAME STATES
//-----------------------------------------------------------------------------

/**
 * All possible game states
 * Used to control UI display and game logic
 */
const GameStates = {
    /** Main menu screen */
    MENU: 'menu',

    /** Level selection screen */
    LEVEL_SELECT: 'levelSelect',

    /** Active gameplay state */
    PLAYING: 'playing',

    /** Game is paused */
    PAUSED: 'paused',

    /** Game over screen */
    GAME_OVER: 'gameOver',

    /** Level complete screen */
    LEVEL_COMPLETE: 'levelComplete',

    /** Settings menu */
    SETTINGS: 'settings'
};

//-----------------------------------------------------------------------------
// STORAGE KEYS
//-----------------------------------------------------------------------------

/**
 * Keys used for localStorage data
 * Used to save and load game data
 */
const STORAGE_KEYS = {
    /** Saved level layouts */
    LEVELS: 'platformerLevels',

    /** Saved level names */
    LEVEL_NAMES: 'platformerLevelNames',

    /** Game progress (unlocked levels) */
    PROGRESS: 'platformerProgress',

    /** Game settings */
    SETTINGS: 'platformerSettings',

    /** Player starting positions for each level */
    START_POSITIONS: 'platformerStartPositions'
};

//-----------------------------------------------------------------------------
// DEFAULT SETTINGS
//-----------------------------------------------------------------------------

/**
 * Default game settings
 * Applied when no saved settings exist
 */
const DEFAULT_SETTINGS = {
    /** Background music volume (0-100) */
    musicVolume: 50,

    /** Sound effects volume (0-100) */
    sfxVolume: 70,

    /** Whether to show FPS counter */
    showFPS: true,

    /** Whether to use pixel-perfect rendering */
    pixelPerfect: true
};

//-----------------------------------------------------------------------------
// PARTICLE EFFECTS
//-----------------------------------------------------------------------------

/**
 * Definitions for all particle effect types
 * Properties:
 * - count: Number of particles to generate
 * - color: CSS color of the particles
 * - size: Range of particle sizes [min, max]
 * - speed: Base movement speed
 * - gravity: Downward acceleration
 * - lifetime: Range of particle lifetimes in frames [min, max]
 */
const PARTICLE_TYPES = {
    /** Particles when player jumps */
    JUMP: {
        count: 5,
        color: '#ffffff',
        size: [2, 4],
        speed: 2,
        gravity: 0.1,
        lifetime: [20, 40]
    },

    /** Particles when player dies */
    DEATH: {
        count: 30,
        color: '#ff5555',
        size: [3, 6],
        speed: 3,
        gravity: 0.2,
        lifetime: [30, 60]
    },

    /** Particles when player bounces */
    BOUNCE: {
        count: 10,
        color: '#aaaaff',
        size: [2, 5],
        speed: 3,
        gravity: 0.1,
        lifetime: [20, 40]
    },

    /** Particles when player lands */
    LAND: {
        count: 3,
        color: '#cccccc',
        size: [2, 4],
        speed: 1,
        gravity: 0.1,
        lifetime: [10, 30]
    },

    /** Particles when player reaches goal */
    GOAL: {
        count: 30,
        color: '#ffff00', // Bright yellow
        size: [3, 8],
        speed: 4,
        gravity: 0.05,
        lifetime: [40, 80]
    },

    /** Particles when player slides on ice */
    ICE_SLIDE: {
        count: 2,
        color: '#b0e0ff', // Light blue
        size: [1, 3],
        speed: 1,
        gravity: 0.05,
        lifetime: [10, 20]
    }
};