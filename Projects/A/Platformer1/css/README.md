# Pixel Platformer Game

A fun, modular 2D platformer game with an integrated level editor.

## Features

- Smooth pixel-perfect platformer gameplay
- Integrated level editor with live preview
- Multiple tile types (platforms, spikes, ice, bounce pads, etc.)
- Main menu with level selection
- Game settings for music and sound effects
- Saving/loading levels using localStorage
- Modular code structure for easy extensibility

## Directory Structure

```
pixel-platformer/
│
├── index.html               # Main game HTML
├── level-editor.html        # Level editor HTML
│
├── css/
│   └── styles.css           # Main game styles
│
├── js/
│   ├── constants.js         # Game constants and settings
│   ├── levels.js            # Level management
│   ├── player.js            # Player physics and controls
│   ├── renderer.js          # Game rendering
│   ├── audio.js             # Audio management
│   ├── ui.js                # UI and menu management
│   └── game.js              # Main game logic
│
└── audio/                   # Game sound effects and music
    ├── background_music.mp3
    ├── jump.mp3
    ├── death.mp3
    └── level_complete.mp3
```

## Setup Instructions

1. Create the directory structure as shown above
2. Copy the provided code files into their respective locations
3. Add sound effects to the audio folder (or replace with your own)
4. Open `index.html` in a browser to play the game
5. Click the "Level Editor" button to open the level editor

## Level Editor Usage

- Select tile types from the palette on the left
- Click or drag on the grid to place tiles
- Use the level selector to switch between levels or create new ones
- All levels are automatically saved to localStorage
- Preview your level in real-time and test it directly in the game

## Game Controls

- Arrow keys to move
- Space or Up Arrow to jump
- Escape to pause the game

## Customization

- Add new tile types in `constants.js`
- Create custom levels in the level editor
- Modify game physics in `player.js`
- Add new features by extending the modular code

## Integration Notes

The level editor and main game are integrated through localStorage. When you create levels in the editor, they are automatically available in the main game. This makes it easy to iterate on level design and test your creations.