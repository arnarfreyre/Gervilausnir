/**
 * Enhanced Level Editor
 * This file adds enhanced functionality to the basic level editor
 */

/**
 * Initialize all enhanced level editor features
 */
function initEnhancedLevelEditor() {
    console.log("Initializing enhanced level editor features...");

    // Add keyboard shortcuts information
    addKeyboardShortcutsInfo();

    // Add export/import functionality
    addExportImportFeatures();

    // Add pixel perfect toggle
    addPixelPerfectToggle();

    // Add save notification
    setupSaveNotification();

    // Add level order enhancements
    addLevelOrderEnhancements();

    // Add default level export features
    initDefaultLevelExportFeatures();

    // Add the level matrix copy functionality
    addCopyLevelMatrixButton();
}

/**
 * Add keyboard shortcuts info button
 */
function addKeyboardShortcutsInfo() {
    const headerElement = document.querySelector('.header');
    if (!headerElement) return;

    // Create keyboard info button if it doesn't exist
    if (!document.getElementById('keyboard-shortcuts-info')) {
        const keyboardInfo = document.createElement('div');
        keyboardInfo.id = 'keyboard-shortcuts-info';
        keyboardInfo.className = 'tooltip';
        keyboardInfo.innerHTML = `
            <button>⌨️</button>
            <span class="tooltiptext">
                <b>Keyboard Shortcuts:</b><br>
                <b>Ctrl+S</b> - Save Level<br>
                <b>Alt+Up/Down</b> - Reorder Level<br>
                <b>F5</b> - Test Play<br>
                <b>1-9</b> - Select Tile Type<br>
                <b>0</b> - Select Empty Tile<br>
                <b>P</b> - Place Player Start<br>
                <b>Delete</b> - Clear Selected Cell
            </span>
        `;

        // Add button to header
        headerElement.appendChild(keyboardInfo);

        // Style the button
        const infoButton = keyboardInfo.querySelector('button');
        infoButton.style.backgroundColor = '#444';
        infoButton.style.color = 'white';
        infoButton.style.borderRadius = '5px';
        infoButton.style.padding = '3px 8px';
        infoButton.style.marginLeft = '10px';
        infoButton.style.border = 'none';
        infoButton.style.cursor = 'pointer';
    }
}

/**
 * Add export and import functionality
 */
function addExportImportFeatures() {
    // Get modal elements
    const exportModal = document.getElementById('export-modal');
    const importModal = document.getElementById('import-modal');
    const exportClose = document.getElementById('export-close');
    const importClose = document.getElementById('import-close');
    const exportText = document.getElementById('export-text');
    const importText = document.getElementById('import-text');
    const copyExportBtn = document.getElementById('copy-export');
    const importConfirmBtn = document.getElementById('import-confirm');

    // Get export/import buttons
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');

    if (!exportModal || !importModal || !exportBtn || !importBtn) return;

    // Setup export button
    exportBtn.addEventListener('click', () => {
        // Create export data
        const exportData = createExportData();

        // Display export data
        if (exportText) {
            exportText.value = JSON.stringify(exportData, null, 2);
        }

        // Add title to modal
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Export Levels';
        exportModal.querySelector('.modal-content').insertBefore(
            modalTitle,
            exportModal.querySelector('.modal-content').firstChild.nextSibling
        );

        // Show modal
        exportModal.style.display = 'flex';
    });

    // Setup import button
    importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
    });

    // Setup close buttons
    if (exportClose) {
        exportClose.addEventListener('click', () => {
            exportModal.style.display = 'none';
        });
    }

    if (importClose) {
        importClose.addEventListener('click', () => {
            importModal.style.display = 'none';
        });
    }

    // Copy export data button
    if (copyExportBtn && exportText) {
        copyExportBtn.addEventListener('click', () => {
            exportText.select();
            document.execCommand('copy');
            showNotification('Export data copied to clipboard!', 3000);
        });
    }

    // Import confirm button
    if (importConfirmBtn && importText) {
        importConfirmBtn.addEventListener('click', () => {
            try {
                const importData = JSON.parse(importText.value);
                importLevels(importData);
                importModal.style.display = 'none';
                showNotification('Levels imported successfully!', 3000);
            } catch (error) {
                console.error('Error importing levels:', error);
                showNotification('Error importing levels! Check JSON format.', 5000);
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === exportModal) {
            exportModal.style.display = 'none';
        }
        if (event.target === importModal) {
            importModal.style.display = 'none';
        }
    });
}

/**
 * Create export data object from current levels
 */
function createExportData() {
    const exportData = {
        levels: window.levels || [],
        levelNames: window.levelNames || [],
        metadata: {
            exportDate: new Date().toISOString(),
            editorVersion: '1.2.0',
            levelCount: (window.levels || []).length
        }
    };

    // Add player start positions if they exist
    const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
    if (startPositions) {
        exportData.playerStartPositions = JSON.parse(startPositions);
    }

    // Add spike rotations if they exist
    const rotations = localStorage.getItem('platformerSpikeRotations');
    if (rotations) {
        exportData.spikeRotations = JSON.parse(rotations);
    }

    return exportData;
}

/**
 * Import levels from export data
 */
function importLevels(importData) {
    if (!importData.levels || !Array.isArray(importData.levels)) {
        throw new Error('Invalid import data: Missing levels array');
    }

    // Save to window variables
    window.levels = importData.levels;
    window.levelNames = importData.levelNames || [];

    // Ensure we have names for all levels
    while (window.levelNames.length < window.levels.length) {
        window.levelNames.push(`Imported Level ${window.levelNames.length + 1}`);
    }

    // Save player start positions if provided
    if (importData.playerStartPositions) {
        localStorage.setItem(STORAGE_KEYS.START_POSITIONS,
            JSON.stringify(importData.playerStartPositions));
    }

    // Save spike rotations if provided
    if (importData.spikeRotations) {
        localStorage.setItem('platformerSpikeRotations',
            JSON.stringify(importData.spikeRotations));
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(window.levels));
    localStorage.setItem(STORAGE_KEYS.LEVEL_NAMES, JSON.stringify(window.levelNames));

    // Reset current level to 0
    window.currentLevel = 0;

    // Update UI to reflect the new levels
    updateLevelSelector();
    displayLevel(0);
}

/**
 * Add pixel perfect toggle for preview
 */
function addPixelPerfectToggle() {
    const previewControls = document.querySelector('.preview-controls');
    if (!previewControls) return;

    const pixelPerfectToggle = document.createElement('div');
    pixelPerfectToggle.className = 'pixel-perfect-toggle';
    pixelPerfectToggle.innerHTML = `
        <input type="checkbox" id="pixel-perfect-toggle" checked>
        <label for="pixel-perfect-toggle">Pixel Perfect</label>
    `;

    previewControls.appendChild(pixelPerfectToggle);

    // Add event listener
    const checkbox = document.getElementById('pixel-perfect-toggle');
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            const canvas = document.getElementById('previewCanvas');
            if (canvas) {
                canvas.style.imageRendering = checkbox.checked ? 'pixelated' : 'auto';
            }
        });
    }
}

/**
 * Setup save notification
 */
function setupSaveNotification() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn) return;

    // Save original click handler
    const originalClickHandler = saveBtn.onclick;

    // Replace with new handler that shows notification
    saveBtn.onclick = function(event) {
        // Call original handler if it exists
        if (originalClickHandler) {
            originalClickHandler.call(this, event);
        }

        // Show notification
        showNotification('Level saved successfully!', 3000);
    };
}

/**
 * Add level order enhancements
 */
function addLevelOrderEnhancements() {
    // Add ability to drag and drop levels in the order modal
    setupDragAndDropLevelReordering();
}

/**
 * Setup drag and drop level reordering
 */
function setupDragAndDropLevelReordering() {
    const reorderBtn = document.getElementById('reorder-levels-btn');
    const modal = document.getElementById('level-order-modal');
    const closeBtn = document.getElementById('level-order-close');
    const listContainer = document.getElementById('draggable-level-list');

    if (!reorderBtn || !modal || !closeBtn || !listContainer) return;

    // Show modal when clicking reorder button
    reorderBtn.addEventListener('click', () => {
        populateLevelList();
        modal.style.display = 'flex';
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    function populateLevelList() {
        listContainer.innerHTML = '';

        for (let i = 0; i < window.levelNames.length; i++) {
            const item = document.createElement('div');
            item.className = 'draggable-level-item';
            if (i === window.currentLevel) {
                item.classList.add('current-level');
            }
            item.draggable = true;
            item.dataset.index = i;
            item.innerHTML = `
                <span class="level-number">${i + 1}</span>
                <span class="level-name">${window.levelNames[i]}</span>
            `;

            // Add drag event listeners
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);

            listContainer.appendChild(item);
        }
    }

    let dragSrcEl = null;

    function handleDragStart(e) {
        this.classList.add('dragging');
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (dragSrcEl !== this) {
            // Get indices
            const fromIndex = parseInt(dragSrcEl.dataset.index);
            const toIndex = parseInt(this.dataset.index);

            // Reorder levels and names
            reorderLevels(fromIndex, toIndex);

            // Update the list
            populateLevelList();
        }

        return false;
    }

    function handleDragEnd(e) {
        // Remove all drag classes
        document.querySelectorAll('.draggable-level-item').forEach(item => {
            item.classList.remove('dragging');
            item.classList.remove('drag-over');
        });
    }

    function reorderLevels(fromIndex, toIndex) {
        // Move level
        const level = window.levels.splice(fromIndex, 1)[0];
        window.levels.splice(toIndex, 0, level);

        // Move name
        const name = window.levelNames.splice(fromIndex, 1)[0];
        window.levelNames.splice(toIndex, 0, name);

        // Move player start positions
        const startPositions = localStorage.getItem(STORAGE_KEYS.START_POSITIONS);
        if (startPositions) {
            const positions = JSON.parse(startPositions);
            if (positions && positions.length > 0) {
                const position = positions.splice(fromIndex, 1)[0];
                positions.splice(toIndex, 0, position);
                localStorage.setItem(STORAGE_KEYS.START_POSITIONS, JSON.stringify(positions));
            }
        }

        // Move spike rotations
        const rotations = localStorage.getItem('platformerSpikeRotations');
        if (rotations) {
            const rotationsData = JSON.parse(rotations);
            if (rotationsData && rotationsData.length > 0) {
                const rotation = rotationsData.splice(fromIndex, 1)[0];
                rotationsData.splice(toIndex, 0, rotation);
                localStorage.setItem('platformerSpikeRotations', JSON.stringify(rotationsData));
            }
        }

        // Update current level index if needed
        if (window.currentLevel === fromIndex) {
            window.currentLevel = toIndex;
        } else if (window.currentLevel > fromIndex && window.currentLevel <= toIndex) {
            window.currentLevel--;
        } else if (window.currentLevel < fromIndex && window.currentLevel >= toIndex) {
            window.currentLevel++;
        }

        // Save changes
        localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(window.levels));
        localStorage.setItem(STORAGE_KEYS.LEVEL_NAMES, JSON.stringify(window.levelNames));

        // Update selector and display
        updateLevelSelector();
    }
}

/**
 * Show notification
 */
function showNotification(message, duration = 3000) {
    // Check if the function already exists in the global scope
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, duration);
        return;
    }

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

// Export showNotification to window to make it available globally
window.showNotification = showNotification;

/**
 * Level Export Enhancement for Default Levels
 * This adds functionality to export the current level in a format suitable for default_levels.js
 */

// Add a new button to the export modal
function addDefaultLevelExportButton() {
    const exportButtonsContainer = document.querySelector('.export-buttons');
    if (!exportButtonsContainer) return;

    // Create the new button if it doesn't exist yet
    if (!document.getElementById('export-for-default-levels')) {
        const exportForDefaultBtn = document.createElement('button');
        exportForDefaultBtn.id = 'export-for-default-levels';
        exportForDefaultBtn.textContent = 'Copy as Default Level Format';
        exportForDefaultBtn.title = 'Copy the current level in a format suitable for pasting into default_levels.js';

        // Add the button to the container
        exportButtonsContainer.appendChild(exportForDefaultBtn);

        // Add event listener
        exportForDefaultBtn.addEventListener('click', copyAsDefaultLevelFormat);
    }
}

// Format the current level as a JavaScript array suitable for default_levels.js
function copyAsDefaultLevelFormat() {
    // Access the window-level levels array that's defined in level-editor.js
    // This fixes the "levels is not defined" error
    const levels = window.levels || [];
    const currentLevel = window.currentLevel || 0;

    // Get the current level data
    const currentLevelData = levels[currentLevel];

    if (!currentLevelData) {
        showNotification('No level data available', 3000);
        return;
    }

    // Format the level data as a JavaScript array with proper indentation
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
        showNotification('Copied level as default level format!', 3000);
    } catch (err) {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy level data', 3000);
    } finally {
        document.body.removeChild(tempTextArea);
    }
}

// Add a direct "Export to Default Level" button to the main controls
function addDirectExportButton() {
    const controlsContainer = document.querySelector('.controls div:first-child');
    if (!controlsContainer) return;

    // Create the button if it doesn't exist yet
    if (!document.getElementById('export-default-format-btn')) {
        const directExportBtn = document.createElement('button');
        directExportBtn.id = 'export-default-format-btn';
        directExportBtn.textContent = 'Copy as Default Level';
        directExportBtn.title = 'Copy the current level in a format suitable for pasting into default_levels.js';

        // Insert the button after the Save button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            controlsContainer.insertBefore(directExportBtn, exportBtn.nextSibling);
        } else {
            controlsContainer.appendChild(directExportBtn);
        }

        // Add event listener
        directExportBtn.addEventListener('click', copyAsDefaultLevelFormat);
    }
}

// Add a helper tooltip about this feature
function addDefaultLevelExportHelp() {
    const headerElement = document.querySelector('.header');
    if (!headerElement) return;

    // Create the help tooltip if it doesn't exist
    if (!document.getElementById('default-level-export-help')) {
        const helpElement = document.createElement('div');
        helpElement.id = 'default-level-export-help';
        helpElement.className = 'tooltip';
        helpElement.innerHTML = `
            <button>?</button>
            <span class="tooltiptext">
                To add a level to default_levels.js:<br>
                1. Create/edit your level<br>
                2. Click "Copy as Default Level"<br>
                3. Paste the copied array into default_levels.js<br>
                4. Add a corresponding name in DEFAULT_LEVEL_NAMES<br>
                5. Add a start position in DEFAULT_PLAYER_START_POSITIONS
            </span>
        `;

        // Add the help tooltip to the header
        headerElement.appendChild(helpElement);

        // Style the button
        const helpButton = helpElement.querySelector('button');
        helpButton.style.backgroundColor = '#444';
        helpButton.style.color = 'white';
        helpButton.style.borderRadius = '50%';
        helpButton.style.width = '24px';
        helpButton.style.height = '24px';
        helpButton.style.marginLeft = '10px';
        helpButton.style.fontSize = '14px';
        helpButton.style.fontWeight = 'bold';
    }
}

// Initialize the new default level export features
function initDefaultLevelExportFeatures() {
    // Add the new button to the export modal
    addDefaultLevelExportButton();

    // Add the direct export button to the controls
    addDirectExportButton();

    // Add the help tooltip
    addDefaultLevelExportHelp();
}

/**
 * Level Matrix Copy Button
 * This function adds a button to copy just the level matrix to the clipboard
 */

// Function to add a copy level matrix button to the interface
function addCopyLevelMatrixButton() {
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


// Make functions available globally
window.copyLevelMatrix = copyLevelMatrix;
window.addCopyLevelMatrixButton = addCopyLevelMatrixButton;

// Hook into the original initialization function if it exists
const originalInitEnhancedLevelEditor = window.initEnhancedLevelEditor || function() {};

window.initEnhancedLevelEditor = function() {
    // Call the original initialization function
    originalInitEnhancedLevelEditor.call(this);

    // Initialize our features
    setTimeout(initDefaultLevelExportFeatures, 800);
    setTimeout(addCopyLevelMatrixButton, 1000);
};

// If the page is already loaded, initialize the features
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initEnhancedLevelEditor, 800);
}