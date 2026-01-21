/**
 * MusicController
 *
 * Manages background music playback and notification system.
 */

import { ComponentBase } from '../core/ComponentBase.js';
import { eventBus } from '../core/EventBus.js';

export class MusicController extends ComponentBase {
    constructor(options = {}) {
        super('MusicController', options);
        
        // Music state
        this.isPlaying = false;
        this.hasStarted = false;
        this.userToggled = false; // track if user pressed soundControl
        this.audio = null;
        this.soundControl = null;
        this.musicNotification = null;
        this.fadeVolume = 0.15;
        this.fadeInterval = null;
        this.fadeAnimationId = null;
        this.bubbleShown = false;
        this.notificationTimeout = null;

        // Notification queue system
        this.notificationQueue = [];
        this.isShowingNotification = false;
        this.notificationTransitioning = false;
        
        // Audio analysis for reactive soundbars
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.animationFrame = null;
        
        // Song tracking
        this.songList = [
            { time: 0, title: "Pokémon Center", game: "Pokemon Red/Blue" },
            { time: 174, title: "Emotion (An Unwavering Heart)", game: "Pokemon Black/White" },
            { time: 311, title: "Route 209", game: "Pokemon Diamond/Pearl" },
            { time: 479, title: "New Bark Town", game: "Pokemon Gold/Silver/Crystal" },
            { time: 611, title: "Accumula Town", game: "Pokemon Black/White" },
            { time: 809, title: "Nuvema Town", game: "Pokémon Black/White" },
            { time: 961, title: "Eterna City", game: "Pokemon Diamond/Pearl" },
            { time: 1105, title: "Ecruteak / Cianwood City", game: "Pokemon Gold/Silver/Crystal" },
            { time: 1284, title: "Village Bridge", game: "Pokemon Black/White" },
            { time: 1442, title: "Soaring Illusions", game: "Pokemon Omega Ruby/Alpha Sapphire" },
            { time: 1570, title: "Jubilife Village", game: "Pokemon Legends: Arceus" },
            { time: 1708, title: "Field (Midnight)", game: "Pokemon Legends: Arceus" },
            { time: 1838, title: "South Province", game: "Pokemon Scarlet/Violet" },
            { time: 2046, title: "Lavender Town", game: "Pokemon Gold/Silver/Crystal" },
            { time: 2258, title: "Pokémon League", game: "Pokemon Diamond/Pearl" },
            { time: 2424, title: "Littleroot Town", game: "Pokemon Ruby/Sapphire/Emerald" },
            { time: 2563, title: "Undella Town", game: "Pokemon Black/White" },
            { time: 2730, title: "Surf Theme", game: "Pokemon Gold/Silver/Crystal" },
            { time: 2941, title: "Floaroma Town", game: "Pokemon Diamond/Pearl" },
            { time: 3113, title: "Pallet Town", game: "Pokemon Red/Blue" },
            { time: 3268, title: "Legends Arceus", game: "Pokemon Legends: Arceus" },
            { time: 3449, title: "Lillie's Theme", game: "Pokemon Sun/Moon" },
            { time: 3661, title: "Azalea Town", game: "Pokemon Gold/Silver/Crystal" },
            { time: 3853, title: "Twinleaf Town", game: "Pokemon Diamond/Pearl" },
            { time: 4024, title: "National Park", game: "Pokemon Gold/Silver/Crystal" },
            { time: 4216, title: "Route 104", game: "Pokemon Ruby/Sapphire/Emerald" },
            { time: 4408, title: "Viridian / Pewter / Saffron City", game: "Pokemon Gold/Silver/Crystal" }
        ];
        
        this.currentSongIndex = 0;
        this.trackingInterval = null;
        this.lastSongShown = null;
        this.randomStartTime = 0;
    }

    /**
     * Get default configuration options
     */
    getDefaultOptions() {
        return {
            debug: false,
            musicPath: './assets/music.mp3',
            fadeVolume: 0.15,
            autoShowDelay: 2000,
            autoHideDelay: 5000
        };
    }

    /**
     * Initialize DOM element references
     */
    async initElements() {
        this.soundControl = document.getElementById("soundControl");
        this.musicNotification = document.getElementById("musicNotification");
        
        if (!this.soundControl) {
            throw new Error('Sound control element not found');
        }
        
        if (!this.musicNotification) {
            throw new Error('Music notification element not found');
        }
    }

    /**
     * Initialize component state
     */
    async initState() {
        this.initAudio();
        this.fadeVolume = this.options.fadeVolume;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    /**
     * Initialize event listeners
     */
    async initEvents() {
        this.setupControlListener();
        this.setupBubbleAnimation();

        // Removed auto-start on scroll - music only starts when user clicks
    }

    /**
     * Initialize audio
     */
    initAudio() {
        this.audio = new Audio(this.options.musicPath);
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.preload = 'auto'; // Preload audio for instant playback
        this.isPlaying = false;
        this.soundControl.classList.remove("playing");

        // Disable media session and background playback controls
        this.disableMediaSession();

        // Setup audio analysis for reactive soundbars
        this.setupAudioAnalysis();

    }

    /**
     * Disable media session and background playback
     */
    disableMediaSession() {
        // Disable media session controls completely
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('stop', null);
            navigator.mediaSession.setActionHandler('seekbackward', null);
            navigator.mediaSession.setActionHandler('seekforward', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
        }
        
        // Add event listeners to pause when page loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.fadeOut(true); // Instant stop when page hidden
            }
        });
        
        // Pause when window loses focus
        window.addEventListener('blur', () => {
            if (this.isPlaying) {
                this.fadeOut(true); // Instant stop when window loses focus
            }
        });
        
        // Add graceful fade out when track ends naturally
        this.audio.addEventListener('ended', () => {
            if (this.isPlaying) {
                this.fadeOut();
            }
        });
    }

    /**
     * Setup Web Audio API for frequency analysis
     */
    setupAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024; // Even higher resolution for better frequency separation
            this.analyser.smoothingTimeConstant = 0.1; // Minimal smoothing for maximum responsiveness
            
            const source = this.audioContext.createMediaElementSource(this.audio);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
        } catch (error) {
            // Audio analysis setup failed - fallback to static animation
        }
    }

    /**
     * Start reactive soundbar animation
     */
    startReactiveSoundbars() {
        if (!this.analyser || !this.isPlaying) return;
        
        // Add reactive class to disable static CSS animation
        this.soundControl.classList.add('reactive');
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            const bars = this.soundControl.querySelectorAll('.sound-bar');
            if (bars.length === 4) {
                const totalBins = this.dataArray.length; // Should be 512 with fftSize 1024
                
                // Highly reactive frequency ranges - dramatic variations
                const frequencyRanges = [
                    { start: 1, end: 12, name: 'Bass', sensitivity: 1.2 },      // Deep bass - very reactive
                    { start: 12, end: 40, name: 'Mid-Bass', sensitivity: 1.4 }, // Mid bass - highly reactive
                    { start: 40, end: 100, name: 'Midrange', sensitivity: 1.6 }, // Midrange - extremely reactive
                    { start: 100, end: 200, name: 'Treble', sensitivity: 1.8 }  // Treble - maximum reactivity
                ];
                
                // Gentle overall scaling without extreme peaks
                let avgFrequency = 0;
                let sampleCount = 0;
                for (let i = 1; i < Math.min(200, totalBins); i++) {
                    avgFrequency += this.dataArray[i];
                    sampleCount++;
                }
                avgFrequency = sampleCount > 0 ? avgFrequency / sampleCount : 0;
                const globalMultiplier = Math.min(2.0, 1.0 + (avgFrequency / 255) * 1.0); // Dramatic boost for maximum reactivity
                
                bars.forEach((bar, index) => {
                    const range = frequencyRanges[index];
                    
                    // Get frequency data for this range with peak detection
                    let sum = 0;
                    let peak = 0;
                    let count = 0;
                    for (let i = range.start; i < Math.min(range.end, totalBins); i++) {
                        const value = this.dataArray[i];
                        sum += value;
                        peak = Math.max(peak, value);
                        count++;
                    }
                    const average = count > 0 ? sum / count : 0;
                    
                    // Use average for smoother, more balanced response
                    const smoothValue = average;
                    
                    // Apply gentle sensitivity per frequency range
                    const sensitivity = range.sensitivity * globalMultiplier;
                    const normalized = Math.min(1, (smoothValue / 255) * sensitivity);
                    
                    // Gentle curve that prevents extreme heights
                    const curved = Math.pow(normalized, 0.6);
                    
                    // Add gentle baseline animation for visual appeal
                    const time = Date.now() * 0.001;
                    const baselinePhase = time * 1.2 + (index * Math.PI / 2);
                    const gentleBaseline = 0.2 + 0.1 * Math.sin(baselinePhase);
                    
                    // Combine music data with baseline, keeping it balanced
                    const final = Math.max(curved * 0.8 + gentleBaseline * 0.2, gentleBaseline);
                    
                    // Convert to height with much larger range (4px to 28px) for dramatic variation
                    const height = Math.max(4, Math.min(28, final * 24 + 4));
                    
                    bar.style.height = `${height}px`;
                    
                });
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * Stop reactive soundbar animation
     */
    stopReactiveSoundbars() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Remove reactive class to re-enable static CSS animation
        if (this.soundControl) {
            this.soundControl.classList.remove('reactive');
        }
        
        // Reset bars to default heights
        const bars = this.soundControl.querySelectorAll('.sound-bar');
        bars.forEach(bar => {
            bar.style.height = '';
        });
    }

    /**
     * Setup control listener
     */
    setupControlListener() {
        this.soundControl.addEventListener("click", () => {
            this.userToggled = true; // Mark manual override

            // Clear notification queue and hide current notification
            this.notificationQueue = [];
            this.hideNotification();

            this.toggleMusic(true);
        });
    }

    /**
     * Setup bubble animation
     */
    setupBubbleAnimation() {
        // Show notification after 2 seconds
        setTimeout(() => {
            if (!this.userToggled && !this.bubbleShown) {
                this.showNotification();
                
                // Hide automatically after 5 seconds of being visible
                setTimeout(() => {
                    if (!this.userToggled) {
                        this.hideNotification();
                    }
                }, this.options.autoHideDelay);
            }
        }, this.options.autoShowDelay);
    }

    /**
     * Show notification - initial prompt
     */
    showNotification() {
        if (this.bubbleShown) return;
        this.bubbleShown = true;

        // Mark as showing
        this.isShowingNotification = true;
        this.notificationTransitioning = true;

        // Ensure clean state
        this.musicNotification.classList.remove("fade-out", "bounce");

        // Use requestAnimationFrame for smooth animation
        requestAnimationFrame(() => {
            this.musicNotification.classList.add("show");

            // Transition complete after animation (wait for full 0.5s transition)
            setTimeout(() => {
                this.notificationTransitioning = false;

                // Add very subtle bounce AFTER scale transition completes
                this.musicNotification.classList.add("bounce");
                setTimeout(() => {
                    this.musicNotification.classList.remove("bounce");
                }, 500);
            }, 550); // Wait for scale transition to fully complete (0.5s + buffer)
        });
    }

    /**
     * Hide notification
     */
    hideNotification() {
        if (!this.musicNotification.classList.contains("show")) return;

        // Clear any pending timeout to prevent premature hiding
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }

        // Mark as transitioning
        this.notificationTransitioning = true;

        // Add fade-out animation
        this.musicNotification.classList.add("fade-out");
        this.musicNotification.classList.remove("show", "bounce");

        // After fade-out completes, clean up and process next notification
        setTimeout(() => {
            this.musicNotification.classList.remove("fade-out");
            this.isShowingNotification = false;
            this.notificationTransitioning = false;

            // Process next notification in queue if any
            setTimeout(() => {
                this.processNotificationQueue();
            }, 400); // Gentle delay before showing next notification
        }, 600); // Match CSS fade-out duration + buffer
    }


    /**
     * Toggle music
     */
    toggleMusic(userTriggered = false) {
        if (this.isPlaying) {
            // Instant stop when user manually stops music
            this.fadeOut(true);
        } else {
            this.fadeIn();
        }
    }

    /**
     * Fade in music - TRULY responsive with actual ramping
     */
    fadeIn() {
        // Clear any existing fades
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        // INSTANT visual feedback - no delays
        this.isPlaying = true;
        this.soundControl.classList.add("playing");

        // Only randomize on first play - always start at beginning of a song
        if (!this.hasStarted) {
            this.hasStarted = true;
            // Pick a random song from the list
            const randomSongIndex = Math.floor(Math.random() * this.songList.length);
            const randomSong = this.songList[randomSongIndex];
            // Start at the beginning of that song
            this.audio.currentTime = randomSong.time;
            this.randomStartTime = randomSong.time;
        }
        // On subsequent plays, resume from current position (no change to currentTime)

        // CRITICAL: Volume MUST be 0 and stay 0 until fade starts
        this.audio.volume = 0;
        
        // Start playing SILENTLY (volume = 0)
        this.audio.play().then(() => {
            this.startSongTracking();
            this.startReactiveSoundbars();
            
            // Resume audio context if needed
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // ACTUAL FADE: Start immediately after audio begins
            let currentVolume = 0;
            const targetVolume = this.fadeVolume;
            const totalSteps = 40; // More steps for smoother fade
            let stepCount = 0;
            
            this.fadeInterval = setInterval(() => {
                stepCount++;
                // Linear volume increase from 0 to target
                currentVolume = (stepCount / totalSteps) * targetVolume;
                
                if (stepCount >= totalSteps) {
                    // Final step - ensure exact target volume
                    this.audio.volume = targetVolume;
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                } else {
                    // Gradual volume increase
                    this.audio.volume = currentVolume;
                }
            }, 25); // 25ms intervals = 1 second total fade (40 * 25ms = 1000ms)
            
            eventBus.emit('music:started', { currentTime: this.randomStartTime });
            
        }).catch((error) => {
            this.warn('Failed to start audio:', error);
            // Reset state if play fails
            this.isPlaying = false;
            this.soundControl.classList.remove("playing");
        });
    }

    /**
     * Fade out music - Cross-browser bulletproof
     */
    fadeOut(instant = false) {
        // Clear any existing fades
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        
        // CRITICAL: Set visual state immediately for instant feedback
        this.isPlaying = false;
        this.soundControl.classList.remove("playing");
        this.stopSongTracking();
        this.stopReactiveSoundbars();
        this.hideNotification();
        
        if (instant) {
            // Instant stop for window focus/blur events
            this.audio.pause();
            this.audio.volume = 0;
            eventBus.emit('music:stopped');
        } else {
            // BULLETPROOF fade out using setInterval (same approach as fadeIn)
            const startVolume = this.audio.volume || this.fadeVolume;
            const targetVolume = 0;
            const fadeStep = startVolume / 24; // 24 steps over 1.2 seconds = 50ms intervals
            let stepCount = 0;
            const maxSteps = 24;
            
            this.fadeInterval = setInterval(() => {
                stepCount++;
                const currentVolume = startVolume * (1 - (stepCount / maxSteps));
                
                // Ensure we reach zero and don't go negative
                if (currentVolume <= 0 || stepCount >= maxSteps) {
                    // Final step - pause and cleanup
                    this.audio.pause();
                    this.audio.volume = 0;
                    clearInterval(this.fadeInterval);
                    this.fadeInterval = null;
                    eventBus.emit('music:stopped');
                } else {
                    // Set volume with browser compatibility
                    try {
                        this.audio.volume = Math.max(currentVolume, 0);
                    } catch (e) {
                        // Browser compatibility fallback
                        this.audio.pause();
                        this.audio.volume = 0;
                        clearInterval(this.fadeInterval);
                        this.fadeInterval = null;
                        eventBus.emit('music:stopped');
                    }
                }
            }, 50); // 50ms intervals for smooth fade, same as fadeIn
        }
    }

    /**
     * Start song tracking
     */
    startSongTracking() {
        this.trackingInterval = setInterval(() => {
            this.checkCurrentSong();
        }, 1000); // Check every second
    }

    /**
     * Stop song tracking
     */
    stopSongTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    /**
     * Check current song
     */
    checkCurrentSong() {
        if (!this.isPlaying || !this.audio) return;
        
        const currentTime = this.audio.currentTime;
        const currentSong = this.getCurrentSong(currentTime);
        
        if (currentSong && currentSong !== this.lastSongShown) {
            this.showNowPlaying(currentSong);
            this.lastSongShown = currentSong;
            
        }
    }

    /**
     * Get current song based on time
     */
    getCurrentSong(currentTime) {
        for (let i = this.songList.length - 1; i >= 0; i--) {
            if (currentTime >= this.songList[i].time) {
                return this.songList[i];
            }
        }
        return this.songList[0];
    }


    /**
     * Show now playing notification - queued system
     */
    showNowPlaying(song) {
        // Add to queue
        this.notificationQueue.push({
            title: 'Now Playing ♪',
            text: `${song.title} (${song.game})`,
            duration: 6000
        });

        // Process queue if not already showing a notification
        this.processNotificationQueue();
    }

    /**
     * Process notification queue - shows notifications one at a time
     */
    processNotificationQueue() {
        // Don't start a new notification if one is showing or transitioning
        if (this.isShowingNotification || this.notificationTransitioning) {
            return;
        }

        // Check if there's anything in the queue
        if (this.notificationQueue.length === 0) {
            return;
        }

        // Get next notification from queue
        const notification = this.notificationQueue.shift();
        const element = this.musicNotification;
        const titleElement = element.querySelector('.notification-title');
        const textElement = element.querySelector('.notification-text');

        // Update content
        titleElement.textContent = notification.title;
        textElement.textContent = notification.text;

        // Mark as showing and transitioning
        this.isShowingNotification = true;
        this.notificationTransitioning = true;

        // Animate in
        this.animateNotificationIn(element, notification.duration);
    }
    
    /**
     * Helper method to animate notification in
     */
    animateNotificationIn(notification, duration = 6000) {
        requestAnimationFrame(() => {
            notification.classList.add('show');

            // Transition complete after animation (wait for full 0.5s transition)
            setTimeout(() => {
                this.notificationTransitioning = false;

                // Add very subtle bounce AFTER scale transition completes
                notification.classList.add('bounce');
                setTimeout(() => {
                    notification.classList.remove('bounce');
                }, 500);
            }, 550); // Wait for scale transition to fully complete (0.5s + buffer)

            // Auto-hide after specified duration with smooth fade-out
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, duration);
        });
    }

    /**
     * Reset notification to default
     */
    resetNotificationToDefault() {
        const notification = this.musicNotification;
        const titleElement = notification.querySelector('.notification-title');
        const textElement = notification.querySelector('.notification-text');
        
        titleElement.textContent = 'Music Assistant';
        textElement.textContent = 'Click for some jazzy background vibes! 🎷';
    }

    /**
     * Get current music state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            hasStarted: this.hasStarted,
            userToggled: this.userToggled,
            currentTime: this.audio ? this.audio.currentTime : 0,
            volume: this.audio ? this.audio.volume : 0,
            currentSong: this.audio ? this.getCurrentSong(this.audio.currentTime) : null
        };
    }

    /**
     * Clean up component state
     */
    cleanupState() {
        // Stop tracking
        this.stopSongTracking();
        
        // Clear fade interval and animation frame
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        if (this.fadeAnimationId) {
            cancelAnimationFrame(this.fadeAnimationId);
            this.fadeAnimationId = null;
        }
        
        // Clear notification timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }

        // Clear notification queue and reset flags
        this.notificationQueue = [];
        this.isShowingNotification = false;
        this.notificationTransitioning = false;

        // Stop reactive soundbars
        this.stopReactiveSoundbars();
        
        // Stop and cleanup audio
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        
        // Cleanup audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Reset state
        this.isPlaying = false;
        this.hasStarted = false;
        this.userToggled = false;
        this.bubbleShown = false;
        this.lastSongShown = null;
        
        // Remove CSS classes
        if (this.soundControl) {
            this.soundControl.classList.remove("playing");
        }
        
        if (this.musicNotification) {
            this.musicNotification.classList.remove("show", "bounce", "fade-out");
        }
        
    }
}