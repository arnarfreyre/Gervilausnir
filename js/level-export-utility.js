/**
 * Level Export Utility
 * This file provides helper functions for exporting and importing level data
 * in various formats to make level creation easier for developers.
 */

class LevelExportUtility {
    /**
     * Convert a level to a compact JSON string
     * @param {Array} level - 2D array of tile IDs
     * @returns {string} - JSON string
     */
    static levelToJson(level) {
        return JSON.stringify(level);
    }

    /**
     * Convert a JSON string to a level
     * @param {string} jsonLevel - JSON representation of a level
     * @returns {Array} - 2D array of tile IDs
     */
    static jsonToLevel(jsonLevel) {
        return JSON.parse(jsonLevel);
    }

    /**
     * Export a single level to a JavaScript module string
     * @param {Array} level - 2D array of tile IDs
     * @param {string} name - Level name
     * @param {Object} startPos - Player start position {x, y}
     * @returns {string} - JavaScript module string
     */
    static levelToJsModule(level, name, startPos) {
        return `
/**
 * Level: ${name}
 */
export const ${this.sanitizeName(name)} = {
    layout: ${JSON.stringify(level, null, 2)},
    name: "${name}",
    startPosition: ${JSON.stringify(startPos)}
};`;
    }

    /**
     * Export multiple levels to a JavaScript module string
     * @param {Array} levels - Array of level objects
     * @returns {string} - JavaScript module string
     */
    static levelsToJsModule(levels) {
        const levelExports = levels.map((level, index) => {
            const name = level.name || `Level ${index + 1}`;
            const sanitizedName = this.sanitizeName(name);
            return `
/**
 * Level: ${name}
 */
export const ${sanitizedName} = {
    layout: ${JSON.stringify(level.layout, null, 2)},
    name: "${name}",
    startPosition: ${JSON.stringify(level.startPosition || { x: 1, y: 12 })}
};`;
        }).join('\n\n');

        // Add index export at the end
        const indexExport = `
/**
 * Export all levels in an array for easy import
 */
export const allLevels = [
    ${levels.map((level, index) => {
        const name = level.name || `Level ${index + 1}`;
        return this.sanitizeName(name);
    }).join(',\n    ')}
];`;

        return levelExports + '\n\n' + indexExport;
    }

    /**
     * Sanitize a level name for use as a JavaScript variable
     * @param {string} name - Level name
     * @returns {string} - Sanitized name
     */
    static sanitizeName(name) {
        // Remove special characters and spaces, convert to camelCase
        return name
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .split(' ')
            .map((word, index) => {
                if (index === 0) {
                    return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * Export all game levels to a sharable link
     * @param {Object} exportData - Object containing levels, names, etc.
     * @returns {string} - URL with encoded level data
     */
    static createShareableLink(exportData) {
        // Create a compact version of the export data
        const compactData = {
            levels: exportData.levels,
            levelNames: exportData.levelNames,
            playerStartPositions: exportData.playerStartPositions
        };

        // Convert to JSON and encode as base64
        const jsonData = JSON.stringify(compactData);
        const base64Data = btoa(jsonData);

        // Create a URL with the data as a parameter
        const url = new URL(window.location.href);
        url.searchParams.set('levelData', base64Data);

        // Return the full URL
        return url.toString();
    }

    /**
     * Create a level template with common game elements
     * @param {number} width - Level width in tiles
     * @param {number} height - Level height in tiles
     * @returns {Array} - 2D array of tile IDs
     */
    static createLevelTemplate(width = 25, height = 16) {
        const level = [];

        // Create an empty level
        for (let y = 0; y < height; y++) {
            const row = [];

            for (let x = 0; x < width; x++) {
                // Add a ground floor at the bottom
                if (y === height - 1) {
                    row.push(1); // Platform
                } else {
                    row.push(0); // Empty
                }
            }

            level.push(row);
        }

        // Add a goal on the right side
        level[height - 3][width - 3] = 3; // Goal

        // Add some platforms
        level[height - 5][width - 10] = 1;
        level[height - 5][width - 9] = 1;
        level[height - 5][width - 8] = 1;

        // Add some spikes
        level[height - 2][width - 6] = 2;

        return level;
    }
}

// Make available to the window object for browser console use
window.LevelExportUtility = LevelExportUtility;