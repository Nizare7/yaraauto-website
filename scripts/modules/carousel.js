/**
 * Carousel Module
 * Handles image carousels for car cards
 */

import { getCarTitle, getCarEmoji } from './utils.js';

export const carousels = new Map();

// Create carousel for multiple images
export function createImageCarousel(car) {
    const carousel = document.createElement('div');
    carousel.className = 'image-carousel';

    const track = document.createElement('div');
    track.className = 'carousel-track';

    // Create slide for each image with lazy loading
    car.gallery.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const img = document.createElement('img');
        // Lazy load: only first image loads immediately, others use data-src
        if (index === 0) {
            img.src = imageSrc;
        } else {
            img.setAttribute('data-src', imageSrc);
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'; // placeholder
            img.classList.add('lazy-load');
        }
        img.alt = `${getCarTitle(car)} - Foto ${index + 1}`;
        img.loading = 'lazy'; // Browser native lazy loading
        img.onerror = () => {
            slide.innerHTML = getCarEmoji();
            slide.style.fontSize = '4rem';
            slide.style.display = 'flex';
            slide.style.alignItems = 'center';
            slide.style.justifyContent = 'center';
        };

        slide.appendChild(img);
        track.appendChild(slide);
    });

    carousel.appendChild(track);

    // Navigation controls
    if (car.gallery.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-nav carousel-prev';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-nav carousel-next';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        // Indicators
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';

        car.gallery.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            indicators.appendChild(dot);
        });

        carousel.appendChild(prevBtn);
        carousel.appendChild(nextBtn);
        carousel.appendChild(indicators);

        // Initialize carousel
        initCarousel(carousel, car.id);
    }

    return carousel;
}

// Initialize carousel logic
export function initCarousel(carouselElement, carId) {
    const track = carouselElement.querySelector('.carousel-track');
    const slides = carouselElement.querySelectorAll('.carousel-slide');
    const prevBtn = carouselElement.querySelector('.carousel-prev');
    const nextBtn = carouselElement.querySelector('.carousel-next');
    const dots = carouselElement.querySelectorAll('.carousel-dot');

    let currentIndex = 0;

    const updateCarousel = () => {
        const translateX = -currentIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;

        // Update indicators
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Load adjacent images when needed (lazy loading)
        const currentSlide = slides[currentIndex];
        const prevSlide = slides[currentIndex - 1];
        const nextSlide = slides[currentIndex + 1];
        
        [currentSlide, prevSlide, nextSlide].forEach(slide => {
            if (slide) {
                const img = slide.querySelector('img.lazy-load');
                if (img && img.hasAttribute('data-src')) {
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    img.classList.remove('lazy-load');
                }
            }
        });
    };

    const goToPrev = (e) => {
        e.stopPropagation();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
        updateCarousel();
    };

    const goToNext = (e) => {
        e.stopPropagation();
        currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
        updateCarousel();
    };

    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = index;
            updateCarousel();
        });
    });

    // Touch support (swipe)
    let touchStartX = 0;
    
    carouselElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carouselElement.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            goToNext(e); // Swipe left
        } else if (touchEndX - touchStartX > 50) {
            goToPrev(e); // Swipe right
        }
    }, { passive: true });

    // Store carousel instance
    carousels.set(carId, {
        element: carouselElement,
        cleanup: () => {
            prevBtn.removeEventListener('click', goToPrev);
            nextBtn.removeEventListener('click', goToNext);
        }
    });
}
