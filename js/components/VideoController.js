/**
 * VideoController
 *
 * 
 * hover effects, custom controls, and fullscreen player.
 *


 */

import { ComponentBase } from '../core/ComponentBase.js';
import { eventBus } from '../core/EventBus.js';

export class VideoController extends ComponentBase {
    constructor(options = {}) {
        super('VideoController', options);
        
        // Video state management - 
        this.videoStates = new Map();
        this.scrubIntervals = new Map();
        this.isExiting = false;
        this.currentFullscreenData = null;
        this.keyboardHandler = null;
    }

    /**
     * Get default configuration options
     */
    getDefaultOptions() {
        return {
            debug: false,
            scrubStep: 0.5,
            scrubInterval: 100
        };
    }

    /**
     * Initialize DOM element references
     */
    async initElements() {
        // Elements will be queried as needed
        this.fullscreenOverlay = document.getElementById('fullscreenOverlay');
        this.fullscreenVideo = document.getElementById('fullscreenVideo');
        this.customVideoControls = document.getElementById('customVideoControls');
    }

    /**
     * Initialize component state
     */
    async initState() {
        this.initializeVideos();
    }

    /**
     * Initialize event listeners
     */
    async initEvents() {
        // Video events are set up in initializeVideos
        
        // Listen for mobile carousel reinitializing
        eventBus.on('video:reinitialize', () => {
            this.initializeVideos();
        });
    }

    /**
     * Initialize all video functionality - 
     */
    initializeVideos() {
        const projectCards = document.querySelectorAll('.project-card, .mobile-project-card');
        
        projectCards.forEach((card, index) => {
            const video = card.querySelector('.project-video');
            const overlay = card.querySelector('.video-overlay');
            const controls = card.querySelector('.video-controls');
            const playIconCircle = card.querySelector('.play-icon-circle');

            if (!video) return;
            const state = {
                isPlaying: false,
                isPaused: true,
                video: video,
                overlay: overlay,
                playIconCircle: playIconCircle,
                wasPlayingBeforeLeave: false,
                isTransitioning: false
            };

            this.videoStates.set(card, state);

            // Set up center play/pause button
            if (playIconCircle) {
                playIconCircle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.togglePlayPause(card);
                });

                playIconCircle.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.togglePlayPause(card);
                });
            }
            
            // Set up hover events for desktop - more robust detection
            card.addEventListener('mouseenter', () => this.handleMouseEnter(card));
            card.addEventListener('mouseleave', (e) => {
                // Only trigger if we're actually leaving the card (not just moving to a child element)
                if (!card.contains(e.relatedTarget)) {
                    this.handleMouseLeave(card);
                }
            });
            
            // Additional fallback: use mouseover/mouseout for more reliable detection
            card.addEventListener('mouseover', (e) => {
                // Only trigger on the card itself or if entering from outside
                if (e.target === card || !card.contains(e.relatedTarget)) {
                    this.handleMouseEnter(card);
                }
            });
            
            card.addEventListener('mouseout', (e) => {
                // Only trigger if actually leaving the card area
                if (!card.contains(e.relatedTarget)) {
                    this.handleMouseLeave(card);
                }
            });
            
            // Set up touch events for mobile
            this.setupMobileTouchEvents(card);
            
            // Set up control events
            const restartBtn = controls.querySelector('.restart-btn');
            const rewindBtn = controls.querySelector('.rewind-btn');
            const forwardBtn = controls.querySelector('.forward-btn');
            const fullscreenBtn = controls.querySelector('.fullscreen-btn');

            restartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.restartVideo(card);
            });
            
            // Hold-to-scrub rewind (mouse and touch)
            rewindBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startScrubbing(card, 'rewind', rewindBtn);
            });
            
            rewindBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this.startScrubbing(card, 'rewind', rewindBtn);
            });
            
            rewindBtn.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                this.stopScrubbing(card, rewindBtn);
            });
            
            rewindBtn.addEventListener('touchend', (e) => {
                e.stopPropagation();
                this.stopScrubbing(card, rewindBtn);
            });
            
            rewindBtn.addEventListener('mouseleave', (e) => {
                this.stopScrubbing(card, rewindBtn);
            });
            
            // Hold-to-scrub forward (mouse and touch)
            forwardBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startScrubbing(card, 'forward', forwardBtn);
            });
            
            forwardBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                this.startScrubbing(card, 'forward', forwardBtn);
            });
            
            forwardBtn.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                this.stopScrubbing(card, forwardBtn);
            });
            
            forwardBtn.addEventListener('touchend', (e) => {
                e.stopPropagation();
                this.stopScrubbing(card, forwardBtn);
            });
            
            forwardBtn.addEventListener('mouseleave', (e) => {
                this.stopScrubbing(card, forwardBtn);
            });
            
            // Fullscreen functionality (mouse and touch)
            fullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.enterFullscreen(card);
            });
            
            fullscreenBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.enterFullscreen(card);
            });
            
            // Prevent native iOS fullscreen on mobile
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
            video.playsInline = true;
            
            // Ensure videos are muted by default (only unmuted in fullscreen)
            video.muted = true;
            
            // Disable native controls and picture-in-picture on mobile
            if (window.innerWidth <= 768) {
                video.controls = false;
                video.setAttribute('disablePictureInPicture', 'true');
                video.disablePictureInPicture = true;
            }
            
            video.addEventListener('ended', () => {
                this.restartVideo(card);
            });
        });
    }

    /**
     * Setup mobile touch events for video cards - ENHANCED for better control interaction
     */
    setupMobileTouchEvents(card) {
        // Enhanced mobile video controls - always visible and functional
        if (window.innerWidth <= 768) {
            const state = this.videoStates.get(card);
            if (!state) return;

            const { video, overlay, playIconCircle } = state;
            const controls = card.querySelector('.video-controls');

            // Make sure controls are always visible on mobile
            if (controls) {
                controls.style.opacity = '1';
                controls.style.pointerEvents = 'auto';
            }

            // Hide overlay on mobile focused cards to ensure controls are accessible
            if (card.classList.contains('mobile-project-card')) {
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none';
                }
            }

            // Enhanced touch event for video container (not on controls)
            const videoContainer = card.querySelector('.project-video-container');
            if (videoContainer) {
                videoContainer.addEventListener('touchend', (e) => {
                    // Only handle if not touching controls or control buttons
                    const isControlElement = e.target.closest('.video-controls') ||
                                           e.target.closest('.video-control-btn');

                    if (!isControlElement) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (state.isPaused) {
                            // Lazy load video if not already loaded
                            if (video.readyState === 0) {
                                video.load();
                            }

                            // Ensure video remains muted for mobile touch playback
                            video.muted = true;

                            // Wait for video to be ready before playing
                            const playWhenReady = () => {
                                video.play()
                                    .then(() => {
                                        state.isPlaying = true;
                                        state.isPaused = false;
                                        // Update play icon
                                        if (playIconCircle) {
                                            playIconCircle.classList.add('playing');
                                        }
                                    })
                                    .catch(console.error);
                            };

                            if (video.readyState >= 3) {
                                playWhenReady();
                            } else {
                                video.addEventListener('canplay', playWhenReady, { once: true });
                            }
                        } else if (state.isPlaying) {
                            video.pause();
                            state.isPlaying = false;
                            state.isPaused = true;
                            // Update play icon
                            if (playIconCircle) {
                                playIconCircle.classList.remove('playing');
                            }
                        }
                    }
                }, { passive: false });
            }
        }
    }

    /**
     * Toggle play/pause for a project card video
     */
    togglePlayPause(card) {
        const state = this.videoStates.get(card);
        if (!state) return;

        const { video, playIconCircle } = state;

        // Ensure video is muted for card videos (not fullscreen)
        video.muted = true;

        if (state.isPaused || video.paused) {
            // Lazy load video if not already loaded
            if (video.readyState === 0) {
                video.load();
            }

            // Play the video when ready
            const playWhenReady = () => {
                video.play()
                    .then(() => {
                        state.isPlaying = true;
                        state.isPaused = false;
                        if (playIconCircle) {
                            playIconCircle.classList.add('playing');
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to play video:', error);
                    });
            };

            if (video.readyState >= 2) {
                playWhenReady();
            } else {
                video.addEventListener('canplay', playWhenReady, { once: true });
            }
        } else {
            // Pause the video
            video.pause();
            state.isPlaying = false;
            state.isPaused = true;
            if (playIconCircle) {
                playIconCircle.classList.remove('playing');
            }
        }
    }

    /**
     * Handle mouse enter event - Start video playback with lazy loading
     */
    handleMouseEnter(card) {
        const state = this.videoStates.get(card);
        if (!state) return;

        const { video, playIconCircle } = state;

        // Prevent overlapping play/pause operations
        if (state.isTransitioning) return;
        state.isTransitioning = true;

        // Lazy load video if not already loaded (preload="none" means readyState is 0)
        if (video.readyState === 0) {
            // Load the video by setting the src (triggers network request)
            video.load();
        }

        // Try to start video playback - be more lenient with readyState
        const tryPlay = () => {
            // Ensure video is muted before playing (unless in fullscreen)
            video.muted = true;

            video.play()
                .then(() => {
                    state.isPlaying = true;
                    state.isPaused = false;
                    state.isTransitioning = false;
                    // Update play icon to show pause
                    if (playIconCircle) {
                        playIconCircle.classList.add('playing');
                    }
                })
                .catch((error) => {
                    // Silently handle AbortError which is normal during rapid interactions
                    if (error.name !== 'AbortError') {
                        console.error('Video play error:', error);
                    }
                    state.isTransitioning = false;
                });
        };

        // Try to play if video has some data loaded (readyState >= 2) or just try anyway
        if (video.readyState >= 2) {
            tryPlay();
        } else {
            // If video isn't ready, wait for it to load enough data
            const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                tryPlay();
            };
            video.addEventListener('canplay', onCanPlay, { once: true });
            // Also try immediately in case the video is actually ready
            tryPlay();
        }
    }

    /**
     * Handle mouse leave event - Stop video playback but remember position
     */
    handleMouseLeave(card) {
        const state = this.videoStates.get(card);
        if (!state) return;

        const { video, playIconCircle } = state;

        // IMMEDIATELY clear any ongoing intervals that might restart playback
        this.clearAllScrubIntervals();

        // Stop all scrub button visual feedback for this card
        const controls = card.querySelector('.video-controls');
        if (controls) {
            const scrubButtons = controls.querySelectorAll('.rewind-btn, .forward-btn');
            scrubButtons.forEach(button => {
                button.style.backgroundColor = '';
            });
        }

        // Force pause video when not hovering (regardless of current state)
        video.pause();
        state.isPlaying = false;
        state.isPaused = true;
        state.wasPlayingBeforeLeave = true;
        state.isTransitioning = false;

        // Update play icon to show play
        if (playIconCircle) {
            playIconCircle.classList.remove('playing');
        }

        // Double-check after a small delay to catch any async play attempts
        setTimeout(() => {
            if (!video.paused) {
                video.pause();
                state.isPlaying = false;
                state.isPaused = true;
                if (playIconCircle) {
                    playIconCircle.classList.remove('playing');
                }
            }
        }, 10);

        // Triple-check after a slightly longer delay for stubborn intervals
        setTimeout(() => {
            if (!video.paused) {
                video.pause();
                this.clearAllScrubIntervals(); // Clear again just in case
                if (playIconCircle) {
                    playIconCircle.classList.remove('playing');
                }
            }
        }, 50);
    }

    /**
     * Restart video from beginning -
     */
    restartVideo(card) {
        const state = this.videoStates.get(card);
        if (!state) return;

        const { video, playIconCircle } = state;
        video.currentTime = 0;

        // Ensure video remains muted when restarting (unless in fullscreen)
        if (!this.currentFullscreenData || this.currentFullscreenData.fullscreenVideo !== video) {
            video.muted = true;
        }

        // Only play if it was already playing or if not paused
        if (state.isPlaying || !state.isPaused) {
            video.play()
                .then(() => {
                    // Update play icon
                    if (playIconCircle) {
                        playIconCircle.classList.add('playing');
                    }
                })
                .catch(error => {
                    console.warn('Failed to restart video:', error);
                });
        } else {
            // If paused, reset the icon to play
            if (playIconCircle) {
                playIconCircle.classList.remove('playing');
            }
        }
    }

    /**
     * Start scrubbing video timeline - 
     */
    startScrubbing(card, direction, button) {
        const state = this.videoStates.get(card);
        if (!state) return;
        
        const { video } = state;
        const step = direction === 'rewind' ? -this.options.scrubStep : this.options.scrubStep;
        
        // Add visual feedback
        button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        
        const scrubKey = direction;
        const interval = setInterval(() => {
            // Stop scrubbing if video is paused (means user hovered away)
            if (video.paused) {
                this.stopScrubbing(card, button);
                return;
            }
            
            const newTime = video.currentTime + step;
            video.currentTime = Math.max(0, Math.min(newTime, video.duration));
        }, this.options.scrubInterval);
        
        this.scrubIntervals.set(scrubKey, interval);
    }

    /**
     * Stop scrubbing video timeline - 
     */
    stopScrubbing(card, button) {
        // Remove visual feedback
        button.style.backgroundColor = '';
        
        // Clear both intervals
        const scrubKeyForward = 'forward';
        const scrubKeyRewind = 'rewind';
        
        if (this.scrubIntervals.has(scrubKeyForward)) {
            clearInterval(this.scrubIntervals.get(scrubKeyForward));
            this.scrubIntervals.delete(scrubKeyForward);
        }
        
        if (this.scrubIntervals.has(scrubKeyRewind)) {
            clearInterval(this.scrubIntervals.get(scrubKeyRewind));
            this.scrubIntervals.delete(scrubKeyRewind);
        }
    }

    /**
     * Clear all scrubbing intervals - helper method
     */
    clearAllScrubIntervals() {
        for (const [key, interval] of this.scrubIntervals) {
            clearInterval(interval);
        }
        this.scrubIntervals.clear();
    }

    /**
     * Enter fullscreen video mode - 
     */
    enterFullscreen(card) {
        const state = this.videoStates.get(card);
        if (!state) return;
        
        const { video } = state;
        
        // Get project title
        const projectTitle = card.querySelector('.project-title');
        const title = projectTitle ? projectTitle.textContent.trim() + ' Demo' : 'Project Demo';
        
        // Use desktop fullscreen overlay for both desktop and mobile
        this.enterDesktopFullscreen(video, title, card);
    }

    /**
     * Enter desktop fullscreen mode - 
     */
    enterDesktopFullscreen(video, title, card) {
        const overlay = this.fullscreenOverlay;
        const fullscreenVideo = this.fullscreenVideo;
        const controls = this.customVideoControls;
        const titleElement = overlay.querySelector('.video-title');
        
        // Update title
        titleElement.textContent = title;
        
        // Store scroll position for fake scrollbar
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const scrollPercent = scrollY / (documentHeight - windowHeight);
        const thumbTop = scrollPercent * (windowHeight - 50); // 50px thumb height
        
        // Set CSS variables for fake scrollbar position
        document.documentElement.style.setProperty('--thumb-top', `${thumbTop}px`);
        document.documentElement.style.setProperty('--thumb-height', `${Math.max(30, (windowHeight / documentHeight) * windowHeight)}px`);
        
        // Add scroll lock class (adds padding and fake scrollbar)
        document.body.classList.add('scroll-locked');
        
        // Scroll blocked with CSS class - fake scrollbar
        
        // Fade out background music when entering fullscreen
        this.fadeOutBackgroundMusic();
        
        // Show overlay
        overlay.classList.add('active');
        
        // ROBUST video source detection - ensure we get the current visible card's video
        let videoSource = null;
        
        // First try to get source from the video's source element
        const videoSourceElement = video.querySelector('source');
        if (videoSourceElement && videoSourceElement.src) {
            videoSource = videoSourceElement.src;
        } 
        // Fallback to video.src if no source element
        else if (video.src) {
            videoSource = video.src;
        }
        // Final fallback - try to find video source in the card
        else {
            const cardVideoSource = card.querySelector('video source');
            if (cardVideoSource && cardVideoSource.src) {
                videoSource = cardVideoSource.src;
            }
        }
        
        if (!videoSource) {
            console.error('Could not determine video source for fullscreen');
            return;
        }
        
        // Get the current position and play state from the playing video
        const currentTime = video.currentTime;
        const originalWasPlaying = !video.paused;
        // Current video position when entering fullscreen
        
        // Clone video source and properties
        fullscreenVideo.src = videoSource;
        // In fullscreen, allow unmuting (start unmuted for better user experience)
        fullscreenVideo.muted = false;
        fullscreenVideo.volume = 1.0; // Always start at full volume in fullscreen
        
        // Prevent native iOS fullscreen and controls
        fullscreenVideo.setAttribute('playsinline', 'true');
        fullscreenVideo.setAttribute('webkit-playsinline', 'true');
        fullscreenVideo.playsInline = true;
        fullscreenVideo.controls = false;
        fullscreenVideo.setAttribute('disablePictureInPicture', 'true');
        fullscreenVideo.disablePictureInPicture = true;
        
        // Loading fullscreen video
        
        // Pause original video
        video.pause();
        
        // Handle video loading and time setting
        const handleVideoReady = () => {
            // Get the most current time from the original video
            const mostCurrentTime = video.currentTime;

            // Ensure unmuted with full volume in fullscreen
            fullscreenVideo.muted = false;
            fullscreenVideo.volume = 1.0;

            // Set the current time first
            if (fullscreenVideo.duration) {
                fullscreenVideo.currentTime = Math.min(mostCurrentTime, fullscreenVideo.duration);
            } else {
                // If duration not available yet, set it anyway (it will be clamped)
                fullscreenVideo.currentTime = mostCurrentTime;
            }

            // Default behavior: Always play in fullscreen

            fullscreenVideo.play().catch(error => {
                console.error('Failed to play fullscreen video:', error);
                // If autoplay fails, show play button prominently
                const centerBtn = overlay.querySelector('.center-play-btn');
                if (centerBtn) {
                    centerBtn.classList.remove('playing');
                }
            });
        };
        
        // Wait for video metadata to load before setting time
        if (fullscreenVideo.readyState >= 1) {
            // Metadata is loaded, we can set currentTime
            handleVideoReady();
        } else {
            // Wait for metadata to load
            fullscreenVideo.addEventListener('loadedmetadata', handleVideoReady, { once: true });
        }
        
        // Set up fullscreen controls
        this.setupCustomControls(fullscreenVideo, overlay, video, card);
        
        // Hide controls after 3 seconds of inactivity
        this.setupControlsAutoHide(controls, overlay, fullscreenVideo);
    }

    /**
     * Setup custom fullscreen controls - 
     */
    setupCustomControls(fullscreenVideo, overlay, originalVideo, card) {
        // Get control elements with error checking
        const backBtn = overlay.querySelector('.video-back-btn');
        const centerPlayBtn = overlay.querySelector('.center-play-btn');
        const restartBtn = overlay.querySelector('.restart-btn');
        const speedBtn = overlay.querySelector('.speed-btn');
        const muteBtn = overlay.querySelector('.mute-btn');
        const exitBtn = overlay.querySelector('.fullscreen-exit-btn');
        const progressTrack = overlay.querySelector('.video-progress-track');
        const progressPlayed = overlay.querySelector('.video-progress-played');
        const progressHandle = overlay.querySelector('.video-progress-handle');
        const currentTimeSpan = overlay.querySelector('#currentTime');
        const totalTimeSpan = overlay.querySelector('#totalTime');
        
        // Debug: Check if elements exist
        
        // Clone button to remove any existing event listeners
        const newCenterPlayBtn = centerPlayBtn.cloneNode(true);
        centerPlayBtn.parentNode.replaceChild(newCenterPlayBtn, centerPlayBtn);
        const cleanCenterPlayBtn = newCenterPlayBtn;
        
        let isDragging = false;
        let currentPlaybackRate = 1;
        let lastClickTime = 0;
        let lastSpacebarTime = 0;
        let isToggling = false;
        
        // Back/Exit button
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.exitFullscreen(overlay, originalVideo, fullscreenVideo, card);
            });
        }
        
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.exitFullscreen(overlay, originalVideo, fullscreenVideo, card);
            });
        }
        
        // Center play/pause button - SIMPLE TOGGLE with debounce
        cleanCenterPlayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Debounce to prevent multiple rapid clicks - very responsive
            const currentTime = Date.now();
            if (currentTime - lastClickTime < 100) {
                return;
            }
            lastClickTime = currentTime;
            
            
            if (fullscreenVideo.paused) {
                fullscreenVideo.play().catch(console.error);
                cleanCenterPlayBtn.classList.add('playing');
                cleanCenterPlayBtn.querySelector('i').className = 'fas fa-pause';
            } else {
                fullscreenVideo.pause();
                cleanCenterPlayBtn.classList.remove('playing');
                cleanCenterPlayBtn.querySelector('i').className = 'fas fa-play';
            }
        });
        
        // Restart button
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                fullscreenVideo.currentTime = 0;
                if (!fullscreenVideo.paused) {
                    fullscreenVideo.play();
                }
            });
        }
        
        // Speed button
        if (speedBtn) {
            speedBtn.addEventListener('click', () => {
                const speeds = [1, 1.25, 1.5, 2];
                const currentIndex = speeds.indexOf(currentPlaybackRate);
                currentPlaybackRate = speeds[(currentIndex + 1) % speeds.length];
                fullscreenVideo.playbackRate = currentPlaybackRate;
                speedBtn.textContent = `${currentPlaybackRate}x`;
            });
        }
        
        // Mute button - only available in fullscreen
        if (muteBtn) {
            // Clone button to remove any existing event listeners
            const newMuteBtn = muteBtn.cloneNode(true);
            muteBtn.parentNode.replaceChild(newMuteBtn, muteBtn);
            const cleanMuteBtn = newMuteBtn;
            
            const updateMuteButton = () => {
                const icon = cleanMuteBtn.querySelector('i');
                if (fullscreenVideo.muted) {
                    icon.className = 'fas fa-volume-mute';
                    cleanMuteBtn.title = 'Unmute';
                } else {
                    icon.className = 'fas fa-volume-up';
                    cleanMuteBtn.title = 'Mute';
                }
            };
            
            cleanMuteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                fullscreenVideo.muted = !fullscreenVideo.muted;
                updateMuteButton();
            });
            
            // Initialize mute button state
            updateMuteButton();
        }
        
        // Progress bar functionality
        if (progressTrack && progressPlayed && progressHandle) {
            const seek = (e) => {
                const rect = progressTrack.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const seekTime = percent * fullscreenVideo.duration;
                fullscreenVideo.currentTime = Math.max(0, Math.min(seekTime, fullscreenVideo.duration));
            };
            
            progressTrack.addEventListener('click', seek);
            
            // Progress bar dragging (mouse and touch)
            progressTrack.addEventListener('mousedown', (e) => {
                isDragging = true;
                seek(e);
            });
            
            progressTrack.addEventListener('touchstart', (e) => {
                isDragging = true;
                const touch = e.touches[0];
                seek({ clientX: touch.clientX });
            });
            
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    seek(e);
                }
            });
            
            document.addEventListener('touchmove', (e) => {
                if (isDragging) {
                    const touch = e.touches[0];
                    seek({ clientX: touch.clientX });
                }
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            document.addEventListener('touchend', () => {
                isDragging = false;
            });
            
            // Update progress
            const updateProgress = () => {
                if (fullscreenVideo.duration) {
                    const progress = (fullscreenVideo.currentTime / fullscreenVideo.duration) * 100;
                    progressPlayed.style.width = `${progress}%`;
                    progressHandle.style.left = `${progress}%`;
                    
                    // Update time display
                    if (currentTimeSpan && totalTimeSpan) {
                        currentTimeSpan.textContent = this.formatTime(fullscreenVideo.currentTime);
                        totalTimeSpan.textContent = this.formatTime(fullscreenVideo.duration);
                    }
                }
            };
            
            fullscreenVideo.addEventListener('timeupdate', updateProgress);
            fullscreenVideo.addEventListener('loadedmetadata', updateProgress);
        }
        
        // Set up keyboard controls with proper cleanup
        this.setupKeyboardControls(overlay, originalVideo, fullscreenVideo, card, cleanCenterPlayBtn, lastSpacebarTime, muteBtn);
        
        // Overlay click/touch to toggle play/pause
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanCenterPlayBtn.click();
            }
        });
        
        overlay.addEventListener('touchend', (e) => {
            if (e.target === overlay) {
                e.preventDefault();
                cleanCenterPlayBtn.click();
            }
        });
    }

    /**
     * Setup keyboard controls for fullscreen video
     */
    setupKeyboardControls(overlay, originalVideo, fullscreenVideo, card, centerPlayBtn, lastSpacebarTime, muteBtn) {
        // Remove any existing keyboard handler
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Store fullscreen data for the keyboard handler
        this.currentFullscreenData = {
            overlay,
            originalVideo,
            fullscreenVideo,
            card,
            centerPlayBtn,
            muteBtn,
            lastSpacebarTime: 0
        };

        // Create new keyboard handler
        this.keyboardHandler = (e) => {
            const data = this.currentFullscreenData;
            if (!data || !data.overlay.classList.contains('active')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.exitFullscreen(data.overlay, data.originalVideo, data.fullscreenVideo, data.card);
                    break;
                case ' ':
                    e.preventDefault();
                    // Direct video control for better responsiveness
                    const currentTime = Date.now();
                    if (currentTime - data.lastSpacebarTime < 200) return; // Prevent rapid spacebar spam
                    data.lastSpacebarTime = currentTime;
                    
                    if (data.fullscreenVideo.paused) {
                        data.fullscreenVideo.play().catch(console.error);
                        data.centerPlayBtn.classList.add('playing');
                        data.centerPlayBtn.querySelector('i').className = 'fas fa-pause';
                    } else {
                        data.fullscreenVideo.pause();
                        data.centerPlayBtn.classList.remove('playing');
                        data.centerPlayBtn.querySelector('i').className = 'fas fa-play';
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    data.fullscreenVideo.currentTime -= 10;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    data.fullscreenVideo.currentTime += 10;
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    // Toggle mute state
                    data.fullscreenVideo.muted = !data.fullscreenVideo.muted;
                    // Update mute button if available - use the clean button reference
                    const muteButton = data.overlay.querySelector('.mute-btn');
                    if (muteButton) {
                        const icon = muteButton.querySelector('i');
                        if (data.fullscreenVideo.muted) {
                            icon.className = 'fas fa-volume-mute';
                            muteButton.title = 'Unmute';
                        } else {
                            icon.className = 'fas fa-volume-up';
                            muteButton.title = 'Mute';
                        }
                    }
                    break;
            }
        };

        // Add the keyboard handler
        document.addEventListener('keydown', this.keyboardHandler);
    }

    /**
     * Setup controls auto-hide functionality - 
     */
    setupControlsAutoHide(controls, overlay, fullscreenVideo) {
        let hideTimeout;
        let isControlsVisible = true;
        
        const hideControls = () => {
            if (!fullscreenVideo.paused) {
                controls.classList.add('hidden');
                isControlsVisible = false;
            }
        };
        
        const showControls = () => {
            controls.classList.remove('hidden');
            isControlsVisible = true;
            
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 3000);
        };
        
        // Show controls on mouse move and touch
        overlay.addEventListener('mousemove', showControls);
        overlay.addEventListener('click', showControls);
        overlay.addEventListener('touchstart', showControls);
        overlay.addEventListener('touchmove', showControls);
        
        // Show controls when video is paused
        fullscreenVideo.addEventListener('pause', () => {
            controls.classList.remove('hidden');
            clearTimeout(hideTimeout);
        });
        
        fullscreenVideo.addEventListener('play', () => {
            hideTimeout = setTimeout(hideControls, 3000);
        });
        
        // Initial setup
        showControls();
    }

    /**
     * Exit fullscreen mode - 
     */
    exitFullscreen(overlay, originalVideo, fullscreenVideo, card) {
        if (this.isExiting) {
            console.log('Already exiting, ignoring duplicate call');
            return;
        }
        this.isExiting = true;
        
        // Store the current time from fullscreen video
        const exitTime = fullscreenVideo.currentTime;
        console.log('Exiting fullscreen at time:', exitTime);
        
        // Store in video state for future fullscreen sessions
        if (card) {
            const state = this.videoStates.get(card);
            if (state) {
                state.lastPosition = exitTime;
            }
        }
        
        // Add exit animation to video container
        const videoContainer = overlay.querySelector('.fullscreen-video-container');
        if (videoContainer) {
            videoContainer.classList.add('exiting');
        }
        
        // Start exit animation for overlay
        overlay.style.opacity = '0';
        
        // Fade in background music when exiting fullscreen
        this.fadeInBackgroundMusic();
        
        // Remove scroll lock class and restore scrolling
        console.log('Removing scroll lock class');
        
        document.body.classList.remove('scroll-locked');
        document.documentElement.style.removeProperty('--thumb-top');
        document.documentElement.style.removeProperty('--thumb-height');
        
        console.log('Scroll restored - class removed');
        
        // Wait for animation to complete before hiding
        setTimeout(() => {
            // Hide overlay
            overlay.classList.remove('active');
            
            // Remove animation class for next time
            if (videoContainer) {
                videoContainer.classList.remove('exiting');
            }
            
            // Reset overlay opacity
            overlay.style.opacity = '';
            
            // Stop fullscreen video and clean up
            fullscreenVideo.pause();
            fullscreenVideo.src = '';
            fullscreenVideo.playbackRate = 1; // Reset playback rate
            
            // Clean up keyboard handler
            if (this.keyboardHandler) {
                document.removeEventListener('keydown', this.keyboardHandler);
                this.keyboardHandler = null;
            }
            this.currentFullscreenData = null;
            
            // Final cleanup - ensure all scroll blocking is removed
            console.log('Final scroll cleanup completed');
            
            // Remove event listeners to prevent memory leaks
            const controls = overlay.querySelector('.custom-video-controls');
            if (controls) {
                const newControls = controls.cloneNode(true);
                controls.parentNode.replaceChild(newControls, controls);
            }
        }, 300); // Match the animation duration
        
        // Reset exit flag after animation completes
        setTimeout(() => {
            this.isExiting = false;
            console.log('Exit process completed, ready for next fullscreen');
        }, 350);
        
        // Sync time back to original video for seamless continuation
        if (originalVideo && !isNaN(exitTime)) {
            originalVideo.currentTime = exitTime;
            
            // Ensure original video remains muted (videos outside fullscreen should always be muted)
            originalVideo.muted = true;
            
            // Resume playback if fullscreen was playing
            if (!fullscreenVideo.paused) {
                originalVideo.play().catch(console.error);
            }
        }
    }

    /**
     * Format time in MM:SS format
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Fade out background music when entering fullscreen
     */
    fadeOutBackgroundMusic() {
        eventBus.emit('video:fullscreen:enter');
        
        // Also access via global app if available
        if (window.portfolioApp && window.portfolioApp.getComponent) {
            const musicController = window.portfolioApp.getComponent('musicController');
            if (musicController && musicController.isPlaying && musicController.audio && !musicController.audio.paused) {
                // Store the original volume for restoration
                this.originalMusicVolume = musicController.audio.volume || musicController.fadeVolume || 0.15;
                
                console.log('Fading out background music from', this.originalMusicVolume, 'to 0.02');
                // Smoothly fade out background music
                this.fadeBackgroundMusic(musicController, this.originalMusicVolume, 0.02, 1000); // Fade to very low volume over 1 second
            }
        }
    }

    /**
     * Fade in background music when exiting fullscreen
     */
    fadeInBackgroundMusic() {
        eventBus.emit('video:fullscreen:exit');
        
        // Also access via global app if available
        if (window.portfolioApp && window.portfolioApp.getComponent) {
            const musicController = window.portfolioApp.getComponent('musicController');
            if (musicController && musicController.isPlaying && musicController.audio && !musicController.audio.paused) {
                const targetVolume = this.originalMusicVolume || musicController.fadeVolume || 0.15;
                
                console.log('Fading in background music from', musicController.audio.volume, 'to', targetVolume);
                // Smoothly fade in background music
                this.fadeBackgroundMusic(musicController, musicController.audio.volume, targetVolume, 1000); // Fade in over 1 second
            }
        }
    }

    /**
     * Helper method to smoothly fade background music volume
     */
    fadeBackgroundMusic(musicController, startVolume, targetVolume, duration) {
        if (!musicController || !musicController.audio) return;
        
        const startTime = Date.now();
        const volumeDifference = targetVolume - startVolume;
        
        const fadeStep = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeInOut curve for smooth transition
            const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            const currentVolume = startVolume + (volumeDifference * easedProgress);
            musicController.audio.volume = Math.max(0, Math.min(1, currentVolume));
            
            if (progress < 1) {
                requestAnimationFrame(fadeStep);
            }
        };
        
        fadeStep();
    }

    /**
     * Clean up component state
     */
    cleanupState() {
        // Clear all scrub intervals
        for (const [key, interval] of this.scrubIntervals) {
            clearInterval(interval);
        }
        this.scrubIntervals.clear();
        
        // Exit fullscreen if active
        if (this.fullscreenOverlay && this.fullscreenOverlay.classList.contains('active')) {
            this.exitFullscreen(this.fullscreenOverlay, null, this.fullscreenVideo, null);
        }
        
        // Clear video states
        this.videoStates.clear();
        
        // Clean up CSS classes
        document.body.classList.remove('scroll-locked');
        document.documentElement.style.removeProperty('--thumb-top');
        document.documentElement.style.removeProperty('--thumb-height');
        
        this.log('Video controller cleaned up');
    }
}