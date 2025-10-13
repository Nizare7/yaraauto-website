// Simple script for homepage
document.addEventListener('DOMContentLoaded', function() {
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

function initDealershipCarousel() {
    const carousel = document.querySelector('.dealership-carousel');
    if (!carousel) return;
    
    const track = carousel.querySelector('.dealership-track');
    const slides = carousel.querySelectorAll('.dealership-slide');
    const leftArrow = carousel.querySelector('.dealership-arrow-left');
    const rightArrow = carousel.querySelector('.dealership-arrow-right');
    const dots = carousel.querySelectorAll('.dealership-dot');
    
    let currentIndex = 0;
    let autoPlayInterval;
    const autoPlayDelay = 6000; // 6 seconds - slower transition
    
    // Set initial center slide
    updateCarousel();
    
    // Auto-play functionality
    function startAutoPlay() {
        autoPlayInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        }, autoPlayDelay);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Update carousel position and center slide
    function updateCarousel() {
        // Remove center class from all slides
        slides.forEach(slide => slide.classList.remove('center'));
        
        // Add center class to current slide
        slides[currentIndex].classList.add('center');
        
        // CENTRATURA CORRETTA: L'immagine attiva deve essere AL CENTRO ASSOLUTO della pagina
        const slideWidth = 420; // Updated to new slide width
        const gap = 20;
        const slideWithGap = slideWidth + gap;
        
        // Calcolo per centrare PERFETTAMENTE la slide attiva - spostato più a sinistra
        const offsetToCenter = -(currentIndex * slideWithGap) - (slideWidth / 2) - 60;
        
        track.style.transform = `translateX(${offsetToCenter}px)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Arrow navigation
    leftArrow.addEventListener('click', () => {
        stopAutoPlay();
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
        setTimeout(startAutoPlay, 2000); // Restart auto-play after 2 seconds
    });
    
    rightArrow.addEventListener('click', () => {
        stopAutoPlay();
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
        setTimeout(startAutoPlay, 2000); // Restart auto-play after 2 seconds
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoPlay();
            currentIndex = index;
            updateCarousel();
            setTimeout(startAutoPlay, 2000); // Restart auto-play after 2 seconds
        });
    });
    
    // Pause auto-play on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    
    // Start auto-play
    startAutoPlay();
    
    // Handle window resize
    window.addEventListener('resize', updateCarousel);
}