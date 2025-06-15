/**
 * Player class for handling player state and physics
 */
class Player {
    constructor(x, y) {
        this.reset(x, y);
    }

    /**
     * Reset player to initial state
     */
    reset(x, y) {
        // Position and dimensions
        this.x = x || 100;
        this.y = y || 100;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;

        // Physics - Use constants directly from constants.js
        this.velX = 0;
        this.velY = 0;
        this.friction = DEFAULT_FRICTION;
        this.speed = MOVE_SPEED;
        this.maxSpeed = MOVE_SPEED;
        this.onIce = false;
        this.horizontalJumpFactor = 0.3; // How much horizontal movement affects jumps
        this.wasOnNonIce = true; // Track if we were on non-ice surface
        this.iceAccelerationApplied = false; // Flag to track if ice boost was already applied
        this.iceTime = 0; // Time spent continuously on ice
        this.movingDirection = 0; // Current movement direction (-1, 0, 1)
        this.currentTile = null; // Current tile type the player is standing on
        this.wasOnIce = false;         // Track if player was on ice before jumping
        this.iceSlipFactor = 0.2;      // Controls how slippery ice remains in air
        this.iceJumpTimer = 0;         // Track time since jumping from ice
        this.iceJumpDuration = 45;     // How long ice effects persist in air (in frames)
        this.iceInertia = 0;           // Store ice momentum

        // Debug
        this.debugInfo = {
            isOnIce: false,
            tileId: 0
        };

        // State
        this.jumping = false;
        this.grounded = false;
        this.alive = true;
        this.facingRight = true;
        this.lastGrounded = false; // Used for landing effects
        this.jumpAngled = false; // Whether current jump is angled
        this.jumpDirection = 0; // Direction of angled jump (-1 left, 0 vertical, 1 right)

        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;

        // Celebration effect
        this.celebrating = false;
        this.celebrationStart = 0;
        this.celebrationDuration = 100; // 0.1 second
    }

    /**
     * Main update method
     */
    update(level, keys, particles, deltaTime) {
        if (!this.alive) return;

        // Scale for consistent physics at different frame rates
        const timeScale = deltaTime / (1000 / 60);

        // Update celebration if active
        this.updateCelebration();

        // Check boundaries
        this.handleBoundaries();

        // Update movement direction based on keys
        this.updateMovementDirection(keys);

        // Update player's current tile - this is critical for proper ice detection
        this.updateCurrentTile(level);

        // Handle special tiles (ice, bounce pads)
        this.handleSpecialTiles(level, particles, timeScale);

        // Handle input
        this.handleInput(keys, particles, timeScale);

        // Update physics
        this.updatePhysics(timeScale);

        // Move player and check collisions
        this.handleMovement(level, timeScale);

        // Check for landing effects
        this.checkLandingEffects(particles);

        // Update animation
        this.updateAnimation(timeScale);

        // Track non-ice state for next frame
        if (!this.onIce) {
            this.wasOnNonIce = true;
            this.iceTime = 0;
            this.iceAccelerationApplied = false;
        }
    }

    /**
     * Update the current tile the player is standing on
     */
    updateCurrentTile(level) {
        // When grounded, we need to explicitly identify which tile we're on
        if (this.grounded) {
            // Get the tile directly beneath the player's center
            const centerX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
            const footY = Math.floor((this.y + this.height + 2) / TILE_SIZE);

            // Bounds check
            if (footY >= 0 && footY < level.length && centerX >= 0 && centerX < level[footY].length) {
                const tileId = level[footY][centerX];
                this.currentTile = TILE_TYPES[tileId];
                this.debugInfo.tileId = tileId;
            } else {
                this.currentTile = null;
                this.debugInfo.tileId = -1;
            }
        } else {
            // Not grounded, do a more detailed check for collision detection
            const footTiles = this.getFootTileTypes(level);
            this.currentTile = footTiles.find(tile => tile !== null) || null;
        }
    }

    /**
     * Update movement direction based on keys
     */
    updateMovementDirection(keys) {
        if (keys['ArrowRight']) {
            this.movingDirection = 1;
        } else if (keys['ArrowLeft']) {
            this.movingDirection = -1;
        } else {
            this.movingDirection = 0;
        }
    }

    /**
     * Update celebration effect if active
     */
    updateCelebration() {
        if (this.celebrating) {
            const elapsed = performance.now() - this.celebrationStart;
            if (elapsed >= this.celebrationDuration) {
                this.celebrating = false;
            }
        }
    }

    /**
     * Handle screen boundaries
     */
    handleBoundaries() {
        // Prevent player from going above the screen
        if (this.y < 0) {
            this.y = 0;
            if (this.velY < 0) {
                this.velY = 0;
            }
        }
    }

    /**
     * Handle special tile types (ice, bounce pads)
     */
    handleSpecialTiles(level, particles, timeScale) {
    // First check direct player-to-tile contacts using collision detection
    const footTileTypes = this.getFootTileTypes(level);

    // Use multiple detection methods to improve reliability
    const tileTypesUnderPlayer = [this.currentTile, ...footTileTypes].filter(t => t !== null);

    // Check if any of the tiles the player is in contact with are ice
    const onIceNow = tileTypesUnderPlayer.some(tile => tile && tile.ice);

    // Update debug info
    this.debugInfo.isOnIce = onIceNow;

    if (onIceNow) {
        // Player is on ice
        this.friction = ICE_FRICTION;
        this.onIce = true;
        this.wasOnIce = true;
        this.maxSpeed = ICE_MAX_SPEED; // Use the constant directly
        this.horizontalJumpFactor = 0.2;

        // Reset jump timer when on ice
        this.iceJumpTimer = 0;

        // Increment time spent on ice
        this.iceTime += timeScale;

        // Apply speed boost only when first moving onto ice from non-ice
        if (this.wasOnNonIce && !this.iceAccelerationApplied && Math.abs(this.velX) > 2) {
            // Stronger initial ice boost for better effect
            this.velX *= 1.6;

            // Cap at max speed
            this.velX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velX));

            // Mark that we've applied the ice acceleration for this ice patch
            this.iceAccelerationApplied = true;
            this.wasOnNonIce = false;

            // Create ice particles for visual effect
            this.createIceEffectParticles(particles);
        }

        // Gradually increase speed if player is actively moving on ice
        const isMovingOnIce = (this.movingDirection > 0 && this.velX >= 0) ||
                           (this.movingDirection < 0 && this.velX <= 0);

        if (isMovingOnIce && this.iceTime > 5 && Math.abs(this.velX) < this.maxSpeed) {
            // More aggressive acceleration on ice
            const accelerationFactor = Math.min(this.iceTime / 20, 1.0) * 0.15;

            if (this.velX > 0) {
                this.velX += accelerationFactor * timeScale;
            } else if (this.velX < 0) {
                this.velX -= accelerationFactor * timeScale;
            }

            // Create occasional slide particles
            if (Math.random() < 0.05 && Math.abs(this.velX) > this.maxSpeed * 0.6) {
                this.createIceSlideParticles(particles);
            }
        }

        // Store current ice inertia when on ice
        this.iceInertia = this.velX;
    } else {
        // Player is not on ice - but might still be affected by ice physics if jumping

        // Check if we're in the air after having been on ice
        if (!this.grounded && this.wasOnIce) {
            // Increment ice jump timer
            this.iceJumpTimer += timeScale;

            // Apply ice effects if still within the ice effect duration
            if (this.iceJumpTimer < this.iceJumpDuration) {
                // Apply diminishing ice physics while in air
                const iceEffectStrength = 1 - (this.iceJumpTimer / this.iceJumpDuration);
                this.friction = DEFAULT_FRICTION + (ICE_FRICTION - DEFAULT_FRICTION) * iceEffectStrength;

                // Maintain some ice momentum
                if (Math.abs(this.iceInertia) > 2) {
                    // Apply a percentage of the ice inertia to the current velocity
                    const inertiaFactor = 0.03 * iceEffectStrength * timeScale;
                    this.velX += this.iceInertia * inertiaFactor;
                }

                // Visual indicator of ice effects (reduce as effect diminishes)
                if (Math.random() < 0.02 * iceEffectStrength && Math.abs(this.velX) > 5) {
                    this.createIceSlideParticles(particles, true);  // true = air particles
                }
            } else {
                // Ice effect has ended
                this.wasOnIce = false;
                this.friction = DEFAULT_FRICTION;
            }
        } else if (this.grounded) {
            // When landing on non-ice, reset ice effects
            this.friction = DEFAULT_FRICTION;
            this.onIce = false;
            this.wasOnIce = false;
            this.maxSpeed = MOVE_SPEED; // Reset to normal speed constant
            this.horizontalJumpFactor = 0.3;
            this.iceJumpTimer = 0;
        }
    }

    // Check for bounce pads - not directly related to ice physics, but kept for completeness
    const onBouncePad = tileTypesUnderPlayer.some(tile => tile && tile.bounce);
    if (onBouncePad && this.velY > 0) {
        // Apply bounce effect - Use the constants directly
        this.velY = JUMP_FORCE * BOUNCE_MULTIPLIER;

        // Add some horizontal component based on current motion
        if (Math.abs(this.velX) > 2) {
            this.velX *= 1.2; // Boost horizontal movement on bounce
        }

        this.createParticleEffect(particles, PARTICLE_TYPES.BOUNCE);
    }
}

    /**
     * Create particles for sliding on ice
     */
    createIceSlideParticles(particles, inAir = false) {
    if (!particles) return;

    const iceParticles = {
        count: inAir ? 1 : 2,
        color: inAir ? '#d0f0ff' : '#b0e0ff',
        size: inAir ? [1, 2] : [1, 3],
        speed: inAir ? 0.5 : 1,
        gravity: 0.01,
        lifetime: inAir ? [5, 10] : [10, 20]
    };

    // Direction based on movement
    const direction = this.velX > 0 ? Math.PI : 0;

    // Create particles
    const particleCount = Math.random() < 0.3 ? iceParticles.count : 1;

    for (let i = 0; i < particleCount; i++) {
        const speed = Math.random() * iceParticles.speed;
        const size = iceParticles.size[0] + Math.random() * (iceParticles.size[1] - iceParticles.size[0]);
        const lifetime = iceParticles.lifetime[0] + Math.random() * (iceParticles.lifetime[1] - iceParticles.lifetime[0]);

        // Position slightly differently for in-air particles
        const xPos = this.x + (this.velX > 0 ? 0 : this.width);
        const yPos = inAir ?
            this.y + this.height * Math.random() :
            this.y + this.height - 2;

        particles.push({
            x: xPos,
            y: yPos,
            size: size,
            color: iceParticles.color,
            velX: Math.cos(direction) * speed,
            velY: Math.sin(direction) * speed + (inAir ? 0.3 : 0),
            gravity: iceParticles.gravity,
            life: lifetime
        });
    }
}

    /**
     * Get tile types at player's feet
     * @returns {Array} Array of tile types at player's feet
     */
    getFootTileTypes(level) {
        // Enhanced detection with more points for better coverage
        const points = [
            { x: this.x + 2, y: this.y + this.height },               // Left foot
            { x: this.x + this.width / 2, y: this.y + this.height },  // Center foot
            { x: this.x + this.width - 2, y: this.y + this.height },  // Right foot
            { x: this.x + this.width / 2, y: this.y + this.height + 2 } // Point slightly below feet
        ];

        return points.map(point => {
            const tileX = Math.floor(point.x / TILE_SIZE);
            const tileY = Math.floor(point.y / TILE_SIZE);

            // Check bounds before accessing array
            if (tileY >= 0 && tileY < level.length && tileX >= 0 && tileX < level[tileY].length) {
                const tileId = level[tileY][tileX];
                return TILE_TYPES[tileId];
            }
            return null;
        });
    }

    /**
     * Create particles for ice transition effect
     */
    createIceEffectParticles(particles) {
        if (!particles) return;

        const iceParticles = {
            count: 8,
            color: '#b0e0ff',
            size: [2, 5],
            speed: 2,
            gravity: 0.05,
            lifetime: [20, 40]
        };

        for (let i = 0; i < iceParticles.count; i++) {
            // Random angle concentrated behind the player to show sliding
            const direction = this.velX > 0 ? Math.PI : 0;
            const angle = direction + (Math.random() - 0.5) * Math.PI * 0.5;

            const speed = Math.random() * iceParticles.speed;
            const size = iceParticles.size[0] + Math.random() * (iceParticles.size[1] - iceParticles.size[0]);
            const lifetime = iceParticles.lifetime[0] + Math.random() * (iceParticles.lifetime[1] - iceParticles.lifetime[0]);

            particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height - 2,
                size: size,
                color: iceParticles.color,
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed,
                gravity: iceParticles.gravity,
                life: lifetime
            });
        }
    }

    /**
     * Update physics values like friction and gravity
     */
    updatePhysics(timeScale) {
        // Apply friction - more complex for ice
        if (this.onIce) {
            // On ice, apply friction more gradually to simulate sliding
            // Only apply friction if the velocity is above a threshold or if not trying to move
            if (Math.abs(this.velX) > 0.5) {
                this.velX *= Math.pow(this.friction, timeScale * 0.5); // Slower deceleration
            } else {
                this.velX = 0; // Stop completely below a threshold to prevent micro-sliding
            }
        } else {
            // Normal friction on regular surfaces
            this.velX *= Math.pow(this.friction, timeScale);
        }

        // Cap velocity at max speed (which varies based on surface)
        this.velX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velX));

        // Apply gravity - use the constant directly
        this.velY += GRAVITY * timeScale;

        // If we're doing an angled jump, add a slight horizontal boost
        if (this.jumpAngled && !this.grounded && Math.abs(this.velY) < 8) {
            // Early in the jump, boost horizontal movement in the jump direction
            this.velX += this.jumpDirection * 0.1 * timeScale;
        }
    }

    /**
     * Handle user input
     */
    handleInput(keys, particles, timeScale) {
    // Handle jump with momentum-based direction
    if ((keys['ArrowUp'] || keys[' ']) && !this.jumping && this.grounded) {
        this.jumping = true;
        this.grounded = false;

        // Base vertical jump velocity - use the constant directly
        this.velY = JUMP_FORCE;

        // Store current ice state when jumping
        if (this.onIce) {
            // Reset the ice jump timer when jumping from ice
            this.iceJumpTimer = 0;

            // Store current horizontal velocity as ice inertia
            this.iceInertia = this.velX;
        }

        // Continue with normal jump logic
        const absVelX = Math.abs(this.velX);
        if (absVelX > 3) {
            this.jumpAngled = true;
            this.jumpDirection = this.velX > 0 ? 1 : -1;

            // Calculate horizontal boost based on current speed
            const horizontalBoost = Math.min(absVelX * this.horizontalJumpFactor, this.maxSpeed * 0.5);

            // Apply horizontal boost in the direction of movement
            if (this.velX > 0) {
                this.velX += horizontalBoost;
            } else {
                this.velX -= horizontalBoost;
            }

            // When moving fast, especially on ice, reduce the upward component slightly
            // to create a more angled jump
            if (this.onIce && absVelX > 8) {
                this.velY *= 0.85; // Make the jump more horizontal by reducing vertical velocity
            }
        } else {
            // Normal vertical jump
            this.jumpAngled = false;
            this.jumpDirection = 0;
        }

        // Create jump particles
        this.createParticleEffect(particles, PARTICLE_TYPES.JUMP);

        // Play jump sound
        audioManager.playSound('jump');
    }

    // Calculate acceleration based on surface
    // Using ice acceleration multiplier constant directly
    const acceleration = this.onIce || (this.wasOnIce && !this.grounded && this.iceJumpTimer < this.iceJumpDuration)
        ? ICE_ACCELERATION_MULTIPLIER : 1.0;

    // Handle left/right movement - Apply the actual MOVE_SPEED directly
    const moveAmount = MOVE_SPEED / 10; // Base movement force (scaled down for better control)

    if (keys['ArrowRight']) {
        let moveForce = moveAmount * timeScale * acceleration;

        // Apply extra force when on ice to help overcome low friction
        if (this.onIce || (this.wasOnIce && !this.grounded)) {
            moveForce *= 1.5; // Increased for better responsiveness
        }

        if (this.velX < this.maxSpeed) {
            this.velX += moveForce;
        }
        this.facingRight = true;
    }

    if (keys['ArrowLeft']) {
        let moveForce = moveAmount * timeScale * acceleration;

        // Apply extra force when on ice to help overcome low friction
        if (this.onIce || (this.wasOnIce && !this.grounded)) {
            moveForce *= 1.5; // Increased for better responsiveness
        }

        if (this.velX > -this.maxSpeed) {
            this.velX -= moveForce;
        }
        this.facingRight = false;
    }
}

    /**
     * Handle movement and collisions
     */
    handleMovement(level, timeScale) {
        this.grounded = false;

        // Horizontal movement
        this.x += this.velX * timeScale;
        this.checkHorizontalCollisions(level);

        // Vertical movement
        this.y += this.velY * timeScale;
        this.checkVerticalCollisions(level);

        // Check if player fell off the map
        if (this.y > CANVAS_HEIGHT) {
            this.alive = false;
            gameManager.handlePlayerDeath();
        }
    }

    /**
     * Check for landing effects
     */
    checkLandingEffects(particles) {
        if (!this.lastGrounded && this.grounded) {
            // Reset jump-related properties on landing
            this.jumpAngled = false;
            this.jumpDirection = 0;
            this.jumping = false;

            // Create landing particles proportional to falling speed
            const particleCount = Math.min(Math.abs(this.velY) / 3, 5);
            for (let i = 0; i < particleCount; i++) {
                this.createParticleEffect(particles, PARTICLE_TYPES.LAND);
            }
        }
        this.lastGrounded = this.grounded;
    }

    /**
     * Check horizontal collisions with tiles
     */
    /**
 * Check vertical collisions with tiles
 */
   checkHorizontalCollisions(level) {
        // Only check tiles in the vicinity of the player
        const startX = Math.max(0, Math.floor((this.x - TILE_SIZE) / TILE_SIZE));
        const endX = Math.min(level[0].length - 1, Math.floor((this.x + this.width + TILE_SIZE) / TILE_SIZE));
        const startY = Math.max(0, Math.floor((this.y - TILE_SIZE) / TILE_SIZE));
        const endY = Math.min(level.length - 1, Math.floor((this.y + this.height + TILE_SIZE) / TILE_SIZE));

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (level[y][x] !== 0) {
                    const tileType = TILE_TYPES[level[y][x]];

                    if (tileType && tileType.solid) {
                        // Skip collision resolution for goal tiles
                        if (level[y][x] === 3) continue;

                        const tileX = x * TILE_SIZE;
                        const tileY = y * TILE_SIZE;

                        // Check horizontal collision
                        if (
                            this.x < tileX + TILE_SIZE &&
                            this.x + this.width > tileX &&
                            this.y < tileY + TILE_SIZE &&
                            this.y + this.height > tileY
                        ) {
                            // Colliding horizontally, move player back
                            if (this.velX > 0) {
                                this.x = tileX - this.width;
                            } else if (this.velX < 0) {
                                this.x = tileX + TILE_SIZE;
                            }
                            this.velX = 0;
                        }
                    }
                }
            }
        }
    }

    /**
     * Check vertical collisions with tiles
     */
    checkVerticalCollisions(level) {
        // Only check tiles in the vicinity of the player
        const startX = Math.max(0, Math.floor((this.x - TILE_SIZE) / TILE_SIZE));
        const endX = Math.min(level[0].length - 1, Math.floor((this.x + this.width + TILE_SIZE) / TILE_SIZE));
        const startY = Math.max(0, Math.floor((this.y - TILE_SIZE) / TILE_SIZE));
        const endY = Math.min(level.length - 1, Math.floor((this.y + this.height + TILE_SIZE) / TILE_SIZE));

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (level[y][x] !== 0) {
                    const tileType = TILE_TYPES[level[y][x]];

                    if (tileType) {
                        const tileX = x * TILE_SIZE;
                        const tileY = y * TILE_SIZE;

                        // Check collision
                        if (
                            this.x < tileX + TILE_SIZE &&
                            this.x + this.width > tileX &&
                            this.y < tileY + TILE_SIZE &&
                            this.y + this.height > tileY
                        ) {
                            // Check if deadly (spike)
                            if (tileType.deadly) {
                                this.alive = false;
                                gameManager.handlePlayerDeath();
                                return;
                            }

                            // IMPORTANT: Don't treat goal tiles as solid for collision purposes
                            // This allows the player to trigger the goal while standing on it
                            if (level[y][x] === 3) { // Goal tile
                                continue;  // Skip collision resolution for goal tiles
                            }

                            // Solid collision
                            if (tileType.solid) {
                                // Calculate penetration depths
                                const fromLeft = this.x + this.width - tileX;
                                const fromRight = tileX + TILE_SIZE - this.x;
                                const fromTop = this.y + this.height - tileY;
                                const fromBottom = tileY + TILE_SIZE - this.y;

                                // Find the smallest penetration
                                const smallest = Math.min(fromLeft, fromRight, fromTop, fromBottom);

                                // Handle the collision based on the smallest penetration
                                if (smallest === fromTop && this.velY > 0) {
                                    // Landing on top
                                    this.y = tileY - this.height;
                                    this.jumpAngled = false;
                                    this.jumping = false;
                                    this.grounded = true;
                                    this.velY = 0;
                                } else if (smallest === fromBottom && this.velY < 0) {
                                    // Hitting ceiling
                                    this.y = tileY + TILE_SIZE;
                                    this.velY = 0;
                                } else if (smallest === fromLeft && fromLeft < fromTop) {
                                    // Coming from left side
                                    this.x = tileX - this.width;
                                    this.velX = 0;
                                } else if (smallest === fromRight && fromRight < fromTop) {
                                    // Coming from right side
                                    this.x = tileX + TILE_SIZE;
                                    this.velX = 0;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    isOnGoal(level) {
        // Get the player's bounding box
        const playerLeft = this.x;
        const playerRight = this.x + this.width;
        const playerTop = this.y;
        const playerBottom = this.y + this.height;

        // Convert to tile coordinates
        const tileLeft = Math.floor(playerLeft / TILE_SIZE);
        const tileRight = Math.floor((playerRight - 0.1) / TILE_SIZE);
        const tileTop = Math.floor(playerTop / TILE_SIZE);
        const tileBottom = Math.floor((playerBottom - 0.1) / TILE_SIZE);

        // Check each tile the player is touching
        for (let y = tileTop; y <= tileBottom; y++) {
            for (let x = tileLeft; x <= tileRight; x++) {
                // Make sure we're within level bounds
                if (y >= 0 && y < level.length && x >= 0 && x < level[y].length) {
                    // Check if this tile is a goal (type 3)
                    if (level[y][x] === 3) {
                        // Calculate the overlap with the goal tile
                        const tileX = x * TILE_SIZE;
                        const tileY = y * TILE_SIZE;

                        const overlapX = Math.min(playerRight, tileX + TILE_SIZE) - Math.max(playerLeft, tileX);
                        const overlapY = Math.min(playerBottom, tileY + TILE_SIZE) - Math.max(playerTop, tileY);

                        // Only require any overlap at all, not a significant one
                        if (overlapX > 0 && overlapY > 0) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Start celebration animation when reaching goal
     */
    startCelebration() {
        this.celebrating = true;
        this.celebrationStart = performance.now();
    }

    /**
     * Create special goal particles
     */
    createGoalParticles(particles) {
        if (!particles) return;
        this.createParticleEffect(particles, PARTICLE_TYPES.GOAL);
    }

    /**
     * Create particle effects (jump, land, etc.)
     */
    createParticleEffect(particles, particleType) {
        if (!particles) return;

        const count = particleType.count;

        for (let i = 0; i < count; i++) {
            // Random angle for particle direction
            const angle = Math.random() * Math.PI * 2;

            // Random values for variety
            const speed = Math.random() * particleType.speed;
            const size = particleType.size[0] + Math.random() * (particleType.size[1] - particleType.size[0]);
            const lifetime = particleType.lifetime[0] + Math.random() * (particleType.lifetime[1] - particleType.lifetime[0]);

            // Add the particle
            particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                size: size,
                color: particleType.color,
                velX: Math.cos(angle) * speed,
                velY: Math.sin(angle) * speed,
                gravity: particleType.gravity,
                life: lifetime
            });
        }
    }


    /**
     * Update animation for walking
     */
    updateAnimation(timeScale) {
        if (Math.abs(this.velX) > 0.5) {
            this.animationTimer += timeScale;
            if (this.animationTimer >= 0) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
}