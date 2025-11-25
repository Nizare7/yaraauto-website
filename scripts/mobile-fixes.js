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
            
            // Prevent elastic scroll at top
            let lastScrollTop = 0;
            window.addEventListener('scroll', function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Prevent bounce at top
                if (scrollTop < 0) {
                    window.scrollTo(0, 0);
                }
                
                lastScrollTop = scrollTop;
            }, { passive: true });
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
        
        window.addEventListener('scroll', function() {
            if (!isScrolling) {
                document.body.classList.add('is-scrolling');
                isScrolling = true;
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                document.body.classList.remove('is-scrolling');
                isScrolling = false;
            }, 150);
        }, { passive: true });
        
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
        
        // Fix 7: Prevent layout shift during scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Card is visible
                    entry.target.classList.add('is-visible');
                } else {
                    // Card is not visible - reduce GPU load
                    entry.target.classList.remove('is-visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        // Observe all cards
        carCards.forEach(card => observer.observe(card));
        
        console.log('Mobile performance fixes applied');
    });
})();
