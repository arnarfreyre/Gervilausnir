/**
 * Level Editor
 * This file contains all the level editor functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Editor state
    let currentTileType = 0;
    let currentLevel = 0;
    let levels = [];
    let levelNames = [];
    let isDragging = false;
    let playerStartX = null;
    let playerStartY = null;
    let isPlacingPlayerStart = false;
    let currentSpikeRotation = 0; // 0, 90, 180, or 270 degrees
    let rotationData = []; // Will store rotation data for spikes
    let autoSaveTimeout = null;

    // Expose levels to window for testing and for copy level functionality
    window.levels = levels;
    window.currentLevel = currentLevel;

    // DOM elements
    const elements = {
        tileGrid: document.getElementById('tile-grid'),
        levelGrid: document.getElementById('level-grid'),
        tileInfo: document.getElementById('tile-info'),
        levelSelect: document.getElementById('level-select'),
        levelNameInput: document.getElementById('level-name'),
        previewCanvas: document.getElementById('previewCanvas'),
        previewCtx: document.getElementById('previewCanvas').getContext('2d')
    };

    // Button elements
    const buttons = {
        save: document.getElementById('save-btn'),
        clear: document.getElementById('clear-btn'),
        newLevel: document.getElementById('new-level-btn'),
        rename: document.getElementById('rename-btn'),
        play: document.getElementById('play-btn'),
        backToGame: document.getElementById('back-to-game-btn'),
        copyLevel: document.getElementById('copy-level-matrix-btn')
    };

    // Initialize the editor
    function initEditor() {
        createTilePalette();
        createGrid();
        createSpikeRotationControls();
        loadLevels();
        updateLevelSelector();
        updateLevelOrderControls();
        setupEventListeners();
        setupKeyboardShortcuts();
        addCopyLevelButton();
        setInterval(renderPreview, 1000 / 30); // Update preview at 30fps
    }

    // Add copy level matrix button
    function addCopyLevelButton() {
        const controlsContainer = document.querySelector('.controls div:first-child');
        if (!controlsContainer) return;

        // Create the button if it doesn't exist yet
        if (!document.getElementById('copy-level-matrix-btn')) {
            const copyLevelBtn = document.createElement('button');
            copyLevelBtn.id = 'copy-level-matrix-btn';
            copyLevelBtn.textContent = 'Copy Level Matrix';
            copyLevelBtn.title = 'Copy just the current level matrix to your clipboard';

            // Insert the button after the Save button
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                controlsContainer.insertBefore(copyLevelBtn, saveBtn.nextSibling);
            } else {
                controlsContainer.appendChild(copyLevelBtn);
            }

            // Add event listener
            copyLevelBtn.addEventListener('click', copyLevelMatrix);
        }
    }

    // Copy level matrix to clipboard
    function copyLevelMatrix() {
        // Get the current level data
        const currentLevelData = levels[currentLevel];

        if (!currentLevelData) {
            showNotification('No level data available', 3000);
            return;
        }

        // Format the level data as a clean JavaScript array with proper indentation
        let formattedLevel = '[\n';

        for (let y = 0; y < currentLevelData.length; y++) {
            formattedLevel += '    [' + currentLevelData[y].join(',') + '],\n';
        }

        formattedLevel += ']';

        // Create a temporary textarea to copy the text
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = formattedLevel;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();

        try {
            // Copy the text to clipboard
            document.execCommand('copy');
            showNotification('Level matrix copied to clipboard!', 3000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy level matrix', 3000);
        } finally {
            document.body.removeChild(tempTextArea);
        }
    }

    // Show notification
    function showNotification(message, duration = 3000) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.level-editor-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'level-editor-notification';
        notification.textContent = message;

        // Style the notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.backgroundColor = '#4c6baf';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '9999';
        notification.style.transition = 'opacity 0.3s ease';

        // Add to document
        document.body.appendChild(notification);

        // Remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    // Create the tile palette with all tile types
    function createTilePalette() {
        // Create regular tile options
        for (let tileId in TILE_TYPES) {
            // Skip deprecated regular spike (we'll use the directional ones instead)
            if (tileId === '2') continue;

            createTileOption(tileId, TILE_TYPES[tileId]);
        }

        // Add player start position option
        createPlayerStartOption();
    }

    // Create a single tile option
    function createTileOption(tileId, tileType) {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile-option';
        tileElement.dataset.tileId = tileId;

        // Set appearance based on tile type
        if (tileId === '0') {
            // Empty tile
            tileElement.style.backgroundColor = '#333';
            tileElement.textContent = '0';
            tileElement.style.textAlign = 'center';
            tileElement.style.lineHeight = '32px';
            tileElement.classList.add('selected'); // Select by default
        } else if (tileId >= 10 && tileId <= 13) {
            // Directional spike tiles
            tileElement.classList.add('spike');
            tileElement.style.backgroundColor = tileType.color;
            // Apply rotation based on spike type
            tileElement.style.transform = `rotate(${tileType.rotation}deg)`;
            // Add tooltip to show direction
            tileElement.title = tileType.name;
        } else {
            // Regular tile
            tileElement.style.backgroundColor = tileType.color;
        }

        // Add click handler
        tileElement.addEventListener('click', () => {
            // Deselect all tiles
            document.querySelectorAll('.tile-option').forEach(tile => {
                tile.classList.remove('selected');
            });

            // Select this tile
            tileElement.classList.add('selected');
            currentTileType = parseInt(tileId);
            isPlacingPlayerStart = false;

            // Show/hide rotation controls based on tile type
            const rotationControls = document.querySelector('.rotation-controls');
            if (rotationControls) {
                rotationControls.style.display = currentTileType === 2 ? 'block' : 'none';
            }

            // Update info display
            updateTileInfo(tileType?.name || 'Empty', tileId);
        });

        elements.tileGrid.appendChild(tileElement);
    }

    // Create the player start position option
    function createPlayerStartOption() {
        const playerStartOption = document.createElement('div');
        playerStartOption.className = 'tile-option';
        playerStartOption.dataset.tileId = 'player-start';
        playerStartOption.style.backgroundColor = '#FFA500'; // Orange
        playerStartOption.style.display = 'flex';
        playerStartOption.style.justifyContent = 'center';
        playerStartOption.style.alignItems = 'center';
        playerStartOption.innerHTML = '<span style="color: black; font-weight: bold;">P</span>';
        playerStartOption.title = 'Player Start Position';

        playerStartOption.addEventListener('click', () => {
            document.querySelectorAll('.tile-option').forEach(tile => {
                tile.classList.remove('selected');
            });
            playerStartOption.classList.add('selected');
            isPlacingPlayerStart = true;
            currentTileType = -1; // Special value for player start

            // Hide rotation controls
            const rotationControls = document.querySelector('.rotation-controls');
            if (rotationControls) {
                rotationControls.style.display = 'none';
            }

            elements.tileInfo.textContent = `Selected: Player Start Position`;
        });

        elements.tileGrid.appendChild(playerStartOption);
    }

    // Create rotation controls for spike tiles
    function createSpikeRotationControls() {
        const rotationControls = document.createElement('div');
        rotationControls.className = 'rotation-controls';
        rotationControls.innerHTML = `
            <h3>Spike Rotation</h3>
            <div class="rotation-buttons">
                <button id="rotate-spike-0" class="rotate-button active" data-rotation="0">0°</button>
                <button id="rotate-spike-90" class="rotate-button" data-rotation="90">90°</button>
                <button id="rotate-spike-180" class="rotate-button" data-rotation="180">180°</button>
                <button id="rotate-spike-270" class="rotate-button" data-rotation="270">270°</button>
            </div>
        `;

        const tilePalette = document.querySelector('.tile-palette');
        tilePalette.appendChild(rotationControls);

        // Add event listeners for rotation buttons
        rotationControls.querySelectorAll('.rotate-button').forEach(button => {
            button.addEventListener('click', () => {
                // Only allow rotation when spike is selected
                if (currentTileType === 2) {
                    currentSpikeRotation = parseInt(button.dataset.rotation);

                    // Update active button
                    rotationControls.querySelectorAll('.rotate-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');

                    // Update tile info display
                    elements.tileInfo.textContent = `Selected: Spike (${currentSpikeRotation}°)`;
                }
            });
        });

        // Hide rotation controls initially
        rotationControls.style.display = 'none';
    }

    // Update tile info display
    function updateTileInfo(name, id) {
        let infoText = `Selected: ${name} (${id})`;
        if (currentTileType === 2) {
            infoText += ` (${currentSpikeRotation}°)`;
        }
        elements.tileInfo.textContent = infoText;
    }

    // Create the editing grid
    function createGrid() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                // Add event listeners
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    isDragging = true;
                    updateCell(cell);
                });

                cell.addEventListener('mouseover', () => {
                    if (isDragging) {
                        updateCell(cell);
                    }
                });

                cell.addEventListener('mouseup', (e) => {
                    isDragging = false;
                    e.stopPropagation();
                });

                elements.levelGrid.appendChild(cell);
            }
        }

        // Add mouseup event to document to stop dragging
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // Initialize rotation data for tiles
    function initializeRotationData() {
        // Check if rotation data already exists in localStorage
        const savedRotations = localStorage.getItem('platformerSpikeRotations');

        if (savedRotations) {
            rotationData = JSON.parse(savedRotations);
        } else {
            // Create a new array for each level
            rotationData = [];
            for (let i = 0; i < levels.length; i++) {
                rotationData.push(createEmptyRotationData());
            }
        }
    }

    // Create empty rotation data for a level
    function createEmptyRotationData() {
        const levelRotations = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                row.push(0); // Default rotation is 0 degrees
            }
            levelRotations.push(row);
        }
        return levelRotations;
    }

    // Update a cell with the selected tile
    function updateCell(cell) {
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        if (isPlacingPlayerStart) {
            handlePlayerStartPlacement(cell, x, y);
            return;
        }

        // Regular tile placement
        levels[currentLevel][y][x] = currentTileType;

        // Store rotation data for spikes
        if (currentTileType === 2) {
            rotationData[currentLevel][y][x] = currentSpikeRotation;
        }

        updateCellAppearance(cell, currentTileType, currentTileType === 2 ? currentSpikeRotation : 0);

        // Auto-save the changes
        triggerAutoSave();
    }

    // Handle player start position placement
    function handlePlayerStartPlacement(cell, x, y) {
        // Clear any previous player start marker
        if (playerStartX !== null && playerStartY !== null) {
            const prevCell = document.querySelector(`.grid-cell[data-x="${playerStartX}"][data-y="${playerStartY}"]`);
            if (prevCell) {
                prevCell.classList.remove('player-start-position');
            }
        }

        // Set the new player start position
        playerStartX = x;
        playerStartY = y;
        cell.classList.add('player-start-position');
        isPlacingPlayerStart = false;

        // Reselect the empty tile type
        const defaultTile = document.querySelector('.tile-option[data-tile-id="0"]');
        if (defaultTile) {
            defaultTile.click();
        }

        // Auto-save the changes
        triggerAutoSave();
    }

    // Update cell appearance based on tile type
    function updateCellAppearance(cell, tileType, rotation = 0) {
        // Reset any special styles
        cell.classList.remove('spike');
        cell.style.transform = '';
        cell.innerHTML = '';

        if (tileType === 0) {
            // Empty cell
            cell.style.backgroundColor = '#333';
        } else if (tileType === 2 || (tileType >= 10 && tileType <= 13)) {
            // Spike tile with rotation
            cell.classList.add('spike');
            cell.style.backgroundColor = TILE_TYPES[tileType].color;

            // Get the rotation for the spike
            let spikeRotation = rotation;
            if (tileType >= 10 && tileType <= 13) {
                spikeRotation = TILE_TYPES[tileType].rotation;
            }

            cell.style.transform = `rotate(${spikeRotation}deg)`;
        } else if (tileType === 3) {
            // Goal tile - add a small circle
            cell.style.backgroundColor = TILE_TYPES[tileType].color;
            cell.style.position = 'relative';
            cell.innerHTML = '<div style="position: absolute; top: 8px; left: 8px; width: 16px; height: 16px; background-color: #ffff00; border-radius: 50%;"></div>';
        } else {
            // Regular tile
            cell.style.backgroundColor = TILE_TYPES[tileType]?.color || '#333';
        }
    }

    // Load levels from localStorage or initialize defaults
    function loadLevels() {
        const savedLevels = localStorage.getItem(STORAGE_KEYS.LEVELS);
        const savedNames = localStorage.getItem(STORAGE_KEYS.LEVEL_NAMES);

        if (savedLevels && savedNames) {
            levels = JSON.parse(savedLevels);
            levelNames = JSON.parse(savedNames);
        } else {
            // Create a default empty level if none exist
            levels = [createEmptyLevel()];
            levelNames = ["Level 1"];
        }

        // Make sure we have names for all levels
        while (levelNames.length < levels.length) {
            levelNames.push(`Level ${levelNames.length + 1}`);
        }

        // Initialize rotation data
        initializeRotationData();

        displayLevel(0);
    }

    // Create an empty level grid
    function createEmptyLevel() {
        const level = [];

        for (let y = 0; y < GRID_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                // Add a ground platform at the bottom
                row.push(y === GRID_HEIGHT - 1 ? 1 : 0);
            }
            level.push(row);
        }

        return level;
    }

    // Display a level in the grid
    function displayLevel(levelIndex) {
        currentLevel = levelIndex;
        // Update window.currentLevel to ensure copy level functionality works
        window.currentLevel = levelIndex;

        const level = levels[levelIndex];

        // Update level name input
        elements.levelNameInput.value = levelNames[levelIndex];

        // Ensure rotation data exists for this level
        while (rotationData.length <= levelIndex) {
            rotationData.push(createEmptyRotationData());
        }

        // Update the grid cells
        const cells = document.querySelectorAll('.grid-cell');
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const index = y * GRID_WIDTH + x;
                const cell = cells[index];
                const tileType = level[y][x];

                // Get rotation for spike tiles
                const rotation = tileType === 2 ? rotationData[currentLevel][y][x] : 0;

                updateCellAppearance(cell, tileType, rotation);

                // Remove player start marker from all cells
                cell.classList.remove('player-start-position');
            }
        }

        // Reset player start position
        playerStartX = null;
        playerStartY = null;

        // Load player start position if it exists
        loadPlayerStartPosition(levelIndex);
    }

    // Load player start position for a level
    function loadPlayerStartPosition(levelIndex) {
        const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
        if (startPositions) {
            const positions = JSON.parse(startPositions);
            if (positions && positions[levelIndex] && positions[levelIndex] !== null) {
                playerStartX = positions[levelIndex].x;
                playerStartY = positions[levelIndex].y;

                // Add player start marker to the appropriate cell
                const playerStartCell = document.querySelector(`.grid-cell[data-x="${playerStartX}"][data-y="${playerStartY}"]`);
                if (playerStartCell) {
                    playerStartCell.classList.add('player-start-position');
                }
            }
        }
    }

    // Update the level selector dropdown
    function updateLevelSelector() {
        elements.levelSelect.innerHTML = '';

        for (let i = 0; i < levels.length; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = levelNames[i];
            elements.levelSelect.appendChild(option);
        }

        elements.levelSelect.value = currentLevel;
    }

    // Update level order controls
    function updateLevelOrderControls() {
        const controlsContainer = document.getElementById('level-order-controls');
        if (!controlsContainer) return;

        controlsContainer.innerHTML = '';

        // Display info about current level position
        const positionInfo = document.createElement('div');
        positionInfo.className = 'level-position-info';
        positionInfo.textContent = `Level ${currentLevel + 1} of ${levels.length}`;
        controlsContainer.appendChild(positionInfo);

        // Create move up button
        const moveUpBtn = document.createElement('button');
        moveUpBtn.id = 'move-up-btn';
        moveUpBtn.innerHTML = '↑';
        moveUpBtn.title = 'Move level up in order';
        moveUpBtn.disabled = currentLevel <= 0;
        moveUpBtn.addEventListener('click', () => moveLevelUp(currentLevel));
        controlsContainer.appendChild(moveUpBtn);

        // Create move down button
        const moveDownBtn = document.createElement('button');
        moveDownBtn.id = 'move-down-btn';
        moveDownBtn.innerHTML = '↓';
        moveDownBtn.title = 'Move level down in order';
        moveDownBtn.disabled = currentLevel >= levels.length - 1;
        moveDownBtn.addEventListener('click', () => moveLevelDown(currentLevel));
        controlsContainer.appendChild(moveDownBtn);

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'delete-level-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete this level';
        deleteBtn.addEventListener('click', () => deleteLevel(currentLevel));
        controlsContainer.appendChild(deleteBtn);
    }

    // Save levels to localStorage
    function saveLevels(showAlert = true) {
        // Save levels, names, and rotations
        localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(levels));
        localStorage.setItem(STORAGE_KEYS.LEVEL_NAMES, JSON.stringify(levelNames));
        localStorage.setItem('platformerSpikeRotations', JSON.stringify(rotationData));

        // Save player start positions
        savePlayerStartPositions();

        if (showAlert) {
            showNotification('Level saved successfully!', 3000);
        }
    }

    // Delete a level
    function deleteLevel(levelIndex) {
        if (levels.length <= 1) {
            alert('Cannot delete the last level!');
            return;
        }

        if (confirm(`Are you sure you want to delete level "${levelNames[levelIndex]}"?`)) {
            // Remove the level data
            levels.splice(levelIndex, 1);
            levelNames.splice(levelIndex, 1);

            // Remove rotation data if it exists
            if (rotationData[levelIndex]) {
                rotationData.splice(levelIndex, 1);
            }

            // Adjust player start positions
            const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
            if (startPositions) {
                const positions = JSON.parse(startPositions);
                if (positions) {
                    positions.splice(levelIndex, 1);
                    localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(positions));
                }
            }

            // Adjust current level index if needed
            if (currentLevel >= levels.length) {
                currentLevel = levels.length - 1;
                window.currentLevel = currentLevel; // Update window reference
            }

            // Save changes
            saveLevels(false);

            // Update UI
            updateLevelSelector();
            displayLevel(currentLevel);
        }
    }

    // Save player start positions
    function savePlayerStartPositions() {
        let positions = Array(levels.length).fill(null);

        // Update the current level's start position
        if (playerStartX !== null && playerStartY !== null) {
            positions[currentLevel] = { x: playerStartX, y: playerStartY };
        }

        // Get existing positions from other levels
        const existingPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
        if (existingPositions) {
            const parsedPositions = JSON.parse(existingPositions);
            // Copy existing positions for levels that don't have a new position set
            for (let i = 0; i < parsedPositions.length; i++) {
                if (i !== currentLevel && i < positions.length && parsedPositions[i] !== null) {
                    positions[i] = parsedPositions[i];
                }
            }
        }

        // Save positions to localStorage
        localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(positions));
    }

    // Trigger auto-save with debounce
    function triggerAutoSave() {
        // Clear previous timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }

        // Set a new timeout to save after 500ms of inactivity
        autoSaveTimeout = setTimeout(() => {
            saveLevels(false); // Save without alert
            renderPreview(); // Update the preview
        }, 500);
    }

    // Add a new level
    function addNewLevel() {
        levels.push(createEmptyLevel());
        levelNames.push(`Level ${levels.length}`);
        rotationData.push(createEmptyRotationData());
        saveLevels(false);
        updateLevelSelector();
        displayLevel(levels.length - 1);
    }

    // Clear the current level
    function clearLevel() {
        if (confirm('Are you sure you want to clear this level?')) {
            levels[currentLevel] = createEmptyLevel();
            rotationData[currentLevel] = createEmptyRotationData();
            playerStartX = null;
            playerStartY = null;
            saveLevels(false);
            displayLevel(currentLevel);
        }
    }

    // Move a level up in the level order
    function moveLevelUp(levelIndex) {
        if (levelIndex <= 0 || levelIndex >= levels.length) return;

        // Swap levels
        [levels[levelIndex], levels[levelIndex - 1]] = [levels[levelIndex - 1], levels[levelIndex]];
        [levelNames[levelIndex], levelNames[levelIndex - 1]] = [levelNames[levelIndex - 1], levelNames[levelIndex]];

        // Swap rotation data if it exists
        if (rotationData[levelIndex] && rotationData[levelIndex - 1]) {
            [rotationData[levelIndex], rotationData[levelIndex - 1]] = [rotationData[levelIndex - 1], rotationData[levelIndex]];
        }

        // Swap player start positions
        const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
        if (startPositions) {
            const positions = JSON.parse(startPositions);
            if (positions && positions[levelIndex] !== undefined && positions[levelIndex - 1] !== undefined) {
                [positions[levelIndex], positions[levelIndex - 1]] = [positions[levelIndex - 1], positions[levelIndex]];
                localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(positions));
            }
        }

        // Save changes
        saveLevels(false);

        // Update the current level index
        currentLevel = levelIndex - 1;
        window.currentLevel = currentLevel; // Update window reference

        // Update UI
        updateLevelSelector();
        displayLevel(currentLevel);
    }

    // Move a level down in the level order
    function moveLevelDown(levelIndex) {
        if (levelIndex < 0 || levelIndex >= levels.length - 1) return;

        // Swap levels
        [levels[levelIndex], levels[levelIndex + 1]] = [levels[levelIndex + 1], levels[levelIndex]];
        [levelNames[levelIndex], levelNames[levelIndex + 1]] = [levelNames[levelIndex + 1], levelNames[levelIndex]];

        // Swap rotation data if it exists
        if (rotationData[levelIndex] && rotationData[levelIndex + 1]) {
            [rotationData[levelIndex], rotationData[levelIndex + 1]] = [rotationData[levelIndex + 1], rotationData[levelIndex]];
        }

        // Swap player start positions
        const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
        if (startPositions) {
            const positions = JSON.parse(startPositions);
            if (positions && positions[levelIndex] !== undefined && positions[levelIndex + 1] !== undefined) {
                [positions[levelIndex], positions[levelIndex + 1]] = [positions[levelIndex + 1], positions[levelIndex]];
                localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(positions));
            }
        }

        // Save changes
        saveLevels(false);

        // Update the current level index
        currentLevel = levelIndex + 1;
        window.currentLevel = currentLevel; // Update window reference

        // Update UI
        updateLevelSelector();
        displayLevel(currentLevel);
    }

    // Render the live preview
    function renderPreview() {
        const ctx = elements.previewCtx;
        const canvas = elements.previewCanvas;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        ctx.fillStyle = '#000022';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add stars to background
        drawBackgroundStars(ctx, canvas.width, canvas.height);

        // Calculate scale
        const scale = canvas.width / (GRID_WIDTH * TILE_SIZE);
        const scaledTileSize = TILE_SIZE * scale;

        // Draw level tiles
        drawLevelTiles(ctx, levels[currentLevel], scale, scaledTileSize);

        // Draw player start position if defined
        if (playerStartX !== null && playerStartY !== null) {
            drawPlayerPreview(ctx, playerStartX, playerStartY, scale, scaledTileSize);
        }
    }

    // Draw stars in the background
    function drawBackgroundStars(ctx, width, height) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            ctx.fillRect(x, y, size, size);
        }
    }

    // Draw all tiles in the level
    // Draw all tiles in the level
    function drawLevelTiles(ctx, level, scale, scaledTileSize) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const tileType = level[y][x];

                if (tileType !== 0) {
                    const tileInfo = TILE_TYPES[tileType];
                    if (!tileInfo) continue;

                    if (tileType === 2 || (tileType >= 10 && tileType <= 13)) { // All spike types
                        drawSpikePreview(ctx, x, y, scale, scaledTileSize, tileInfo.color, tileType);
                    } else {
                        // Draw regular tile
                        ctx.fillStyle = tileInfo.color;
                        ctx.fillRect(x * scaledTileSize, y * scaledTileSize, scaledTileSize, scaledTileSize);

                        // Add details for goal tiles
                        if (tileType === 3) { // Goal
                            drawGoalCircle(ctx, x, y, scale, scaledTileSize);
                        }
                    }
                }
            }
        }
    }

    // Draw a spike in the preview
    function drawSpikePreview(ctx, x, y, scale, scaledTileSize, color, tileId) {
        // Save the current context state
        ctx.save();

        // Translate to the center of the spike
        ctx.translate(x * scaledTileSize + scaledTileSize / 2, y * scaledTileSize + scaledTileSize / 2);

        // Get rotation based on spike type
        let rotation = 0;
        if (tileId >= 10 && tileId <= 13) {
            rotation = TILE_TYPES[tileId].rotation;
        } else if (rotationData[currentLevel] && rotationData[currentLevel][y] && rotationData[currentLevel][y][x] !== undefined) {
            rotation = rotationData[currentLevel][y][x];
        }

        // Rotate
        ctx.rotate(rotation * Math.PI / 180);

        // Draw the spike triangle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -scaledTileSize / 2);
        ctx.lineTo(scaledTileSize / 2, scaledTileSize / 2);
        ctx.lineTo(-scaledTileSize / 2, scaledTileSize / 2);
        ctx.closePath();
        ctx.fill();

        // Add spike highlight
        ctx.fillStyle = '#ff5555';
        ctx.beginPath();
        ctx.moveTo(0, -scaledTileSize / 2 + 3 * scale);
        ctx.lineTo(scaledTileSize / 2 - 3 * scale, scaledTileSize / 2 - 3 * scale);
        ctx.lineTo(-scaledTileSize / 2 + 3 * scale, scaledTileSize / 2 - 3 * scale);
        ctx.closePath();
        ctx.fill();

        // Restore the context
        ctx.restore();
    }

    // Draw the goal circle in the preview
    function drawGoalCircle(ctx, x, y, scale, scaledTileSize) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(
            x * scaledTileSize + scaledTileSize / 2,
            y * scaledTileSize + scaledTileSize / 2,
            scaledTileSize * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // Draw the player in the preview
    function drawPlayerPreview(ctx, x, y, scale, scaledTileSize) {
        ctx.fillStyle = '#4c6baf';
        ctx.fillRect(
            x * scaledTileSize,
            y * scaledTileSize,
            PLAYER_WIDTH * scale,
            PLAYER_HEIGHT * scale
        );

        // Add eyes for visual appeal
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            x * scaledTileSize + 5 * scale,
            y * scaledTileSize + 8 * scale,
            4 * scale,
            4 * scale
        );
        ctx.fillRect(
            x * scaledTileSize + 15 * scale,
            y * scaledTileSize + 8 * scale,
            4 * scale,
            4 * scale
        );
    }

    // Set up keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Save level with Ctrl+S
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveLevels();
            }

            // Test play with F5
            if (e.key === 'F5') {
                e.preventDefault();
                testPlayLevel();
            }
        });
    }

    // Rename the current level
    function renameLevel() {
        const name = elements.levelNameInput.value.trim();
        if (name) {
            levelNames[currentLevel] = name;
            saveLevels(false); // Save without alert
            updateLevelSelector();
        }
    }

    // Test play the current level
    function testPlayLevel() {
        // Save the level first
        saveLevels(false); // Save without alert

        // Set test level and open game in new tab
        localStorage.setItem('testPlayLevel', currentLevel);
        window.open('index.html?testLevel=' + currentLevel, '_blank');
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Level selector change
        elements.levelSelect.addEventListener('change', () => {
            displayLevel(parseInt(elements.levelSelect.value));
        });

        // Button events
        buttons.save.addEventListener('click', () => saveLevels());
        buttons.clear.addEventListener('click', clearLevel);
        buttons.newLevel.addEventListener('click', addNewLevel);
        buttons.rename.addEventListener('click', renameLevel);
        buttons.backToGame.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        buttons.play.addEventListener('click', testPlayLevel);

        // Remove export and import buttons if they exist (as specified)
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.style.display = 'none';
        }

        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.style.display = 'none';
        }

        // Add keyboard shortcuts for level reordering
        document.addEventListener('keydown', (e) => {
            // Move level up with Alt+Up
            if (e.altKey && e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentLevel > 0) {
                    moveLevelUp(currentLevel);
                }
            }

            // Move level down with Alt+Down
            if (e.altKey && e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentLevel < levels.length - 1) {
                    moveLevelDown(currentLevel);
                }
            }
        });
    }

    // Make copyLevelMatrix available to window for external access
    window.copyLevelMatrix = copyLevelMatrix;

    // Initialize the editor
    initEditor();

    window.saveLevels = saveLevels;
    window.copyLevelMatrix = copyLevelMatrix;
    window.levels = levels;
    window.levelNames = levelNames;
    window.currentLevel = currentLevel;
    window.playerStartX = playerStartX;
    window.playerStartY = playerStartY;
    window.rotationData = rotationData;

    // Also export other functions that might be needed
    window.showNotification = showNotification;
    window.updateLevelSelector = updateLevelSelector;
    window.displayLevel = displayLevel;
});