// online-level-editor.js - Modifications to level editor for online functionality

// Add these functions to your existing level-editor.js

/**
 * Initialize online features in the level editor
 */
function initializeOnlineFeatures() {
    // Add online save button
    addOnlineSaveButton();

    // Add publish/unpublish toggle
    addPublishToggle();

    // Add difficulty selector
    addDifficultySelector();

    // Add tags input
    addTagsInput();

    // Initialize Firebase if not already done
    if (typeof firebase === 'undefined') {
        loadFirebaseScript();
    }
}

/**
 * Add online save button to the controls
 */
function addOnlineSaveButton() {
    const controlsContainer = document.querySelector('.controls div:first-child');
    if (!controlsContainer) return;

    // Create online save button
    const onlineSaveBtn = document.createElement('button');
    onlineSaveBtn.id = 'online-save-btn';
    onlineSaveBtn.textContent = 'Save Online';
    onlineSaveBtn.style.backgroundColor = '#41a547';
    onlineSaveBtn.title = 'Save this level online for everyone to play';

    // Insert after regular save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        controlsContainer.insertBefore(onlineSaveBtn, saveBtn.nextSibling);
    }

    // Add click handler
    onlineSaveBtn.addEventListener('click', saveLeveOnline);
}

/**
 * Add publish toggle to controls
 */
function addPublishToggle() {
    const controlsContainer = document.querySelector('.controls div:last-child');
    if (!controlsContainer) return;

    const publishContainer = document.createElement('div');
    publishContainer.style.display = 'inline-block';
    publishContainer.style.marginLeft = '10px';
    publishContainer.innerHTML = `
        <input type="checkbox" id="publish-level" checked>
        <label for="publish-level" style="color: white; margin-left: 5px;">Public</label>
    `;

    controlsContainer.appendChild(publishContainer);
}

/**
 * Add difficulty selector
 */
function addDifficultySelector() {
    const levelNameInput = document.getElementById('level-name');
    if (!levelNameInput || !levelNameInput.parentElement) return;

    const difficultyContainer = document.createElement('div');
    difficultyContainer.style.display = 'inline-block';
    difficultyContainer.style.marginLeft = '10px';
    difficultyContainer.innerHTML = `
        <label for="level-difficulty" style="color: white; margin-right: 5px;">Difficulty:</label>
        <select id="level-difficulty" style="background-color: #333; color: white; border: 1px solid #555; padding: 5px;">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
            <option value="extreme">Extreme</option>
        </select>
    `;

    levelNameInput.parentElement.appendChild(difficultyContainer);
}

/**
 * Add tags input
 */
function addTagsInput() {
    const levelNameInput = document.getElementById('level-name');
    if (!levelNameInput || !levelNameInput.parentElement) return;

    const tagsContainer = document.createElement('div');
    tagsContainer.style.marginTop = '10px';
    tagsContainer.innerHTML = `
        <input type="text" id="level-tags" placeholder="Tags (comma separated)" 
               style="background-color: #333; color: white; border: 1px solid #555; 
                      padding: 5px; width: 300px; margin-left: 5px;">
    `;

    levelNameInput.parentElement.appendChild(tagsContainer);
}

/**
 * Save level online
 */
async function saveLeveOnline() {
    // First save locally to ensure all data is up to date
    saveLevels(false);

    // Get level data
    const levelData = {
        name: levelNames[currentLevel] || `Level ${currentLevel + 1}`,
        author: getAuthorName(),
        grid: levels[currentLevel],
        startPosition: playerStartX !== null && playerStartY !== null
            ? { x: playerStartX, y: playerStartY }
            : { x: 1, y: 12 },
        spikeRotations: rotationData[currentLevel] || null,
        difficulty: document.getElementById('level-difficulty')?.value || 'medium',
        tags: getTagsArray(),
        isPublic: document.getElementById('publish-level')?.checked !== false
    };

    // Show loading state
    const onlineSaveBtn = document.getElementById('online-save-btn');
    const originalText = onlineSaveBtn.textContent;
    onlineSaveBtn.textContent = 'Saving...';
    onlineSaveBtn.disabled = true;

    try {
        // Check if level API is available
        if (!window.levelAPI) {
            throw new Error('Online features not available. Please check your connection.');
        }

        // Save the level
        const savedLevel = await window.levelAPI.saveLevel(levelData);

        // Store the online ID for future updates
        if (!window.onlineLevelIds) {
            window.onlineLevelIds = {};
        }
        window.onlineLevelIds[currentLevel] = savedLevel.id;
        localStorage.setItem('platformerOnlineLevelIds', JSON.stringify(window.onlineLevelIds));

        // Show success notification
        showNotification(`Level saved online! ID: ${savedLevel.id}`, 5000);

        // Update button to show update instead of save
        onlineSaveBtn.textContent = 'Update Online';

    } catch (error) {
        console.error('Error saving level online:', error);
        showNotification('Failed to save level online: ' + error.message, 5000);
        onlineSaveBtn.textContent = originalText;
    } finally {
        onlineSaveBtn.disabled = false;
    }
}

/**
 * Get author name (implement your own authentication)
 */
function getAuthorName() {
    // Simple implementation - in production, use proper authentication
    let authorName = localStorage.getItem('platformerAuthorName');

    if (!authorName) {
        authorName = prompt('Enter your name (this will be shown as the level author):');
        if (authorName) {
            localStorage.setItem('platformerAuthorName', authorName);
        } else {
            authorName = 'Anonymous';
        }
    }

    return authorName;
}

/**
 * Get tags as array
 */
function getTagsArray() {
    const tagsInput = document.getElementById('level-tags');
    if (!tagsInput || !tagsInput.value) return [];

    return tagsInput.value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

/**
 * Load Firebase script dynamically
 */
function loadFirebaseScript() {
    const scripts = [
        'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js'
    ];

    scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        document.head.appendChild(script);
    });

    // Load configuration after scripts are loaded
    setTimeout(() => {
        const configScript = document.createElement('script');
        configScript.src = 'js/firebase-config.js';
        document.head.appendChild(configScript);

        // Load level API
        setTimeout(() => {
            const apiScript = document.createElement('script');
            apiScript.src = 'js/level-api.js';
            document.head.appendChild(apiScript);
        }, 500);
    }, 1000);
}

/**
 * Load online level IDs from storage
 */
function loadOnlineLevelIds() {
    const savedIds = localStorage.getItem('platformerOnlineLevelIds');
    if (savedIds) {
        window.onlineLevelIds = JSON.parse(savedIds);
    } else {
        window.onlineLevelIds = {};
    }
}

// Initialize online features when the editor loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the basic editor to initialize
    setTimeout(() => {
        initializeOnlineFeatures();
        loadOnlineLevelIds();
    }, 1000);
});