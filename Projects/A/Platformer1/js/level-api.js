// level-api.js - API wrapper for level operations
class LevelAPI {
    constructor() {
        this.collection = 'levels';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Save a level to the database
     */
    async saveLevel(levelData) {
        try {
            const level = {
                name: levelData.name,
                author: levelData.author || 'Anonymous',
                authorId: levelData.authorId || null,
                // Convert grid to JSON string to avoid nested array issue
                grid: JSON.stringify(levelData.grid),
                startPosition: levelData.startPosition || { x: 1, y: 12 },
                // Also convert spikeRotations if it exists
                spikeRotations: levelData.spikeRotations ? JSON.stringify(levelData.spikeRotations) : null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                plays: 0,
                completions: 0,
                rating: 0,
                ratingCount: 0,
                difficulty: levelData.difficulty || 'medium',
                tags: levelData.tags || [],
                isPublic: levelData.isPublic !== false,
                version: 1
            };

            const docRef = await db.collection(this.collection).add(level);
            return { id: docRef.id, ...level };
        } catch (error) {
            console.error('Error saving level:', error);
            throw error;
        }
    }
    /**
     * Get a single level by ID
     */
/**
     * Get a single level by ID
     */
    async getLevel(levelId) {
        try {
            // Check cache first
            if (this.cache.has(levelId)) {
                const cached = this.cache.get(levelId);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const doc = await db.collection(this.collection).doc(levelId).get();
            if (!doc.exists) {
                throw new Error('Level not found');
            }

            const levelData = { id: doc.id, ...doc.data() };

            // Parse grid back from JSON string
            if (typeof levelData.grid === 'string') {
                levelData.grid = JSON.parse(levelData.grid);
            }

            // Parse spikeRotations if it exists
            if (levelData.spikeRotations && typeof levelData.spikeRotations === 'string') {
                levelData.spikeRotations = JSON.parse(levelData.spikeRotations);
            }

            // Cache the result
            this.cache.set(levelId, {
                data: levelData,
                timestamp: Date.now()
            });

            // Increment play count
            await this.incrementPlays(levelId);

            return levelData;
        } catch (error) {
            console.error('Error getting level:', error);
            throw error;
        }
    }
    /**
     * Get all public levels with pagination
     */
    async getLevels(options = {}) {
        const {
            limit = 20,
            orderBy = 'createdAt',
            orderDirection = 'desc',
            startAfter = null,
            filters = {}
        } = options;

        try {
            let query = db.collection(this.collection)
                .where('isPublic', '==', true);

            // Apply filters
            if (filters.difficulty) {
                query = query.where('difficulty', '==', filters.difficulty);
            }
            if (filters.author) {
                query = query.where('author', '==', filters.author);
            }
            if (filters.minRating) {
                query = query.where('rating', '>=', filters.minRating);
            }

            // Apply ordering
            query = query.orderBy(orderBy, orderDirection);

            // Apply pagination
            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            const snapshot = await query.get();
            const levels = [];

            snapshot.forEach(doc => {
                levels.push({ id: doc.id, ...doc.data() });
            });

            return {
                levels,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
                hasMore: snapshot.docs.length === limit
            };
        } catch (error) {
            console.error('Error getting levels:', error);
            throw error;
        }
    }

    /**
     * Get featured levels (most played, highest rated, etc.)
     */
    async getFeaturedLevels() {
        try {
            const [popular, topRated, recent] = await Promise.all([
                // Most played
                db.collection(this.collection)
                    .where('isPublic', '==', true)
                    .orderBy('plays', 'desc')
                    .limit(5)
                    .get(),

                // Highest rated
                db.collection(this.collection)
                    .where('isPublic', '==', true)
                    .where('ratingCount', '>=', 5)
                    .orderBy('rating', 'desc')
                    .limit(5)
                    .get(),

                // Recent
                db.collection(this.collection)
                    .where('isPublic', '==', true)
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get()
            ]);

            return {
                popular: this.snapshotToArray(popular),
                topRated: this.snapshotToArray(topRated),
                recent: this.snapshotToArray(recent)
            };
        } catch (error) {
            console.error('Error getting featured levels:', error);
            throw error;
        }
    }

    /**
     * Update a level
     */
/**
     * Update a level
     */
    async updateLevel(levelId, updates) {
        try {
            const allowedUpdates = ['name', 'grid', 'startPosition', 'spikeRotations',
                                   'difficulty', 'tags', 'isPublic'];

            const filteredUpdates = {};
            for (const key of allowedUpdates) {
                if (updates.hasOwnProperty(key)) {
                    // Convert grid and spikeRotations to JSON strings
                    if (key === 'grid' && Array.isArray(updates[key])) {
                        filteredUpdates[key] = JSON.stringify(updates[key]);
                    } else if (key === 'spikeRotations' && updates[key]) {
                        filteredUpdates[key] = JSON.stringify(updates[key]);
                    } else {
                        filteredUpdates[key] = updates[key];
                    }
                }
            }

            filteredUpdates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            filteredUpdates.version = firebase.firestore.FieldValue.increment(1);

            await db.collection(this.collection).doc(levelId).update(filteredUpdates);

            // Clear cache
            this.cache.delete(levelId);

            return { id: levelId, ...filteredUpdates };
        } catch (error) {
            console.error('Error updating level:', error);
            throw error;
        }
    }
    /**
     * Delete a level
     */
    async deleteLevel(levelId) {
        try {
            await db.collection(this.collection).doc(levelId).delete();
            this.cache.delete(levelId);
            return true;
        } catch (error) {
            console.error('Error deleting level:', error);
            throw error;
        }
    }

    /**
     * Rate a level
     */
    async rateLevel(levelId, rating, userId) {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        try {
            // Check if user already rated
            const ratingDoc = await db.collection('ratings')
                .where('levelId', '==', levelId)
                .where('userId', '==', userId)
                .get();

            if (!ratingDoc.empty) {
                throw new Error('You have already rated this level');
            }

            // Add rating
            await db.collection('ratings').add({
                levelId,
                userId,
                rating,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update level rating
            const levelRef = db.collection(this.collection).doc(levelId);
            await db.runTransaction(async (transaction) => {
                const levelDoc = await transaction.get(levelRef);
                if (!levelDoc.exists) {
                    throw new Error('Level not found');
                }

                const data = levelDoc.data();
                const currentRating = data.rating || 0;
                const currentCount = data.ratingCount || 0;

                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                transaction.update(levelRef, {
                    rating: newRating,
                    ratingCount: newCount
                });
            });

            this.cache.delete(levelId);
            return true;
        } catch (error) {
            console.error('Error rating level:', error);
            throw error;
        }
    }

    /**
     * Record level completion
     */
    async recordCompletion(levelId, completionData) {
        try {
            // Add completion record
            await db.collection('completions').add({
                levelId,
                userId: completionData.userId || 'anonymous',
                time: completionData.time,
                deaths: completionData.deaths,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update level stats
            await db.collection(this.collection).doc(levelId).update({
                completions: firebase.firestore.FieldValue.increment(1)
            });

            this.cache.delete(levelId);
            return true;
        } catch (error) {
            console.error('Error recording completion:', error);
            throw error;
        }
    }

    /**
     * Search levels by name or author
     */
    async searchLevels(searchTerm, limit = 20) {
        try {
            // Note: Firestore doesn't support full-text search natively
            // This is a simple implementation. For better search, use Algolia or ElasticSearch
            const results = await db.collection(this.collection)
                .where('isPublic', '==', true)
                .orderBy('name')
                .startAt(searchTerm)
                .endAt(searchTerm + '\uf8ff')
                .limit(limit)
                .get();

            return this.snapshotToArray(results);
        } catch (error) {
            console.error('Error searching levels:', error);
            throw error;
        }
    }

    // Helper methods
    // Helper methods
    snapshotToArray(snapshot) {
        const array = [];
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };

            // Parse grid if it's a string
            if (typeof data.grid === 'string') {
                data.grid = JSON.parse(data.grid);
            }

            // Parse spikeRotations if it exists and is a string
            if (data.spikeRotations && typeof data.spikeRotations === 'string') {
                data.spikeRotations = JSON.parse(data.spikeRotations);
            }

            array.push(data);
        });
        return array;
    }

    async incrementPlays(levelId) {
        try {
            await db.collection(this.collection).doc(levelId).update({
                plays: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing plays:', error);
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const levelAPI = new LevelAPI();

// Export for use in other modules
window.levelAPI = levelAPI;