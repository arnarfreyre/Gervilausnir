/**
 * Audio Manager for handling all game sounds
 */
class AudioManager {
    constructor() {
        this.sounds = {
            jump: document.getElementById('jumpSound'),
            death: document.getElementById('deathSound'),
            levelComplete: document.getElementById('completeSound'),
            bgMusic: document.getElementById('bgMusic')
        };

        this.settings = {
            musicVolume: 50,
            sfxVolume: 70
        };

        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;

        // Set initial volumes
        this.updateVolumes();
        this.isInitialized = true;
    }

    updateVolumes() {
        // Convert percentage to 0-1 range
        const musicVol = this.settings.musicVolume / 100;
        const sfxVol = this.settings.sfxVolume / 400;

        // Set background music volume
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.volume = musicVol;
        }

        // Set SFX volumes
        if (this.sounds.jump) this.sounds.jump.volume = sfxVol;
        if (this.sounds.death) this.sounds.death.volume = sfxVol;
        if (this.sounds.levelComplete) this.sounds.levelComplete.volume = sfxVol;
    }

    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to beginning if it's already playing
            sound.currentTime = 0;
            sound.play().catch(e => {
                // Handle auto-play restrictions by not reporting error
                // Most browsers require user interaction before playing audio
                console.log("Audio playback prevented:", e);
            });
        }
    }

    stopSound(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    playMusic() {
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.play().catch(e => {
                // Handle auto-play restrictions
                console.log("Music playback prevented:", e);
            });
        }
    }

    pauseMusic() {
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.pause();
        }
    }

    restartMusic() {
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.currentTime = 0;
            this.playMusic();
        }
    }

    updateSettings(newSettings) {
        if (newSettings.musicVolume !== undefined) {
            this.settings.musicVolume = newSettings.musicVolume;
        }

        if (newSettings.sfxVolume !== undefined) {
            this.settings.sfxVolume = newSettings.sfxVolume;
        }

        this.updateVolumes();
    }
}

// Create and export the audio manager
const audioManager = new AudioManager();
export { audioManager };