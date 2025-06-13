/**
 * Level Editor Modifications
 *
 * This file contains the changes needed to remove the reorder functionality
 * from the level editor.
 *
 * 1. Add this JavaScript to a new file or integrate with your level-editor.js file
 * 2. Replace the relevant sections in your level-editor.js and enhanced-level-editor.js
 */

/**
 * Remove reorder button and related UI elements
 */
function removeReorderFunctionality() {
    // Remove the reorder button
    const reorderBtn = document.getElementById('reorder-levels-btn');
    if (reorderBtn) {
        reorderBtn.remove();
    }

    // Remove the level order modal
    const orderModal = document.getElementById('level-order-modal');
    if (orderModal) {
        orderModal.remove();
    }

    // Add a level order config hint
    addLevelOrderConfigHint();
}

/**
 * Add a hint about the level-order-config.js file
 */
function addLevelOrderConfigHint() {
    const levelSelector = document.querySelector('.level-selector');
    if (!levelSelector) return;

    // Create level order hint
    const orderHint = document.createElement('div');
    orderHint.className = 'level-order-hint';
    orderHint.innerHTML = `
        <button id="order-hint-btn" title="Level order is now managed through level-order-config.js">
            Level Order
        </button>
    `;

    // Style the element
    orderHint.style.display = 'inline-block';
    orderHint.style.marginLeft = '10px';

    const hintBtn = orderHint.querySelector('button');
    hintBtn.style.backgroundColor = '#555';
    hintBtn.style.color = 'white';
    hintBtn.style.border = 'none';
    hintBtn.style.padding = '5px 10px';
    hintBtn.style.borderRadius = '3px';
    hintBtn.style.cursor = 'pointer';

    // Add click handler to show a message about the config file
    hintBtn.addEventListener('click', () => {
        alert(
            'Level order is now managed through the level-order-config.js file.\n\n' +
            'To change the order of levels in your game, edit the LEVEL_ORDER array in that file.\n\n' +
            'Rearrange the level names to change their order in the game.'
        );
    });

    // Add to the document
    levelSelector.appendChild(orderHint);
}

/**
 * Replace the setupDragAndDropLevelReordering function with an empty one
 *
 * This is an alternative to completely removing the function, which
 * might cause errors if it's called elsewhere in the code.
 */
function setupDragAndDropLevelReordering() {
    // This function is intentionally empty to disable the reordering functionality
    console.log('Level drag-and-drop reordering has been disabled.');

    // Level order is now managed through level-order-config.js
}

// When the page is loaded, remove the reorder functionality
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure the level editor has initialized
    setTimeout(removeReorderFunctionality, 1000);
});

// Export the replacement function for testing
window.setupDragAndDropLevelReordering = setupDragAndDropLevelReordering;