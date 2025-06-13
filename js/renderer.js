/**
 * Renderer class for handling all game rendering
 */
class Renderer {
    /**
     * Initialize the renderer
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Renderer settings
        this.settings = {
            pixelPerfect: true,
            showFPS: true
        };

        // FPS tracking
        this.fpsValues = [];
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.iceGlowTime = 0;
        this.iceGlowDirection = 1;
        this.iceParticleTimer = 0;
        this.backgroundStars = this.generateBackgroundStars(100);

        // Animation timers
        this.iceAnimationTime = 0;

        // Initialize canvas settings
        this.updateRenderSettings();
    }

    /**
     * Update canvas render settings
     */
    updateRenderSettings() {
        // Apply pixel-perfect rendering if enabled
        this.ctx.imageSmoothingEnabled = !this.settings.pixelPerfect;
    }

    /**
     * Main render function
     * @param {Object} gameState - The current game state
     */
    render(gameState) {
    // Calculate FPS
    this.calculateFPS();

    // Update animation timers
    this.iceAnimationTime += 0.02;
    if (this.iceAnimationTime > Math.PI * 2) {
        this.iceAnimationTime = 0;
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Only render game elements if we're in a playing state
    if (gameState.state === GameStates.PLAYING || gameState.state === GameStates.PAUSED) {
        // Draw background with stars
        this.drawBackground();

        // Draw level
        this.drawLevel(gameState.currentLevel);

        // Draw player if alive
        if (gameState.player.alive) {
            this.drawPlayer(gameState.player);
        }

        // Draw particles with enhanced rendering
        this.drawEnhancedParticles(gameState.particles);

        // Draw UI elements
        if (this.settings.showFPS) {
            this.drawFPS();
        }
    }
}
    drawFloorBackground(level) {
    // Find the highest y-coordinate where the floor starts
    let floorStartY = null;

    // Scan from the bottom up to find the floor
    for (let y = level.length - 1; y >= 0; y--) {
        const row = level[y];

        // Check if this row has any floor tiles
        const hasFloorTiles = row.some(tileId => {
            const tileType = TILE_TYPES[tileId];
            return tileType && tileType.solid && tileId !== 2; // Skip spikes
        });

        if (hasFloorTiles) {
            floorStartY = y;
            break;
        }
    }

    // If we found a floor, draw a solid background below it
    if (floorStartY !== null) {
        // Dark blue background for the area below the floor
        this.ctx.fillStyle = '#000033'; // Slightly different than the sky to provide contrast

        // Fill from the floor to the bottom of the canvas
        this.ctx.fillRect(
            0,
            floorStartY * TILE_SIZE,
            this.canvas.width,
            this.canvas.height - (floorStartY * TILE_SIZE)
        );
    }
}

    /**
     * Calculate and track FPS
     */
    calculateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Calculate instantaneous FPS
        const instantFPS = 1000 / delta;

        // Add to rolling average (last 30 frames)
        this.fpsValues.push(instantFPS);
        if (this.fpsValues.length > 30) {
            this.fpsValues.shift();
        }

        // Calculate average FPS every 10 frames
        this.frameCount++;
        if (this.frameCount >= 10) {
            this.fps = Math.round(
                this.fpsValues.reduce((sum, value) => sum + value, 0) / this.fpsValues.length
            );
            this.frameCount = 0;
        }
    }

    /**
     * Draw FPS counter
     */
    drawFPS() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(this.canvas.width - 70, 10, 60, 20);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px "Courier New"';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`FPS: ${this.fps}`, this.canvas.width - 15, 24);
        this.ctx.textAlign = 'left';
    }

    /**
     * Draw starry background
     */

    generateBackgroundStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 0.5,
            brightness: 0.2 + Math.random() * 0.8,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }
    return stars;
}

    drawBackground(timeScale = 1) {
    // Fill with dark blue gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(1, '#00033a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stars with twinkling effect
    for (const star of this.backgroundStars) {
        // Calculate twinkling effect
        const brightness = star.brightness *
            (0.7 + 0.3 * Math.sin(this.iceAnimationTime * star.twinkleSpeed + star.twinkleOffset));

        this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

      // Update the drawLevel method to properly handle spike rotations
    /**
     * Draw the level tiles with proper background filling
     * @param {Array} level - 2D array of tile IDs
     */
    drawLevel(level) {
        if (!level) return;

        // First, let's draw a solid background behind the floor to prevent the grid from showing
        this.drawFloorBackground(level);

        // Then draw each tile
        for (let y = 0; y < level.length; y++) {
            for (let x = 0; x < level[y].length; x++) {
                const tileId = level[y][x];

                // Skip empty tiles
                if (tileId === 0) continue;

                const tileType = TILE_TYPES[tileId];
                if (!tileType) continue;

                // Calculate tile position
                const tileX = x * TILE_SIZE;
                const tileY = y * TILE_SIZE;

                // Draw the appropriate tile type
                if (tileId === 2 || (tileId >= 10 && tileId <= 13)) { // All spike types
                    // Get rotation based on spike type
                    let rotation = 0;

                    if (tileId >= 10 && tileId <= 13) {
                        // Use pre-defined rotation from the tile type
                        rotation = tileType.rotation;
                    } else if (tileId === 2) {
                        // For backwards compatibility, check if we have rotation data
                        if (levelLoader && typeof levelLoader.getSpikeRotation === 'function') {
                            rotation = levelLoader.getSpikeRotation(x, y);
                        }
                    }

                    this.drawSpike(tileX, tileY, rotation);
                } else {
                    this.drawRegularTile(tileX, tileY, tileType, tileId);
                }
            }
        }
    }


    /**
 * Draw a spike tile with proper rotation
 * @param {number} x - Tile x-coordinate
 * @param {number} y - Tile y-coordinate
 * @param {number} rotation - Rotation angle in degrees
 */
    drawSpike(x, y, rotation = 0) {
    // Save the current context state
    this.ctx.save();

    // Translate to the center of the spike
    this.ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);

    // Rotate
    this.ctx.rotate(rotation * Math.PI / 180);

    // Draw the spike triangle
    this.ctx.fillStyle = '#d03535';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -TILE_SIZE / 2);
    this.ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 2);
    this.ctx.lineTo(-TILE_SIZE / 2, TILE_SIZE / 2);
    this.ctx.closePath();
    this.ctx.fill();

    // Add a highlight
    this.ctx.fillStyle = '#ff5555';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -TILE_SIZE / 2 + 5);
    this.ctx.lineTo(TILE_SIZE / 2 - 5, TILE_SIZE / 2 - 5);
    this.ctx.lineTo(-TILE_SIZE / 2 + 5, TILE_SIZE / 2 - 5);
    this.ctx.closePath();
    this.ctx.fill();

    // Restore the context
    this.ctx.restore();
}
    /**
     * Draw a regular (non-spike) tile
     * @param {number} x - Tile x-coordinate
     * @param {number} y - Tile y-coordinate
     * @param {Object} tileType - Tile type definition
     * @param {number} tileId - Tile ID
     */
    drawRegularTile(x, y, tileType, tileId) {
    // Draw base tile
    this.ctx.fillStyle = tileType.color;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Add tile-specific details
    switch (tileId) {
        case 3: // Goal platform
            this.drawGoalTile(x, y);
            break;
        case 7: // Ice platform
            this.drawIceTile(x, y);
            break;
        case 8: // Bounce platform
            this.drawBounceTile(x, y);
            break;
        case 1: // Basic platform - typically used for floor
        case 4: // Dirt
        case 5: // Wood
        case 6: // Stone
            // For floor/ground tiles, draw them extending slightly downward
            // This helps prevent any gaps from showing the background
            this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE + 1);
            break;
    }

    // Add shadow to all regular tiles
    this.drawTileShadow(x, y);
}

    /**
     * Draw goal tile details
     * @param {number} x - Tile x-coordinate
     * @param {number} y - Tile y-coordinate
     */
    drawGoalTile(x, y) {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillRect(
            x + 8,
            y + 8,
            TILE_SIZE - 16,
            TILE_SIZE - 16
        );
    }

    /**
     * Draw ice tile details with enhanced visuals
     * @param {number} x - Tile x-coordinate
     * @param {number} y - Tile y-coordinate
     */
    drawIceTile(x, y) {
    // Update ice glow effect
    this.iceGlowTime += 0.02 * this.iceGlowDirection;
    if (this.iceGlowTime > 1 || this.iceGlowTime < 0) {
        this.iceGlowDirection *= -1;
    }

    // Base ice color
    const baseColor = '#6d8ad0';

    // Draw base tile
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Draw shimmering effect that changes over time
    const shimmerOpacity = 0.3 + 0.2 * this.iceGlowTime;

    // White shimmer at the top
    this.ctx.fillStyle = `rgba(255, 255, 255, ${shimmerOpacity})`;
    this.ctx.fillRect(
        x,
        y,
        TILE_SIZE,
        TILE_SIZE / 3
    );

    // Add crystal-like details
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 1;

    // Draw a few random crystal lines
    const seed = (x * 7 + y * 13) % 10; // Generate semi-random pattern based on position

    this.ctx.beginPath();
    this.ctx.moveTo(x + 5 + seed, y + 5);
    this.ctx.lineTo(x + 15 + seed, y + 20);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + 20 - seed, y + 8);
    this.ctx.lineTo(x + 10 - seed, y + 25);
    this.ctx.stroke();

    // Add occasional ice particles
    this.iceParticleTimer += 0.1;
    if (Math.random() < 0.02 && Math.sin(this.iceParticleTimer) > 0.8) {
        gameManager.gameState.particles.push({
            x: x + Math.random() * TILE_SIZE,
            y: y,
            size: 1 + Math.random() * 2,
            color: '#d0f0ff',
            velX: (Math.random() - 0.5) * 0.5,
            velY: -0.2 - Math.random() * 0.3,
            gravity: 0.01,
            life: 20 + Math.random() * 30
        });
    }
}

    drawEnhancedParticles(particles) {
    // Use canvas blend modes for glowing particles
    this.ctx.globalCompositeOperation = 'lighter';

    for (let particle of particles) {
        // Different rendering based on particle color
        if (particle.color === '#ffff00') {
            // Goal particles - make them glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        else if (particle.color.includes('b0e0ff') || particle.color.includes('d0f0ff')) {
            // Ice particles - blue glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 1.5
            );
            gradient.addColorStop(0, 'rgba(208, 240, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(176, 224, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        else {
            // Standard particles
            this.ctx.globalAlpha = particle.life / 50;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }
    }

    // Reset composite operation and alpha
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
}

    /**
     * Draw bounce tile details
     * @param {number} x - Tile x-coordinate
     * @param {number} y - Tile y-coordinate
     */
    drawBounceTile(x, y) {
        // Animate the bounce pad
        const bounceHeight = 3 * Math.sin(this.iceAnimationTime * 2);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
            x + 8,
            y + 8 + bounceHeight,
            TILE_SIZE - 16,
            TILE_SIZE - 16 - bounceHeight
        );
    }

    /**
     * Draw shadow at the bottom of a tile
     * @param {number} x - Tile x-coordinate
     * @param {number} y - Tile y-coordinate
     */
    drawTileShadow(x, y) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(
            x,
            y + TILE_SIZE - 4,
            TILE_SIZE,
            4
        );
    }

    /**
     * Draw the player character
     * @param {Object} player - The player object
     */
    drawPlayer(player) {
        // Player body - change color if celebrating
        if (player.celebrating) {
            // Flash between colors based on time
            const timeSinceStart = performance.now() - player.celebrationStart;
            const flashPhase = Math.floor(timeSinceStart / 100) % 3;

            // Celebration colors: gold, bright yellow, orange
            const celebrationColors = ['#ffd700', '#ffff00', '#ffa500'];
            this.ctx.fillStyle = celebrationColors[flashPhase];
        } else if (player.onIce && Math.abs(player.velX) > 5) {
            // Special color when sliding fast on ice
            this.ctx.fillStyle = '#7fb7e8'; // Light blue tint
        } else {
            this.ctx.fillStyle = '#4c6baf'; // Normal color
        }

        // Draw player body
        this.ctx.fillRect(
            player.x,
            player.y,
            player.width,
            player.height
        );

        // Player face details
        this.drawPlayerFace(player);

        // Add running animation if moving
        if (Math.abs(player.velX) > 0.5) {
            this.drawPlayerLegs(player);
        }

        // Add sliding effect if on ice and moving fast
        if (player.onIce && Math.abs(player.velX) > 5 && player.grounded) {
            this.drawIceSlideEffect(player);
        }

        // Add shadow under player
        this.drawPlayerShadow(player);
    }

    /**
     * Draw player's face
     * @param {Object} player - The player object
     */
    drawPlayerFace(player) {
        this.ctx.fillStyle = '#ffffff';

        // Eyes - adjust based on direction player is facing
        const eyeOffsetX = player.facingRight ? 0 : 0;

        // Left eye
        this.ctx.fillRect(
            player.x + 5 + eyeOffsetX,
            player.y + 8,
            4,
            4
        );

        // Right eye
        this.ctx.fillRect(
            player.x + 15 + eyeOffsetX,
            player.y + 8,
            4,
            4
        );
    }

    /**
     * Draw player's moving legs
     * @param {Object} player - The player object
     */
    drawPlayerLegs(player) {
        const legOffset = player.animationFrame % 2 === 0 ? 3 : -3;

        this.ctx.fillStyle = '#3a5189';

        // Left leg
        this.ctx.fillRect(
            player.x + 5,
            player.y + player.height,
            6,
            legOffset
        );

        // Right leg
        this.ctx.fillRect(
            player.x + player.width - 11,
            player.y + player.height,
            6,
            -legOffset
        );
    }

    /**
     * Draw ice slide effect under player
     * @param {Object} player - The player object
     */
    drawIceSlideEffect(player) {
        // Draw ice particles at player's feet
        this.ctx.fillStyle = 'rgba(176, 224, 255, 0.7)';

        for (let i = 0; i < 3; i++) {
            const offsetX = player.velX > 0 ? -i * 3 - 4 : i * 3 + 4;
            const size = 3 - i;

            this.ctx.fillRect(
                player.x + player.width / 2 + offsetX,
                player.y + player.height,
                size,
                size
            );
        }
    }

    /**
     * Draw shadow under the player
     * @param {Object} player - The player object
     */
    drawPlayerShadow(player) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(
            player.x,
            player.y + player.height - 4,
            player.width,
            4
        );
    }

    /**
     * Draw particles
     * @param {Array} particles - Array of particle objects
     */
    drawParticles(particles) {
        for (let particle of particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 50;
            this.ctx.fillRect(
                particle.x - particle.size / 2,
                particle.y - particle.size / 2,
                particle.size,
                particle.size
            );
        }
        this.ctx.globalAlpha = 1;
    }
}