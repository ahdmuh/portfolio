/**
 * NavigationManager
 *
 * Manages navigation behavior, smooth scrolling, and responsive navigation states.
 * Handles navbar transparency, active states, and scroll-based interactions.
 *


 */

import { ComponentBase } from '../core/ComponentBase.js';
import { eventBus } from '../core/EventBus.js';
import { SELECTORS, TIMING, BREAKPOINTS } from '../config/constants.js';

export class NavigationManager extends ComponentBase {
    constructor(options = {}) {
        super('NavigationManager', options);
        
        // Navigation state
        this.isScrolled = false;
        this.activeSection = 'home';
        this.isNavigating = false;
        
        // DOM references
        this.navbar = null;
        this.navLinks = [];
        this.sections = [];
    }

    /**
     * Get default configuration options
     */
    getDefaultOptions() {
        return {
            debug: false,
            scrollThreshold: 50,
            smoothScrollDuration: TIMING.SMOOTH_SCROLL,
            intersectionThreshold: 0.6,
            enableActiveStates: true
        };
    }

    /**
     * Initialize DOM element references
     */
    async initElements() {
        this.navbar = this.$(SELECTORS.NAVBAR);
        this.navLinks = Array.from(this.$$(SELECTORS.NAV_LINKS));
        
        // Get all sections for navigation
        this.sections = [
            { id: 'home', element: this.$(SELECTORS.HERO) },
            { id: 'about', element: this.$(SELECTORS.ABOUT) },
            { id: 'experience', element: this.$(SELECTORS.EXPERIENCE) },
            { id: 'projects', element: this.$(SELECTORS.PROJECTS) },
            { id: 'contact', element: this.$(SELECTORS.CONTACT) }
        ].filter(section => section.element);

        if (!this.navbar) {
            throw new Error('Navbar element not found');
        }
    }

    /**
     * Initialize component state
     */
    async initState() {
        this.updateNavbarState();
        
        if (this.options.enableActiveStates) {
            this.setupIntersectionObserver();
        }
    }

    /**
     * Initialize event listeners
     */
    async initEvents() {
        // Scroll events for navbar state
        const throttledScroll = this.throttle(this.handleScroll.bind(this), TIMING.SCROLL_THROTTLE);
        this.addEventListener(window, 'scroll', throttledScroll);
        
        // Navigation link clicks
        this.navLinks.forEach(link => {
            this.addEventListener(link, 'click', this.handleNavLinkClick.bind(this));
        });
        
        // Global hash link handler for any element with href="#section"
        this.addEventListener(document, 'click', this.handleHashLinkClick.bind(this));
        
        // Window resize for responsive behavior
        const debouncedResize = this.debounce(this.handleResize.bind(this), TIMING.RESIZE_DEBOUNCE);
        this.addEventListener(window, 'resize', debouncedResize);
        
        // Global events
        eventBus.on('navigation:scrollTo', this.scrollToSection.bind(this));
    }

    /**
     * Setup intersection observer for active section detection
     */
    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '-50px 0px',
            threshold: this.options.intersectionThreshold
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isNavigating) {
                    const sectionId = entry.target.id;
                    this.setActiveSection(sectionId);
                }
            });
        }, observerOptions);

        // Observe all sections
        this.sections.forEach(({ element }) => {
            this.intersectionObserver.observe(element);
        });

        this.log('Intersection observer setup complete');
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldShowBackground = scrollTop > this.options.scrollThreshold;

        if (shouldShowBackground !== this.isScrolled) {
            this.isScrolled = shouldShowBackground;
            this.updateNavbarState();
        }
    }

    /**
     * Update navbar visual state
     */
    updateNavbarState() {
        if (!this.navbar) return;
        
        if (this.isScrolled) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
        
        this.log(`Navbar state updated: ${this.isScrolled ? 'scrolled' : 'top'}`);
    }

    /**
     * Handle navigation link clicks - Custom smooth scroll to match original speed
     */
    handleNavLinkClick(e) {
        e.preventDefault();
        
        const target = document.querySelector(e.currentTarget.getAttribute("href"));
        if (target) {
            // Calculate the exact top position of the section
            const targetTop = target.offsetTop;
            
            // Different offsets for different sections
            let offset = 50;
            const targetId = target.getAttribute('id');
            if (targetId === 'about') {
                offset = 20; // Smaller offset = scroll down further into the about section
            } else if (targetId === 'experience') {
                // Mobile needs to scroll 10px lower than desktop
                offset = window.innerWidth <= 768 ? 0 : 10;
            } else if (targetId === 'projects') {
                // Mobile needs to scroll 20px further down than desktop, desktop goes 20px lower
                offset = window.innerWidth <= 768 ? 30 : 10; // Desktop now goes 40px lower (was 50, now 10)
            } else if (targetId === 'contact') {
				// Mobile needs to scroll 20px further down than desktop, desktop goes 20px lower
				offset = window.innerWidth <= 768 ? 30 : 10; // Desktop now goes 40px lower (was 50, now 10)
			}
			
            
            this.smoothScrollTo(targetTop - offset, 1200); // 1200ms duration
        }
    }

    /**
     * Handle hash link clicks from any element (e.g., hero buttons)
     */
    handleHashLinkClick(e) {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        
        // Check if this is already handled by nav links
        if (this.navLinks.includes(link)) return;
        
        e.preventDefault();
        
        const target = document.querySelector(href);
        if (target) {
            // Calculate the exact top position of the section
            const targetTop = target.offsetTop;
            
            // Different offsets for different sections
            let offset = 50;
            const targetId = target.getAttribute('id');
            if (targetId === 'about') {
                offset = 350; // Scroll down significantly more to completely hide previous section
            } else if (targetId === 'experience') {
                // Mobile needs to scroll 10px lower than desktop
                offset = window.innerWidth <= 768 ? 0 : 10;
            } else if (targetId === 'projects') {
                // Mobile needs to scroll 20px further down than desktop, desktop goes 20px lower
                offset = window.innerWidth <= 768 ? 30 : 10; // Desktop now goes 40px lower (was 50, now 10)
            }
            this.smoothScrollTo(targetTop - offset, 1200); // 1200ms duration like original
        }
    }

    /**
     * Smooth scroll to section by ID
     */
    scrollToSection(sectionId) {
        const target = document.querySelector(`#${sectionId}`);
        if (target) {
            const targetTop = target.offsetTop;
            // Different offsets for different sections
            let offset = 50;
            if (sectionId === 'about') {
                offset = 350; // Scroll down significantly more to completely hide previous section
            } else if (sectionId === 'experience') {
                // Mobile needs to scroll 10px lower than desktop
                offset = window.innerWidth <= 768 ? 0 : 10;
            } else if (sectionId === 'projects') {
                // Mobile needs to scroll 20px further down than desktop, desktop goes 20px lower
                offset = window.innerWidth <= 768 ? 30 : 10; // Desktop now goes 40px lower (was 50, now 10)
            }
            this.smoothScrollTo(targetTop - offset, 1200); // 1200ms duration like original
        }
    }
    
    /**
     * Custom smooth scroll implementation - Mobile optimized
     */
    smoothScrollTo(targetPosition, duration = 1200) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        
        // Gentler, longer duration for mobile
        const isMobile = window.innerWidth <= 768;
        const mobileDuration = isMobile ? duration * 1.5 : duration; // 50% longer on mobile

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / mobileDuration, 1);
            
            // Gentler easing function for mobile
            let easedProgress;
            if (isMobile) {
                // Ultra-smooth ease-in-out-quart for mobile
                easedProgress = progress < 0.5 
                    ? 8 * progress * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 4) / 2;
            } else {
                // Original easing for desktop
                easedProgress = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            }
            
            const currentPosition = startPosition + (distance * easedProgress);
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * Set active section and update nav links
     */
    setActiveSection(sectionId) {
        if (this.activeSection === sectionId) return;
        
        this.activeSection = sectionId;
        this.updateActiveNavLink();
        
        this.log(`Active section changed to: ${sectionId}`);
        eventBus.emit('navigation:activeChanged', { sectionId });
    }

    /**
     * Update active navigation link styling
     */
    updateActiveNavLink() {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === `#${this.activeSection}`;
            
            link.classList.toggle('active', isActive);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate navbar height and positions
        this.updateNavbarState();
        
        // Update intersection observer margins if needed
        if (this.intersectionObserver) {
            // Reconnect observer with updated root margins
            this.intersectionObserver.disconnect();
            this.setupIntersectionObserver();
        }
        
        eventBus.emit('navigation:resize', { width: window.innerWidth });
    }

    /**
     * Get current navigation state
     */
    getState() {
        return {
            activeSection: this.activeSection,
            isScrolled: this.isScrolled,
            isNavigating: this.isNavigating,
            scrollPosition: window.pageYOffset,
            navbarHeight: this.navbar ? this.navbar.offsetHeight : 0
        };
    }

    /**
     * Manually set active section (for external control)
     */
    setActiveSectionManually(sectionId) {
        this.isNavigating = true;
        this.setActiveSection(sectionId);
        
        setTimeout(() => {
            this.isNavigating = false;
        }, 100);
    }

    /**
     * Get section element by ID
     */
    getSectionElement(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        return section ? section.element : null;
    }

    /**
     * Check if section is visible
     */
    isSectionVisible(sectionId) {
        const element = this.getSectionElement(sectionId);
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        return rect.top < windowHeight && rect.bottom > 0;
    }

    /**
     * Get visible sections
     */
    getVisibleSections() {
        return this.sections
            .filter(({ id }) => this.isSectionVisible(id))
            .map(({ id }) => id);
    }

    /**
     * Enable/disable active state tracking
     */
    setActiveStateTracking(enabled) {
        this.options.enableActiveStates = enabled;
        
        if (enabled && !this.intersectionObserver) {
            this.setupIntersectionObserver();
        } else if (!enabled && this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        this.log(`Active state tracking ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Clean up component state
     */
    cleanupState() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Reset navbar state
        if (this.navbar) {
            this.navbar.classList.remove('scrolled');
        }
        
        // Reset active nav links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Reset state
        this.isScrolled = false;
        this.activeSection = 'home';
        this.isNavigating = false;
    }
}