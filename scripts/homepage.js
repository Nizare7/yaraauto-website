// Simple script for homepage
document.addEventListener('DOMContentLoaded', function() {
    // Mobile contacts menu toggle
    initMobileContactsMenu();
    
    // Add any interactive effects or animations for the homepage
    
    // Smooth scroll effect for CTA button (if needed)
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            // Add a little animation feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    }
    
    // Optional: Add some entrance animation to the hero section
    const hero = document.querySelector('.homepage-hero');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            hero.style.transition = 'all 0.8s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Dealership Gallery Carousel
    initDealershipCarousel();
});

// Mobile contacts menu functionality
function initMobileContactsMenu() {
    const toggleBtn = document.getElementById('mobileContactsToggle');
    const menu = document.getElementById('mobileContactsMenu');
    
    if (!toggleBtn || !menu) return;
    
    // Toggle menu on button click
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = menu.classList.contains('active');
        
        if (isActive) {
            closeContactsMenu();
        } else {
            openContactsMenu();
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menu.contains(e.target) && e.target !== toggleBtn) {
            closeContactsMenu();
        }
    });
    
    // Prevent menu clicks from closing the menu
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    function openContactsMenu() {
        menu.classList.add('active');
        toggleBtn.classList.add('active');
    }
    
    function closeContactsMenu() {
        menu.classList.remove('active');
        toggleBtn.classList.remove('active');
    }
}

function initDealershipCarousel() {
    const carousel = document.querySelector('.dealership-carousel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.dealership-track');
    const slides = carousel.querySelectorAll('.dealership-slide');
    const leftArrow = carousel.querySelector('.dealership-arrow-left');
    const rightArrow = carousel.querySelector('.dealership-arrow-right');
    const dots = carousel.querySelectorAll('.dealership-dot');
    
    let currentIndex = 0;
    let autoPlayInterval = null;
    let isUserInteracting = false;
    
    // Consistent timing for all devices
    const autoPlayDelay = 7000; // 7 seconds for all devices
    
    // Set initial center slide
    updateCarousel();
    
    // Auto-play functionality - COMPLETELY REWRITTEN
    function startAutoPlay() {
        // Always clear any existing interval first
        stopAutoPlay();
        
        if (!isUserInteracting) {
            autoPlayInterval = setInterval(() => {
                if (!isUserInteracting) {
                    currentIndex = (currentIndex + 1) % slides.length;
                    updateCarousel();
                }
            }, autoPlayDelay);
        }
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    // Universal function to handle any user interaction
    function handleUserInteraction() {
        isUserInteracting = true;
        stopAutoPlay();
        
        // Restart after delay
        setTimeout(() => {
            isUserInteracting = false;
            startAutoPlay();
        }, 3000); // Fixed 3 second delay for all interactions
    }
    
    // Update carousel position and center slide
    function updateCarousel() {
        // Remove center class from all slides
        slides.forEach(slide => slide.classList.remove('center'));
        
        // Add center class to current slide
        slides[currentIndex].classList.add('center');
        
        // CENTRATURA CORRETTA: L'immagine attiva deve essere AL CENTRO ASSOLUTO della pagina
        // Responsive slide dimensions
        const isMobile = window.innerWidth <= 768;
        const slideWidth = isMobile ? 280 : 420;
        const gap = isMobile ? 15 : 20;
        const slideWithGap = slideWidth + gap;
        const leftOffset = isMobile ? -30 : -60; // Different offset for mobile
        
        // Calcolo per centrare PERFETTAMENTE la slide attiva
        const offsetToCenter = -(currentIndex * slideWithGap) - (slideWidth / 2) + leftOffset;
        
        track.style.transform = `translateX(${offsetToCenter}px)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Arrow navigation - SIMPLIFIED
    leftArrow.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
        handleUserInteraction();
    });
    
    rightArrow.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
        handleUserInteraction();
    });
    
    // Dot navigation - SIMPLIFIED
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
            handleUserInteraction();
        });
    });
    
    // Pause auto-play on hover - SIMPLIFIED
    carousel.addEventListener('mouseenter', () => {
        isUserInteracting = true;
        stopAutoPlay();
    });
    
    carousel.addEventListener('mouseleave', () => {
        isUserInteracting = false;
        startAutoPlay();
    });
    
    // Handle window resize
    window.addEventListener('resize', updateCarousel);
    
    // Touch/swipe support - COMPLETELY REWRITTEN
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        // Don't stop auto-play on touch start, only on actual swipe
    });
    
    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const touchDiff = touchStartX - touchEndX;
        const minSwipeDistance = 80; // Increased threshold to prevent accidental swipes
        
        if (Math.abs(touchDiff) > minSwipeDistance) {
            if (touchDiff > 0) {
                // Swipe left - next slide
                currentIndex = (currentIndex + 1) % slides.length;
            } else {
                // Swipe right - previous slide
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            }
            updateCarousel();
            handleUserInteraction(); // Use unified handler
        }
    });
    
    // Prevent scrolling when swiping on carousel
    carousel.addEventListener('touchmove', (e) => {
        const touchCurrentX = e.changedTouches[0].screenX;
        const touchDiff = Math.abs(touchStartX - touchCurrentX);
        
        // Only prevent default if it's a horizontal swipe
        if (touchDiff > 10) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Start auto-play - AT THE END
    startAutoPlay();
}