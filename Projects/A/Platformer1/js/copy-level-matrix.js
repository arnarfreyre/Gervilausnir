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

// Function to copy just the current level matrix to clipboard
function copyLevelMatrix() {
    // Access the window-level levels array that's defined in level-editor.js
    const levels = window.levels || [];
    const currentLevel = window.currentLevel || 0;

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

// Make sure there's a showNotification function
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

// Initialize the button
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure the level editor has initialized
    setTimeout(addCopyLevelMatrixButton, 1000);
});

// Make functions available globally
window.copyLevelMatrix = copyLevelMatrix;
window.addCopyLevelMatrixButton = addCopyLevelMatrixButton;