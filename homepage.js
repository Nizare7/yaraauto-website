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
});