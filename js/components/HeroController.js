/**
 * HeroController
 *
 * Handles all hero section interactive animations including parallax effects,
 * Mew animation system, mouse movement interactions, and scroll behaviors.
 * .
 *


 */

import { ComponentBase } from '../core/ComponentBase.js';
import { SELECTORS, CSS_CLASSES, TIMING } from '../config/constants.js';

export class HeroController extends ComponentBase {
    constructor(options = {}) {
        super('HeroController', options);
        
        // Mew Animation State
        this.mewWrapper = null;
        this.mew = null;
        this.hero = null;
        this.posX = -100; // Start off-screen left
        this.speed = 0.5;
        this.direction = 1; // 1 = right, -1 = left
        this.isPaused = false;
        this.pauseTime = 500; // ms delay
        
        // Parallax Elements
        this.heroBg = null;
        this.orbs = [];
        this.heroContent = null;
        
        // Mu/μ/Mew Animation State - 
        this.muOptions = null;
        this.muTransitionInterval = null;
        
        // Animation Frame IDs
        this.mewAnimationFrame = null;
    }

    /**
     * Get default configuration options
     */
    getDefaultOptions() {
        return {
            debug: false,
            mewSpeed: 0.5,
            parallaxMultiplier: 0.5,
            mouseEffectStrength: 0.1
        };
    }

    /**
     * Initialize DOM element references
     */
    async initElements() {
        // Mew animation elements
        this.mewWrapper = this.$(SELECTORS.MEW_WRAPPER);
        this.mew = this.$(SELECTORS.MEW_FLOATER);
        this.hero = this.$(SELECTORS.HERO);
        
        // Parallax elements
        this.heroBg = this.$('.hero-bg');
        this.orbs = this.$$('.gradient-orb');
        this.heroContent = this.$('.hero-content');
        
        // Mu/μ/Mew animation elements - 
        this.muOptions = this.$('.mu-options');
        
        if (!this.hero) {
            throw new Error('Hero section not found');
        }
        
        
        this.log('Hero elements initialized successfully');
    }

    /**
     * Initialize component state
     */
    async initState() {
        this.speed = this.options.mewSpeed;
    }

    /**
     * Initialize event listeners
     */
    async initEvents() {
        // Enhanced Parallax with multiple layers - 
        this.addEventListener(window, 'scroll', this.handleScroll.bind(this));
        
        // Mouse movement effect for hero section - 
        this.addEventListener(document, 'mousemove', this.handleMouseMove.bind(this));
    }

    /**
     * Called after component initialization
     */
    async afterInit() {
        // Initialize Mew animation
        if (this.mewWrapper && this.mew) {
            this.initializeMewAnimation();
        }
        
        // Initialize Mu/μ/Mew text animation
        if (this.muOptions) {
            this.initializeMuAnimation();
        }
    }

    /**
     * Handle scroll events for parallax effects - 
     */
    handleScroll() {
        const scrolled = window.pageYOffset;
        
        // Hero background parallax
        if (this.heroBg) {
            this.heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
        
        // Parallax for orbs - 
        this.orbs.forEach((orb, index) => {
            const speed = 0.3 + index * 0.1;
            orb.style.transform = `translateY(${scrolled * speed}px)`;
        });
        
        // Subtle parallax for hero content - 
        if (this.heroContent && scrolled < window.innerHeight) {
            this.heroContent.style.transform = `translateY(${scrolled * 0.2}px)`;
            this.heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
        }
    }

    /**
     * Handle mouse movement effects - 
     */
    handleMouseMove(e) {
        const hero = this.hero;
        if (!hero) return;
        
        const rect = hero.getBoundingClientRect();
        if (e.clientY > rect.bottom) return;
        
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        // Apply subtle movement to orbs based on mouse position
        this.orbs.forEach((orb, index) => {
            const moveX = (mouseX - 0.5) * (30 + index * 10);
            const moveY = (mouseY - 0.5) * (20 + index * 8);
            orb.style.transform += ` translate(${moveX}px, ${moveY}px)`;
        });
    }

    /**
     * Initialize Mew animation system
     */
    initializeMewAnimation() {
        // Initialize position and direction
        this.randomizeMewPosition();
        this.mewWrapper.style.left = this.posX + "px"; // Set initial horizontal position
        this.mew.style.transform = "scale(1.25, 1.25) scaleX(-1)"; // start facing right and bigger
        this.animateMew();
        
        this.log('Mew animation initialized');
    }

    /**
     * Randomize Mew position 
     */
    randomizeMewPosition() {
        const heroRect = this.hero.getBoundingClientRect();
        const sectionHeight = heroRect.height;
        const safeTop = heroRect.top - 40; // prevent cutting off at very top
        const topZoneEnd = heroRect.top + sectionHeight * 0.3;
        const bottomZoneStart = heroRect.top + sectionHeight * 0.7;
        const safeBottom = heroRect.bottom - 150; // Increase bottom buffer to avoid music controls
        
        const chooseTop = Math.random() < 0.5;
        let randomY;
        
        if (chooseTop) {
            randomY = Math.floor(Math.random() * (topZoneEnd - 100) + 100);
        } else {
            randomY = Math.floor(Math.random() * (safeBottom - bottomZoneStart) + bottomZoneStart);
        }
        
        this.mewWrapper.style.top = randomY + "px";
        this.log(`Mew repositioned to Y: ${randomY}`);
    }

    /**
     * Animate Mew movement - 
     */
    animateMew() {
        if (!this.isPaused) {
            this.posX += this.speed * this.direction;
            this.mewWrapper.style.left = this.posX + "px";
            
            // Boundary checking with direction change and pause
            if (this.direction === 1 && this.posX > window.innerWidth + 200) {
                this.isPaused = true;
                setTimeout(() => {
                    this.direction = -1;
                    this.mew.style.transform = "scale(1.25, 1.25) scaleX(1)"; // face left and bigger
                    this.randomizeMewPosition();
                    this.isPaused = false;
                }, this.pauseTime);
            }
            
            if (this.direction === -1 && this.posX < -200) {
                this.isPaused = true;
                setTimeout(() => {
                    this.direction = 1;
                    this.mew.style.transform = "scale(1.25, 1.25) scaleX(-1)"; // face right and bigger
                    this.randomizeMewPosition();
                    this.isPaused = false;
                }, this.pauseTime);
            }
        }
        
        this.mewAnimationFrame = requestAnimationFrame(this.animateMew.bind(this));
    }

    /**
     * Initialize rotating job title animation
     */
    initializeMuAnimation() {
        const options = ["Software Engineer", "Full-Stack Developer", "Game Developer"];
        const colors = [
            "var(--primary)",      // Red for Software Engineer
            "var(--accent-pink)",  // Pink for Full-Stack Developer
            "#e65100",             // Dark vibrant orange for Game Developer
        ];
        let currentIndex = 0;
        
        const transitionText = () => {
            const currentSpan = this.muOptions.querySelector("span");
            const nextIndex = (currentIndex + 1) % options.length;
            
            // Dramatic fade out with rotation and scale
            currentSpan.style.transition = "all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
            currentSpan.style.opacity = "0";
            currentSpan.style.transform = "translateY(-30px) rotateX(90deg) scale(0.6)";
            
            // Container dramatic transformation
            this.muOptions.style.transition = "all 0.9s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
            this.muOptions.style.transform = "scale(0.85) rotateY(5deg)";
            this.muOptions.style.filter = "blur(2px)";
            
            setTimeout(() => {
                // Update text and color
                currentSpan.textContent = options[nextIndex];
                currentSpan.style.color = colors[nextIndex];
                currentSpan.style.fontWeight = "600";
                
                // Update container colors with dramatic shift
                const nextColorRgb = nextIndex === 0 ? '255, 59, 59' : nextIndex === 1 ? '255, 105, 180' : '230, 81, 0';
                this.muOptions.style.background = `rgba(${nextColorRgb}, 0.15)`;
                this.muOptions.style.borderColor = colors[nextIndex];
                this.muOptions.style.boxShadow = `0 0 20px rgba(${nextColorRgb}, 0.3)`;
                
                // Prepare for dramatic entrance
                currentSpan.style.transform = "translateY(30px) rotateX(-90deg) scale(0.6)";
                
                setTimeout(() => {
                    currentSpan.style.opacity = "1";
                    currentSpan.style.transform = "translateY(0) rotateX(0deg) scale(1.1)";
                    currentSpan.style.textShadow = `0 2px 4px rgba(0, 0, 0, 0.4), 0 3px 8px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2), 0 0 10px ${colors[nextIndex]}60`;
                    this.muOptions.style.transform = "scale(1.05) rotateY(0deg)";
                    this.muOptions.style.filter = "blur(0px)";

                    setTimeout(() => {
                        currentSpan.style.transform = "translateY(0) rotateX(0deg) scale(1)";
                        currentSpan.style.textShadow = `0 2px 4px rgba(0, 0, 0, 0.4), 0 3px 8px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2), 0 0 5px ${colors[nextIndex]}30`;
                        this.muOptions.style.transform = "scale(1)";
                        this.muOptions.style.boxShadow = `0 0 15px rgba(${nextColorRgb}, 0.2)`;

                        setTimeout(() => {
                            currentSpan.style.textShadow = "";
                            this.muOptions.style.boxShadow = `0 4px 15px rgba(${nextColorRgb}, 0.1)`;
                        }, 300);
                    }, 200);
                }, 150);
                
                // Move to next option
                currentIndex = nextIndex;
            }, 500);
        };
        
        // Initialize first state
        const currentSpan = this.muOptions.querySelector("span");
        currentSpan.style.color = colors[0];
        currentSpan.style.fontWeight = "600";
        this.muOptions.style.background = `rgba(255, 59, 59, 0.1)`;
        this.muOptions.style.borderColor = colors[0];
        this.muOptions.style.boxShadow = `0 4px 15px rgba(255, 59, 59, 0.1)`;
        
        // Start the animation
        this.muTransitionInterval = setInterval(transitionText, 3000);
        
        this.log('Job title rotation animation initialized');
    }

    /**
     * Clean up component state
     */
    cleanupState() {
        if (this.mewAnimationFrame) {
            cancelAnimationFrame(this.mewAnimationFrame);
            this.mewAnimationFrame = null;
        }
        
        if (this.muTransitionInterval) {
            clearInterval(this.muTransitionInterval);
            this.muTransitionInterval = null;
        }
        
        this.log('Hero controller cleaned up');
    }
}