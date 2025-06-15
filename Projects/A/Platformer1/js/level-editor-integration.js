/**
 * Level Editor Integration Script
 * This file integrates all the enhanced functionality into the level editor.
 * It should be included after level-editor.js in the HTML file.
 */

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing enhanced level editor features...');

    // Initialize original enhanced editor features if present
    if (typeof window.initEnhancedLevelEditor === 'function') {
        window.initEnhancedLevelEditor();
    }

    // Add our new copy level matrix button with a slight delay
    // to ensure the editor is fully initialized
    setTimeout(function() {
        if (typeof window.addCopyLevelMatrixButton === 'function') {
            window.addCopyLevelMatrixButton();
            console.log('Copy level matrix button added');
        } else {
            console.error('Copy level matrix function not found');

            // Fallback implementation in case the main function isn't loaded
            const controlsContainer = document.querySelector('.controls div:first-child');
            if (controlsContainer) {
                const copyLevelBtn = document.createElement('button');
                copyLevelBtn.id = 'copy-level-matrix-btn';
                copyLevelBtn.textContent = 'Copy Level Matrix';

                // Basic copy functionality
                copyLevelBtn.addEventListener('click', function() {
                    const levels = window.levels || [];
                    const currentLevel = window.currentLevel || 0;
                    const levelData = levels[currentLevel];

                    if (levelData) {
                        const formattedLevel = JSON.stringify(levelData, null, 4);

                        // Copy to clipboard
                        const temp = document.createElement('textarea');
                        temp.value = formattedLevel;
                        document.body.appendChild(temp);
                        temp.select();
                        document.execCommand('copy');
                        document.body.removeChild(temp);

                        alert('Level matrix copied to clipboard!');
                    } else {
                        alert('No level data available');
                    }
                });

                const saveBtn = document.getElementById('save-btn');
                if (saveBtn) {
                    controlsContainer.insertBefore(copyLevelBtn, saveBtn.nextSibling);
                } else {
                    controlsContainer.appendChild(copyLevelBtn);
                }

                console.log('Fallback copy level button added');
            }
        }
    }, 1500);
});