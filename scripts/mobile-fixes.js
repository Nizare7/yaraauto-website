/**
 * Mobile Performance Fixes
 * Risolve problemi di glitching e scroll su dispositivi mobile
 */

(function() {
    'use strict';
    
    // Detect if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Skip on desktop
    
    // Fix 1: Prevent scroll jump on touch
    document.addEventListener('DOMContentLoaded', function() {
        
        // Fix card touch interactions
        const carCards = document.querySelectorAll('.car-card');
        
        carCards.forEach(card => {
            let touchStartY = 0;
            let touchStartTime = 0;
            let isScrolling = false;
            
            // Prevent sticky active states
            card.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isScrolling = false;
                
                // Add active class for visual feedback
                this.classList.add('touch-active');
            }, { passive: true });
            
            card.addEventListener('touchmove', function(e) {
                const touchMoveY = e.touches[0].clientY;
                const deltaY = Math.abs(touchMoveY - touchStartY);
                
                // Detect if user is scrolling
                if (deltaY > 10) {
                    isScrolling = true;
                    this.classList.remove('touch-active');
                }
            }, { passive: true });
            
            card.addEventListener('touchend', function(e) {
                const touchDuration = Date.now() - touchStartTime;
                
                // Remove active state
                this.classList.remove('touch-active');
                
                // Prevent accidental clicks during scroll
                if (isScrolling || touchDuration > 500) {
                    e.preventDefault();
                    return false;
                }
            });
            
            // Ensure active state is removed on touchcancel
            card.addEventListener('touchcancel', function() {
                this.classList.remove('touch-active');
            });
        });
        
        // Fix 2: Prevent iOS momentum scroll issues
        if (isIOS) {
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Prevent elastic scroll at top and fix disappearing elements
            let lastScrollTop = 0;
            let scrollCheckInterval = null;
            
            const checkScroll = () => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Prevent bounce at top
                if (scrollTop < 0) {
                    window.scrollTo(0, 0);
                }
                
                // iOS-specific fix: Force repaint if scroll changed significantly
                if (Math.abs(scrollTop - lastScrollTop) > 100) {
                    requestAnimationFrame(() => {
                        // Force all cards to be visible
                        const cards = document.querySelectorAll('.car-card');
                        cards.forEach(card => {
                            if (window.getComputedStyle(card).opacity === '0') {
                                card.style.opacity = '1';
                                card.style.visibility = 'visible';
                            }
                        });
                    });
                }
                
                lastScrollTop = scrollTop;
            };
            
            window.addEventListener('scroll', checkScroll, { passive: true });
            
            // Periodic check for stuck elements (iOS bug workaround)
            scrollCheckInterval = setInterval(() => {
                if (!isScrolling) {
                    const cards = document.querySelectorAll('.car-card');
                    cards.forEach(card => {
                        const rect = card.getBoundingClientRect();
                        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
                        
                        if (isInViewport && window.getComputedStyle(card).opacity === '0') {
                            card.style.opacity = '1';
                            card.style.visibility = 'visible';
                            card.style.transform = 'translateZ(0)';
                        }
                    });
                }
            }, 1000); // Check every second
        }
        
        // Fix 3: Optimize image rendering
        const images = document.querySelectorAll('.car-image img, .carousel-slide img');
        images.forEach(img => {
            // Force GPU acceleration
            img.style.transform = 'translateZ(0)';
            img.style.backfaceVisibility = 'hidden';
            
            // Prevent image drag on touch devices
            img.addEventListener('touchstart', function(e) {
                e.preventDefault();
            }, { passive: false });
        });
        
        // Fix 4: Debounce scroll events to reduce repaints
        let scrollTimeout;
        let isScrolling = false;
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (!isScrolling) {
                        document.body.classList.add('is-scrolling');
                        isScrolling = true;
                    }
                    ticking = false;
                });
                ticking = true;
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                document.body.classList.remove('is-scrolling');
                isScrolling = false;
                
                // Force repaint after scroll ends to fix any stuck elements
                requestAnimationFrame(() => {
                    const cards = document.querySelectorAll('.car-card');
                    cards.forEach(card => {
                        if (card.style.opacity === '0' || card.style.visibility === 'hidden') {
                            card.style.opacity = '';
                            card.style.visibility = '';
                            card.style.transform = '';
                        }
                    });
                });
            }, 150);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Fix 5: Prevent double-tap zoom on cards
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                if (e.target.closest('.car-card')) {
                    e.preventDefault();
                }
            }
            lastTouchEnd = now;
        }, false);
        
        // Fix 6: Force repaint after orientation change
        window.addEventListener('orientationchange', function() {
            // Force reflow
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
            
            // Scroll to current position to fix any layout issues
            const currentScroll = window.pageYOffset;
            setTimeout(() => {
                window.scrollTo(0, currentScroll);
            }, 100);
        });
        
        // Fix 7: Prevent layout shift during scroll with improved Intersection Observer
        const observerOptions = {
            threshold: [0, 0.1, 0.5, 1],
            rootMargin: '100px 0px' // Increased margin to pre-load earlier
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Use requestAnimationFrame to batch DOM updates
                requestAnimationFrame(() => {
                    if (entry.intersectionRatio > 0) {
                        // Card is visible or about to be
                        entry.target.classList.add('is-visible');
                        
                        // Remove any stuck transforms
                        if (entry.target.style.transform && entry.target.style.transform !== 'translateZ(0)') {
                            entry.target.style.transform = '';
                        }
                    } else if (entry.intersectionRatio === 0) {
                        // Card is completely out of view
                        // Keep is-visible to prevent flickering on fast scroll
                        // Only remove after a delay
                        setTimeout(() => {
                            if (entry.intersectionRatio === 0) {
                                entry.target.classList.remove('is-visible');
                            }
                        }, 500);
                    }
                });
            });
        }, observerOptions);
        
        // Observe all cards
        carCards.forEach(card => {
            observer.observe(card);
            // Ensure initial state
            card.classList.add('is-visible');
        });
        
        // Fix 8: Force final repaint after page load (iOS critical fix)
        window.addEventListener('load', () => {
            setTimeout(() => {
                const allCards = document.querySelectorAll('.car-card');
                allCards.forEach(card => {
                    // Force visibility
                    card.style.opacity = '1';
                    card.style.visibility = 'visible';
                    card.style.display = 'block';
                    
                    // Remove any problematic inline transforms
                    if (card.style.transform && 
                        card.style.transform !== 'translateZ(0)' && 
                        card.style.transform !== 'translate3d(0, 0, 0)') {
                        card.style.transform = 'translateZ(0)';
                    }
                });
                
                // Force browser repaint
                document.body.style.display = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.display = '';
                
                console.log('Mobile fixes: Final repaint completed');
            }, 1000);
        });
        
        console.log('Mobile performance fixes applied');
    });
})();
