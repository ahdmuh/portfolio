/**
 * ProjectCarousel
 *
 * 
 * carousel functionality, view more button, and mobile swipe carousel.
 *


 */

import { ComponentBase } from '../core/ComponentBase.js';
import { eventBus } from '../core/EventBus.js';
import { SELECTORS, BREAKPOINTS, LAYOUT } from '../config/constants.js';

export class ProjectCarousel extends ComponentBase {
    constructor(options = {}) {
        super('ProjectCarousel', options);

        this.allProjects = [];
        this.currentBatch = 0;
        this.projectsPerBatch = 3;
        this.mobileCurrentIndex = 0;
        this.mobileCards = [];
        this.videoPositions = new Map();
        this.startX = 0;
        this.startY = 0;
        this.isDragging = false;
        this.hasInteracted = false;
    }

    /**
     * Get default configuration options
     */
    getDefaultOptions() {
        return {
            debug: false,
            projectsPerBatch: 3,
            enableTouch: true
        };
    }

    /**
     * Initialize DOM element references
     */
    async initElements() {
        this.projectsGrid = this.$('.projects-grid');
        this.viewMoreBtn = this.$('#viewMoreBtn');
        this.mobileProjectsTrack = this.$('#mobileProjectsTrack');
        this.mobileIndicators = this.$('#mobileIndicators');
        this.swipeIndicator = this.$('#swipeIndicator');
        
        if (!this.projectsGrid) {
            throw new Error('Projects grid element not found');
        }

        this.allProjects = Array.from(this.projectsGrid.querySelectorAll('.project-card'));
        this.projectsPerBatch = this.options.projectsPerBatch;
    }

    /**
     * Initialize component state
     */
    async initState() {
        this.log(`Found ${this.allProjects.length} total projects`);
        this.setupViewMoreButton();
        this.setupMobileCarousel();
        this.handleTabletCentering();
        this.adjustViewMorePosition();
    }

    /**
     * Initialize event listeners
     */
    async initEvents() {
        this.setupProjectCardsObserver();
        this.addEventListener(window, 'resize', this.handleResize.bind(this));
        this.setupMobileTouch();
    }

    /**
     * Setup project cards observer for staggered animation - 
     */
    setupProjectCardsObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const projectObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const cards = entry.target.querySelectorAll('.project-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('visible');
                        }, index * 150);
                    });
                }
            });
        }, observerOptions);

        const projectsSection = document.querySelector('.projects');
        if (projectsSection) {
            projectObserver.observe(projectsSection);
        }
    }

    handleTabletCentering() {
        this.allProjects.forEach(project => {
            project.classList.remove('center-in-tablet');
            project.style.width = '';
            project.style.maxWidth = '';
        });

        this.log('Tablet centering disabled - cards remain left-aligned');
    }

    adjustViewMorePosition() {
        const viewMoreBtn = this.viewMoreBtn;
        const projectsSection = document.querySelector('.projects');
        if (!viewMoreBtn || !projectsSection) return;
        
        // Get visible projects
        const visibleProjects = this.allProjects.filter(project => 
            project.style.display !== 'none'
        );
        
        // Get grid info
        const grid = this.projectsGrid;
        const computedStyle = window.getComputedStyle(grid);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        const columnCount = gridTemplateColumns.split(' ').length;
        
        // More robust detection - check actual card positions
        let actualRows = 1;
        if (visibleProjects.length > 1) {
            const firstCardTop = visibleProjects[0].offsetTop;
            const lastCardTop = visibleProjects[visibleProjects.length - 1].offsetTop;
            actualRows = lastCardTop > firstCardTop ? 2 : 1;
        }
        
        const hasSecondRow = actualRows > 1;
        const isSingleCardCentered = visibleProjects.length === 3 &&
                                   window.innerWidth <= 1000 &&
                                   window.innerWidth > 768;

        const isWideDesktop = window.innerWidth >= 1200;
        const isNarrowDesktopWrap = window.innerWidth > 1000 && window.innerWidth <= 1171;
        
        this.log(`Visible: ${visibleProjects.length}, Columns: ${columnCount}, Rows: ${actualRows}, HasSecondRow: ${hasSecondRow}, Width: ${window.innerWidth}`);

        if (hasSecondRow || isSingleCardCentered) {
            if (isNarrowDesktopWrap && hasSecondRow) {
                viewMoreBtn.style.bottom = '180px';
                projectsSection.style.paddingBottom = '0rem';
                projectsSection.style.marginBottom = '-4rem';
                this.log('Positioned View More button EXTRA high for narrow desktop wrap');
            } else if (isWideDesktop) {
                viewMoreBtn.style.bottom = '80px';
                projectsSection.style.paddingBottom = '2rem';
                projectsSection.style.marginBottom = '';
                this.log('Positioned View More button normal for wide desktop');
            } else {
                viewMoreBtn.style.bottom = '20px';
                if (window.innerWidth > 768) {
                    projectsSection.style.paddingBottom = '0rem';
                    projectsSection.style.marginBottom = '-5rem';
                } else {
                    projectsSection.style.paddingBottom = '3rem';
                    projectsSection.style.marginBottom = '2rem';
                }
                this.log('Positioned View More button close (two-row or single centered card)');
            }
        } else {
            if (window.innerWidth <= 1000 && window.innerWidth > 768) {
                viewMoreBtn.style.bottom = '80px';
            } else {
                viewMoreBtn.style.bottom = '80px';
            }
            projectsSection.style.paddingBottom = '2rem';
            projectsSection.style.marginBottom = '';
            this.log('Positioned View More button for normal single-row layout');
        }
    }

    setupViewMoreButton() {
        const viewMoreBtn = this.viewMoreBtn;
        this.log('View More Button:', viewMoreBtn);
        
        if (viewMoreBtn && this.allProjects.length > 3) {
            viewMoreBtn.style.display = 'flex';
            this.addEventListener(viewMoreBtn, 'click', () => {
                this.log('View More clicked!');
                this.rotateProjects();
            });
        } else if (viewMoreBtn) {
            viewMoreBtn.style.display = 'none';
        }
    }

    rotateProjects() {
        if (this.allProjects.length <= 3) return;
        this.log('Rotating projects...');
        const viewMoreBtn = this.viewMoreBtn;
        const projectsGrid = this.projectsGrid;
        
        const currentVisible = this.allProjects.slice(
            this.currentBatch * this.projectsPerBatch, 
            (this.currentBatch + 1) * this.projectsPerBatch
        );

        const totalBatches = Math.ceil(this.allProjects.length / this.projectsPerBatch);
        this.currentBatch = (this.currentBatch + 1) % totalBatches;

        const nextVisible = this.allProjects.slice(
            this.currentBatch * this.projectsPerBatch,
            (this.currentBatch + 1) * this.projectsPerBatch
        );

        currentVisible.forEach((project, index) => {
            setTimeout(() => {
                project.style.opacity = '0';
                project.style.transform = 'translateY(30px)';
            }, index * 50);
        });

        setTimeout(() => {
            this.allProjects.forEach(project => {
                project.style.display = 'none';
                project.style.opacity = '0';
                project.style.transform = 'translateY(30px)';
                project.classList.remove('visible');
            });

            nextVisible.forEach((project, index) => {
                project.style.opacity = '0';
                project.style.transform = 'translateY(30px)';
                project.style.display = 'flex';

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            project.style.opacity = '1';
                            project.style.transform = 'translateY(0)';
                            project.classList.add('visible');

                            setTimeout(() => {
                                project.style.transform = '';
                                project.style.opacity = '';
                            }, 150);
                        }, index * 100);
                    });
                });
            });

            this.updateMobileCarousel();
            this.handleTabletCentering();
            this.adjustViewMorePosition();

            const span = viewMoreBtn.querySelector('span');
            const icon = viewMoreBtn.querySelector('#viewMoreIcon path');
            const nextBatch = (this.currentBatch + 1) % totalBatches;
            const newText = nextBatch === 0 ? 'Return' : 'View More';
            const newIconPath = nextBatch === 0 ? 
                'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z' : 
                'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z';
            
            viewMoreBtn.classList.add('changing');
            setTimeout(() => {
                span.textContent = newText;
                icon.setAttribute('d', newIconPath);
                setTimeout(() => {
                    viewMoreBtn.classList.remove('changing');
                }, 100);
            }, 300);

            eventBus.emit('video:reinitialize');
            
            this.log(`Showing batch ${this.currentBatch}`);
        }, 500);
    }

    setupMobileCarousel() {
        this.log('Setting up mobile carousel...');

        const mobileTrack = this.mobileProjectsTrack;
        const indicators = this.mobileIndicators;

        if (!mobileTrack || !indicators) {
            this.log('Mobile carousel elements not found');
            return;
        }

        this.mobileCurrentIndex = 0;

        mobileTrack.innerHTML = '';
        indicators.innerHTML = '';
        this.mobileCards = [];

        mobileTrack.style.transform = 'translateX(0px)';

        const projectsToShow = Array.from(this.projectsGrid.querySelectorAll('.project-card'));

        projectsToShow.forEach((project, index) => {
            const mobileCard = project.cloneNode(true);
            mobileCard.classList.add('mobile-project-card');
            mobileCard.classList.remove('project-card');
            mobileCard.style.display = 'block';
            mobileCard.style.transform = '';
            mobileCard.style.opacity = '1';

            const links = mobileCard.querySelectorAll('.project-link');
            links.forEach(link => {
                link.style.userSelect = 'auto';
                link.style.webkitUserSelect = 'auto';
            });

            mobileTrack.appendChild(mobileCard);
            this.mobileCards.push(mobileCard);

            const indicator = document.createElement('div');
            indicator.className = 'indicator-dot';
            if (index === 0) indicator.classList.add('active');
            
            indicator.addEventListener('click', () => {
                this.goToMobileSlide(index);
            });

            indicators.appendChild(indicator);
        });

        setTimeout(() => {
            this.mobileCurrentIndex = 0;
            mobileTrack.style.transform = 'translateX(0px)';
            this.updateMobilePosition();
            this.updateMobileIndicators();
        }, 50);

        setTimeout(() => {
            const mobileCards = mobileTrack.querySelectorAll('.mobile-project-card');
            if (mobileCards.length > 0) {
                mobileCards[0].classList.add('focused');
                const firstVideo = mobileCards[0].querySelector('.project-video');
                if (firstVideo) {
                    if (firstVideo.readyState === 0) {
                        firstVideo.load();
                    }
                    const playWhenReady = () => {
                        firstVideo.play().catch(console.error);
                    };
                    if (firstVideo.readyState >= 2) {
                        playWhenReady();
                    } else {
                        firstVideo.addEventListener('canplay', playWhenReady, { once: true });
                    }
                }

                mobileCards.forEach((card, index) => {
                    if (index !== 0) {
                        const video = card.querySelector('.project-video');
                        if (video) {
                            video.pause();
                        }
                    }
                });
            }

            eventBus.emit('video:reinitialize');
        }, 100);
        
        this.log(`Mobile carousel setup complete with ${this.mobileCards.length} cards`);
    }

    updateMobileCarousel() {
        if (window.innerWidth > 768) return;
        this.mobileCurrentIndex = 0;
        this.setupMobileCarousel();
    }

    setupMobileTouch() {
        const viewport = this.mobileProjectsTrack?.parentElement;
        if (!viewport) return;
        
        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let isMouseDown = false;
        let startTime = 0;

        viewport.addEventListener('touchstart', (e) => {
            if (e.target.closest('.video-controls') || e.target.closest('.video-control-btn')) {
                return;
            }
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = false;
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
            if (e.target.closest('.video-controls') || e.target.closest('.video-control-btn')) {
                return;
            }
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(startX - currentX);
            const diffY = Math.abs(startY - currentY);

            if (!isDragging && diffX > 10 && diffX > diffY * 2) {
                isDragging = true;
            }

            if (isDragging && diffX > diffY) {
                e.preventDefault();
            }
        }, { passive: false });

        viewport.addEventListener('touchend', (e) => {
            if (e.target.closest('.video-controls') || e.target.closest('.video-control-btn')) {
                return;
            }
            
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = Math.abs(startY - endY);
            const timeDiff = Date.now() - startTime;

            const minDistance = 30;
            const maxTime = 500;
            
            const isValidSwipe = Math.abs(diffX) > minDistance && 
                               Math.abs(diffX) > diffY && 
                               timeDiff < maxTime;
            
            if (isValidSwipe) {
                if (diffX > 0) {
                    this.nextProject();
                } else {
                    this.prevProject();
                }
            }

            isDragging = false;
        }, { passive: true });

        viewport.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isMouseDown = true;
            isDragging = false;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const diffX = Math.abs(e.clientX - startX);
            const diffY = Math.abs(e.clientY - startY);
            
            if (!isDragging && (diffX > 5 || diffY > 5)) {
                isDragging = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            
            if (isDragging) {
                const endX = e.clientX;
                const diffX = startX - endX;
                
                if (Math.abs(diffX) > 30) {
                    if (diffX > 0) {
                        this.nextProject();
                    } else {
                        this.prevProject();
                    }
                }
            }
            
            isMouseDown = false;
            isDragging = false;
        });
        
        this.log('Mobile touch events setup complete');
    }

    goToMobileSlide(index) {
        this.mobileCurrentIndex = Math.max(0, Math.min(index, this.mobileCards.length - 1));
        this.updateMobilePosition();
        this.updateMobileIndicators();
        this.hideSwipeIndicator();
    }

    nextProject() {
        const totalCards = this.mobileCards.length;

        if (this.mobileCurrentIndex < totalCards - 1) {
            this.goToMobileSlide(this.mobileCurrentIndex + 1);
        }
    }

    prevProject() {
        if (this.mobileCurrentIndex > 0) {
            this.goToMobileSlide(this.mobileCurrentIndex - 1);
        }
    }

    hideSwipeIndicator() {
        const swipeIndicator = this.$('#swipeIndicator');
        if (swipeIndicator && !this.hasInteracted) {
            this.hasInteracted = true;
            swipeIndicator.classList.add('hidden');
        }
    }

    updateMobilePosition() {
        const mobileTrack = this.mobileProjectsTrack;
        const indicators = this.$$('.indicator-dot');
        const mobileCards = this.$$('.mobile-project-card');

        if (!mobileTrack || mobileCards.length === 0) return;

        const viewportWidth = window.innerWidth;
        const cardWidth = viewportWidth - 80;
        const gap = 80;
        const offset = this.mobileCurrentIndex * (cardWidth + gap);

        mobileTrack.style.transform = `translateX(-${offset}px)`;

        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.mobileCurrentIndex);
        });

        const indicatorsContainer = this.$('#mobileIndicators');
        if (indicatorsContainer && mobileCards.length > 0) {
            const currentCard = mobileCards[this.mobileCurrentIndex];
            if (currentCard) {
                const cardHeight = currentCard.offsetHeight;
                const viewportHeight = this.$('.mobile-project-viewport')?.offsetHeight || 0;
                const indicatorPosition = Math.max(cardHeight, viewportHeight) + 20;
                indicatorsContainer.style.marginTop = `${indicatorPosition - viewportHeight + 10}px`;
            }
        }

        mobileCards.forEach((card, index) => {
            const video = card.querySelector('.project-video');
            if (index === this.mobileCurrentIndex) {
                card.classList.add('focused');
                if (video) {
                    if (video.readyState === 0) {
                        video.load();
                    }

                    const videoKey = `mobile-${index}`;
                    const savedPosition = this.videoPositions.get(videoKey);

                    const playWhenReady = () => {
                        if (savedPosition !== undefined) {
                            video.currentTime = savedPosition;
                        }
                        video.play().catch(console.error);
                    };

                    if (video.readyState >= 2) {
                        playWhenReady();
                    } else {
                        video.addEventListener('canplay', playWhenReady, { once: true });
                    }
                }
            } else {
                card.classList.remove('focused');
                if (video) {
                    const videoKey = `mobile-${index}`;
                    this.videoPositions.set(videoKey, video.currentTime);
                    video.pause();
                }
            }
        });
    }

    updateMobileIndicators() {
        if (!this.mobileIndicators) return;
        
        const indicators = this.mobileIndicators.querySelectorAll('.indicator-dot');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.mobileCurrentIndex);
        });
    }

    handleResize() {
        this.handleTabletCentering();
        this.adjustViewMorePosition();

        if (window.innerWidth <= 768) {
            this.updateMobileCarousel();
        }

        eventBus.emit('carousel:resize', { width: window.innerWidth });
    }

    cleanupState() {
        this.allProjects.forEach(project => {
            project.style.display = '';
            project.style.opacity = '';
            project.style.transform = '';
            project.classList.remove('visible', 'center-in-tablet');
        });

        if (this.mobileProjectsTrack) {
            this.mobileProjectsTrack.innerHTML = '';
        }
        
        if (this.mobileIndicators) {
            this.mobileIndicators.innerHTML = '';
        }

        this.currentBatch = 0;
        this.mobileCurrentIndex = 0;
        this.mobileCards = [];
        this.hasInteracted = false;
        
        this.log('Project carousel cleaned up');
    }
}