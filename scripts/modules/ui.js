/**
 * UI Module
 * Handles DOM manipulation and rendering
 */

import { getBrandEmoji, getCarEmoji, getCarTitle, formatPrice, formatNumber, hidePageLoader, showNotification } from './utils.js';
import { createImageCarousel, carousels, initCarousel } from './carousel.js';
import { applyFilters } from './filters.js';

// State
let loadedData = null;
let lightbox = null;
let currentLightboxImages = [];
let currentLightboxIndex = 0;
let carDetailModal = null;
let currentCarDetailImages = [];
let currentCarDetailIndex = 0;
let mobileFullscreenOverlay = null;

// Initialize UI
export function initUI(data) {
    loadedData = data;
    
    // Setup global event listeners
    setupScrollBehavior();
    setupLightbox();
    setupCarDetailModal();
    initMobileContactsMenu();
    createMobileFilterSystem(); // Initial setup

    // Handle window resize to manage mobile filter system and carousel
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const mobileButton = document.getElementById('mobileFilterButton');
            const mobileOverlay = document.getElementById('mobileFilterOverlay');
            const mobilePopup = document.getElementById('mobileFilterPopup');
            
            if (window.innerWidth > 1400) {
                // Remove mobile elements on desktop
                if (mobileButton) mobileButton.remove();
                if (mobileOverlay) mobileOverlay.remove();
                if (mobilePopup) mobilePopup.remove();
            } else if (window.innerWidth <= 1400 && !mobileButton) {
                // Create mobile elements on mobile and tablet (including landscape) if they don't exist
                createMobileFilterSystem();
            }
            
            // Regenerate recently added section to switch between grid and carousel
            // Re-apply current filters or default
            const currentFilters = {}; // Ideally we should store current filters in state
            generateCarSections(currentFilters);
            
        }, 250); // Debounce resize events
    });
}

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
            menu.classList.remove('active');
            toggleBtn.classList.remove('active');
        } else {
            menu.classList.add('active');
            toggleBtn.classList.add('active');
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menu.contains(e.target) && e.target !== toggleBtn) {
            menu.classList.remove('active');
            toggleBtn.classList.remove('active');
        }
    });
    
    // Prevent menu clicks from closing the menu
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Generate brands horizontal scroll
export function generateBrands() {
    const brandsScrollTrack = document.querySelector('.brands-scroll-track');
    if (!brandsScrollTrack || !loadedData) return;

    brandsScrollTrack.innerHTML = '';
    
    // Sort brands alphabetically (A to Z)
    const sortedBrands = [...loadedData.brands].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedBrands.forEach(brand => {
        const brandElement = createBrandElement(brand);
        brandsScrollTrack.appendChild(brandElement);
    });

    // Setup scroll functionality
    setupBrandScroll();
}

// Create single brand element
function createBrandElement(brand) {
    const brandItem = document.createElement('div');
    brandItem.className = 'brand-item';
    brandItem.setAttribute('data-brand', brand.id);

    const logoImg = document.createElement('img');
    logoImg.src = brand.logo;
    logoImg.alt = brand.name;
    logoImg.onerror = () => {
        logoImg.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.innerHTML = getBrandEmoji(brand.id);
        placeholder.style.fontSize = '2rem';
        placeholder.style.fontWeight = 'bold';
        placeholder.style.color = '#0D0D0D';
        brandItem.replaceChild(placeholder, logoImg);
    };

    const brandName = document.createElement('span');
    brandName.textContent = brand.name;

    brandItem.appendChild(logoImg);
    brandItem.appendChild(brandName);

    // Add click event to scroll to brand section
    brandItem.addEventListener('click', () => {
        // Only scroll if not disabled
        if (!brandItem.classList.contains('disabled')) {
            scrollToBrand(brand.id);
        }
    });

    return brandItem;
}

// Generate all car sections
export function generateCarSections(filters = {}) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent || !loadedData) return;

    // Cleanup existing carousels to free memory
    if (carousels.size > 0) {
        carousels.forEach(carousel => {
            if (carousel.cleanup) {
                carousel.cleanup();
            }
        });
        carousels.clear();
    }

    // Remove existing car sections and recently added section
    document.querySelectorAll('.cars-section, .recently-added-section').forEach(section => section.remove());

    // Find where to insert car sections (after unified filters-and-brands section)
    const unifiedSection = document.querySelector('.filters-and-brands-section');
    const insertionPoint = unifiedSection || document.querySelector('.filters-section') || document.querySelector('.brands-nav');
    
    // Create "Aggiunte di recente" section first (only if it has content)
    const recentlyAddedSection = createRecentlyAddedSection(filters);
    let lastInsertedElement = insertionPoint;
    
    if (recentlyAddedSection) {
        insertionPoint.insertAdjacentElement('afterend', recentlyAddedSection);
        lastInsertedElement = recentlyAddedSection;
    }
    
    // Sort brands alphabetically (A to Z)
    const sortedBrands = [...loadedData.brands].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create all sections and insert them in correct order
    sortedBrands.forEach((brand, index) => {
        // Apply filters to brand cars
        let filteredCars = brand.cars || [];
        
        if (Object.keys(filters).length > 0) {
            filteredCars = applyFilters(filteredCars, filters);
        }
        
        // Only show brand section if it has cars after filtering
        if (filteredCars.length > 0 || Object.keys(filters).length === 0) {
            const sectionElement = createBrandSection({...brand, cars: filteredCars});
            
            // Insert after the last inserted element
            if (lastInsertedElement) {
                lastInsertedElement.insertAdjacentElement('afterend', sectionElement);
                lastInsertedElement = sectionElement;
            } else {
                 // Fallback if no insertion point found
                 mainContent.appendChild(sectionElement);
            }
        }
    });

    // Update brands to reflect filter state AFTER car sections are generated
    updateBrandsState(filters);

    // Trigger animations for all car cards after they are inserted
    setTimeout(() => {
        animateCarCards();
    }, 50);
}

// Update brands state (disabled/enabled) based on filters
function updateBrandsState(filters) {
    const brandItems = document.querySelectorAll('.brand-item');
    
    brandItems.forEach(item => {
        const brandId = item.getAttribute('data-brand');
        const brandData = loadedData.brands.find(b => b.id === brandId);
        
        if (!brandData) return;
        
        let hasVisibleCars = false;
        if (brandData.cars && brandData.cars.length > 0) {
            const filteredCars = applyFilters(brandData.cars, filters);
            if (filteredCars.length > 0) {
                hasVisibleCars = true;
            }
        }
        
        if (hasVisibleCars) {
            item.classList.remove('disabled');
        } else {
            item.classList.add('disabled');
        }
    });
}

// Create section for a brand
function createBrandSection(brand) {
    const section = document.createElement('section');
    section.id = brand.id;
    section.className = 'cars-section';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = brand.name;

    const carsGrid = document.createElement('div');
    carsGrid.className = 'cars-grid';

    // Check if brand has cars
    if (brand.cars && brand.cars.length > 0) {
        // Sort cars alphabetically by name
        const sortedCars = [...brand.cars].sort((a, b) => a.name.localeCompare(b.name));

        sortedCars.forEach(car => {
            const carElement = createCarCard(car);
            carsGrid.appendChild(carElement);
        });
    } else {
        // Create "no cars available" message
        const noCarsMsgDiv = document.createElement('div');
        noCarsMsgDiv.className = 'no-cars-message';
        noCarsMsgDiv.innerHTML = `
            <div class="no-cars-content">
                <i class="fas fa-car" style="font-size: 3rem; color: #666; margin-bottom: 1rem;"></i>
                <p>Nessuna auto disponibile al momento</p>
            </div>
        `;
        carsGrid.appendChild(noCarsMsgDiv);
    }

    section.appendChild(title);
    section.appendChild(carsGrid);

    return section;
}

// Create single car card
function createCarCard(car, isRecentlyAdded = false) {
    const carCard = document.createElement('div');
    carCard.className = 'car-card';

    // Car image with carousel
    const carImage = document.createElement('div');
    carImage.className = 'car-image';

    // If it has a gallery with multiple images, create carousel
    if (car.gallery && car.gallery.length > 1) {
        const carousel = createImageCarousel(car);
        carImage.appendChild(carousel);
    } else {
        // Single image or fallback
        if (car.image && car.image.trim() !== '') {
            const img = document.createElement('img');
            img.src = car.image;
            img.alt = getCarTitle(car);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.onerror = () => {
                carImage.innerHTML = getCarEmoji();
                carImage.style.fontSize = '4rem';
            };
            carImage.appendChild(img);
        } else {
            carImage.innerHTML = getCarEmoji();
            carImage.style.fontSize = '4rem';
        }
    }

    // Car information
    const carInfo = document.createElement('div');
    carInfo.className = 'car-info';

    const carTitle = document.createElement('h3');
    carTitle.className = 'car-title';
    carTitle.textContent = getCarTitle(car);

    const carDetails = document.createElement('p');
    carDetails.className = 'car-details';
    carDetails.innerHTML = `
        Anno: ${car.anno}<br>
        Km: ${formatNumber(car.chilometraggio)}<br>
        Alimentazione: ${car.carburante}<br>
        Cambio: ${car.tipo_cambio}
    `;

    const carPrice = document.createElement('div');
    carPrice.className = 'car-price';
    carPrice.textContent = formatPrice(car.prezzo);

    carInfo.appendChild(carTitle);
    carInfo.appendChild(carDetails);
    carInfo.appendChild(carPrice);

    carCard.appendChild(carImage);
    carCard.appendChild(carInfo);

    // Add "Novità" tag if applicable
    if (car.aggiunto === true) {
        const recentlyAddedTag = document.createElement('div');
        recentlyAddedTag.className = 'recently-added-tag';
        recentlyAddedTag.textContent = 'Novità';
        carCard.appendChild(recentlyAddedTag);
    }

    // Add click listener to open car detail modal
    carCard.addEventListener('click', (e) => {
        // Prevent propagation for carousel controls
        if (e.target.closest('.carousel-nav') || e.target.closest('.carousel-dot')) {
            return;
        }
        openCarDetailModal(car);
    });

    // Entry animation handled by CSS class
    carCard.classList.add('card-enter');

    return carCard;
}

// Create "Aggiunte di recente" section
function createRecentlyAddedSection(filters = {}) {
    const section = document.createElement('section');
    section.className = 'recently-added-section';

    const title = document.createElement('h2');
    title.className = 'recently-added-title';
    title.innerHTML = 'AGGIUNTE DI RECENTE';

    // Check if mobile/tablet to create carousel or grid
    const isMobile = window.innerWidth <= 1400;
    
    let carsContainer;
    if (isMobile) {
        // Create carousel for mobile and tablet
        carsContainer = document.createElement('div');
        carsContainer.className = 'recently-added-carousel';
        
        const carouselTrack = document.createElement('div');
        carouselTrack.className = 'recently-added-carousel-track';
        carsContainer.appendChild(carouselTrack);
        
        // Add navigation container with arrows and indicators
        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'recently-added-carousel-navigation';
        
        const prevArrow = document.createElement('button');
        prevArrow.className = 'recently-added-carousel-arrow recently-added-carousel-prev';
        prevArrow.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevArrow.setAttribute('aria-label', 'Precedente');
        navigationContainer.appendChild(prevArrow);
        
        const indicators = document.createElement('div');
        indicators.className = 'recently-added-carousel-indicators';
        navigationContainer.appendChild(indicators);
        
        const nextArrow = document.createElement('button');
        nextArrow.className = 'recently-added-carousel-arrow recently-added-carousel-next';
        nextArrow.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextArrow.setAttribute('aria-label', 'Successivo');
        navigationContainer.appendChild(nextArrow);
        
        carsContainer.appendChild(navigationContainer);
    } else {
        // Create grid for desktop
        carsContainer = document.createElement('div');
        carsContainer.className = 'recently-added-grid';
    }

    // Get all recently added cars from all brands
    const recentlyAddedCars = [];
    
    loadedData.brands.forEach(brand => {
        if (brand.cars) {
            brand.cars.forEach(car => {
                if (car.aggiunto === true) {
                    // Add brand information to the car
                    const carWithBrand = { ...car, brandName: brand.name, brandId: brand.id };
                    recentlyAddedCars.push(carWithBrand);
                }
            });
        }
    });

    // Apply filters to recently added cars
    let filteredRecentCars = recentlyAddedCars;
    if (Object.keys(filters).length > 0) {
        filteredRecentCars = applyFilters(recentlyAddedCars, filters);
    }

    // Check if there are recently added cars after filtering
    if (filteredRecentCars.length > 0) {
        // Sort by price (descending) to show more expensive cars first
        const sortedCars = [...filteredRecentCars].sort((a, b) => b.prezzo - a.prezzo);

        if (isMobile) {
            // Create carousel slides for mobile
            const track = carsContainer.querySelector('.recently-added-carousel-track');
            const indicators = carsContainer.querySelector('.recently-added-carousel-indicators');
            
            sortedCars.forEach((car, index) => {
                const slideElement = document.createElement('div');
                slideElement.className = 'recently-added-carousel-slide';
                
                const carElement = createCarCard(car, true);
                slideElement.appendChild(carElement);
                track.appendChild(slideElement);
                
                // Create indicator
                const indicator = document.createElement('button');
                indicator.className = 'recently-added-carousel-dot';
                if (index === 0) indicator.classList.add('active');
                indicator.setAttribute('data-slide', index);
                indicators.appendChild(indicator);
            });
            
            // Initialize carousel functionality
            initRecentlyAddedCarousel(carsContainer, sortedCars.length);
        } else {
            // Create grid for desktop
            sortedCars.forEach(car => {
                const carElement = createCarCard(car, true);
                carsContainer.appendChild(carElement);
            });
        }
    } else {
        // Se ci sono filtri applicati e nessuna auto corrisponde, nascondi la sezione
        if (Object.keys(filters).length > 0) {
            return null; // Non creare la sezione
        }
        
        // Se non ci sono filtri, mostra il messaggio "nessuna novità"
        const noRecentMsgDiv = document.createElement('div');
        noRecentMsgDiv.className = 'no-recently-added';
        noRecentMsgDiv.innerHTML = `
            <i class="fas fa-plus-circle" style="font-size: 3rem; color: #D93829; margin-bottom: 1rem; display: block;"></i>
            Nessuna novità al momento
        `;
        
        if (isMobile) {
            const track = carsContainer.querySelector('.recently-added-carousel-track');
            track.appendChild(noRecentMsgDiv);
        } else {
            carsContainer.appendChild(noRecentMsgDiv);
        }
    }

    section.appendChild(title);
    section.appendChild(carsContainer);

    return section;
}

function initRecentlyAddedCarousel(carousel, totalSlides) {
    if (totalSlides <= 1) return;
    
    const track = carousel.querySelector('.recently-added-carousel-track');
    const prevBtn = carousel.querySelector('.recently-added-carousel-prev');
    const nextBtn = carousel.querySelector('.recently-added-carousel-next');
    const dots = carousel.querySelectorAll('.recently-added-carousel-dot');
    
    let currentIndex = 0;
    
    const updateCarousel = () => {
        const offset = -currentIndex * 100;
        track.style.transform = `translateX(${offset}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    };
    
    const goToPrev = () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : totalSlides - 1;
        updateCarousel();
    };
    
    const goToNext = () => {
        currentIndex = currentIndex < totalSlides - 1 ? currentIndex + 1 : 0;
        updateCarousel();
    };
    
    prevBtn.addEventListener('click', goToPrev);
    nextBtn.addEventListener('click', goToNext);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    // Touch support (swipe)
    let touchStartX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            goToNext(); // Swipe left
        } else if (touchEndX - touchStartX > 50) {
            goToPrev(); // Swipe right
        }
    }, { passive: true });
}

// Animate car cards
function animateCarCards() {
    const isMobile = window.innerWidth <= 1400;
    const carCards = document.querySelectorAll('.car-card');
    
    carCards.forEach((card, index) => {
        if (isMobile) {
            card.classList.add('visible');
            card.style.opacity = '1';
            card.style.visibility = 'visible';
        } else {
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 50);
        }
    });
}

// Setup brand scroll
function setupBrandScroll() {
    const container = document.querySelector('.brands-scroll-container');
    const track = document.querySelector('.brands-scroll-track');
    if (!container || !track) return;

    let progressBar = container.querySelector('.scroll-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress-bar';
        container.appendChild(progressBar);
    }
    
    let leftArrow = container.querySelector('.scroll-arrow-left');
    let rightArrow = container.querySelector('.scroll-arrow-right');
    
    if (!leftArrow) {
        leftArrow = document.createElement('button');
        leftArrow.className = 'scroll-arrow scroll-arrow-left';
        leftArrow.innerHTML = '‹';
        leftArrow.setAttribute('aria-label', 'Scorri a sinistra');
        container.appendChild(leftArrow);
    }
    
    if (!rightArrow) {
        rightArrow = document.createElement('button');
        rightArrow.className = 'scroll-arrow scroll-arrow-right';
        rightArrow.innerHTML = '›';
        rightArrow.setAttribute('aria-label', 'Scorri a destra');
        container.appendChild(rightArrow);
    }

    let fadeLeft = container.querySelector('.scroll-fade-left');
    let fadeRight = container.querySelector('.scroll-fade-right');
    
    if (!fadeLeft) {
        fadeLeft = document.createElement('div');
        fadeLeft.className = 'scroll-fade-left';
        container.appendChild(fadeLeft);
    }
    
    if (!fadeRight) {
        fadeRight = document.createElement('div');
        fadeRight.className = 'scroll-fade-right';
        container.appendChild(fadeRight);
    }

    const updateScroll = () => {
        const scrollLeft = track.scrollLeft;
        const scrollWidth = track.scrollWidth;
        const clientWidth = track.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        if (maxScroll > 0) {
            const progress = scrollLeft / maxScroll;
            progressBar.style.transform = `scaleX(${progress})`;
            container.classList.add('scrolling');
        } else {
            container.classList.remove('scrolling');
        }

        container.classList.toggle('can-scroll-left', scrollLeft > 0);
        container.classList.toggle('can-scroll-right', scrollLeft < maxScroll);
    };

    const scrollAmount = 200;
    
    leftArrow.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    
    rightArrow.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    track.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            // Only prevent default if we can scroll
            const maxScroll = track.scrollWidth - track.clientWidth;
            if ((e.deltaY < 0 && track.scrollLeft > 0) || (e.deltaY > 0 && track.scrollLeft < maxScroll)) {
                e.preventDefault();
                track.scrollBy({ left: e.deltaY, behavior: 'smooth' });
            }
        }
    });

    track.addEventListener('scroll', updateScroll);
    setTimeout(updateScroll, 100);
    window.addEventListener('resize', updateScroll);
}

// Scroll to brand
function scrollToBrand(brandId) {
    const brandSection = document.getElementById(brandId);
    if (brandSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = brandSection.offsetTop - headerHeight - 20;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Setup global scroll behavior
function setupScrollBehavior() {
    let lastScrollTop = 0;
    let isScrollingDown = false;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const header = document.querySelector('.header');
        const backToTop = document.getElementById('backToTop');
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            if (!isScrollingDown) {
                header.classList.add('header-hidden');
                isScrollingDown = true;
            }
        } else if (scrollTop < lastScrollTop) {
            if (isScrollingDown) {
                header.classList.remove('header-hidden');
                isScrollingDown = false;
            }
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        
        const isMobile = window.innerWidth <= 1400;
        if (!isMobile) {
            if (scrollTop > 300) {
                 if (backToTop) backToTop.classList.add('visible');
            } else {
                 if (backToTop) backToTop.classList.remove('visible');
            }
        }
    });

    // Back to top click
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Lightbox Logic
function setupLightbox() {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <div class="lightbox-title"></div>
            <button class="lightbox-close"><i class="fas fa-times"></i></button>
            <img class="lightbox-image" src="" alt="">
            <button class="lightbox-nav lightbox-prev"><i class="fas fa-chevron-left"></i></button>
            <button class="lightbox-nav lightbox-next"><i class="fas fa-chevron-right"></i></button>
            <div class="lightbox-counter"></div>
        </div>
    `;
    document.body.appendChild(lightbox);
    
    const closeBtn = lightbox.querySelector('.lightbox-close');
    closeBtn.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    prevBtn.addEventListener('click', lightboxPrev);
    nextBtn.addEventListener('click', lightboxNext);
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
    });
}

function openLightbox(images, startIndex = 0, title = '') {
    currentLightboxImages = images;
    currentLightboxIndex = startIndex;
    updateLightboxContent(title);
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxContent(title = '') {
    const img = lightbox.querySelector('.lightbox-image');
    const counter = lightbox.querySelector('.lightbox-counter');
    const titleElement = lightbox.querySelector('.lightbox-title');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    img.src = currentLightboxImages[currentLightboxIndex];
    counter.textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    if (title) titleElement.textContent = title;

    if (currentLightboxImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        counter.style.display = 'block';
    }
}

function lightboxPrev() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    updateLightboxContent();
}

function lightboxNext() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
    updateLightboxContent();
}

// Car Detail Modal Logic
function setupCarDetailModal() {
    carDetailModal = document.createElement('div');
    carDetailModal.className = 'car-detail-modal';
    carDetailModal.innerHTML = `
        <div class="car-detail-content">
            <button class="car-detail-close"><i class="fas fa-times"></i></button>
            <div class="car-detail-images">
                <div class="car-detail-carousel">
                    <div class="car-detail-track"></div>
                    <button class="car-detail-nav car-detail-prev"><i class="fas fa-chevron-left"></i></button>
                    <button class="car-detail-nav car-detail-next"><i class="fas fa-chevron-right"></i></button>
                    <div class="car-detail-indicators"></div>
                </div>
            </div>
            <div class="car-detail-info">
                <div class="car-detail-header">
                    <h2 class="car-detail-title"></h2>
                    <div class="car-detail-price"></div>
                </div>
                <div class="car-detail-specs">
                    <h3>Specifiche Tecniche</h3>
                    <div class="car-specs-grid"></div>
                </div>
                <div class="car-detail-contact">
                    <h3>Contattami</h3>
                    <div class="contact-info-direct">
                        <a href="tel:+39 320 613 8044" class="contact-item"><i class="fas fa-phone"></i> +39 320 613 8044</a>
                        <a href="mailto:yaraautoo@gmail.com" class="contact-item"><i class="fas fa-envelope"></i> yaraautoo@gmail.com</a>
                        <div class="social-contact-row">
                             <a href="https://www.facebook.com/yaraautoo" target="_blank" class="social-contact-item" title="Facebook"><i class="fab fa-facebook"></i></a>
                             <a href="https://www.instagram.com/yaraauto_srl/" target="_blank" class="social-contact-item" title="Instagram"><i class="fab fa-instagram"></i></a>
                             <a href="https://wa.me/393206138044" target="_blank" class="social-contact-item" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mobile-fullscreen-overlay">
            <button class="mobile-fullscreen-close"><i class="fas fa-times"></i></button>
            <img class="mobile-fullscreen-image" src="" alt="">
            <div class="mobile-fullscreen-controls">
                <button class="mobile-fullscreen-nav mobile-fullscreen-prev"><i class="fas fa-chevron-left"></i></button>
                <div class="mobile-fullscreen-indicators"></div>
                <button class="mobile-fullscreen-nav mobile-fullscreen-next"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="mobile-fullscreen-info"></div>
        </div>
    `;
    document.body.appendChild(carDetailModal);
    
    // Events
    const closeBtn = carDetailModal.querySelector('.car-detail-close');
    closeBtn.addEventListener('click', closeCarDetailModal);
    
    carDetailModal.addEventListener('click', (e) => {
        if (e.target === carDetailModal) closeCarDetailModal();
    });
    
    const prevBtn = carDetailModal.querySelector('.car-detail-prev');
    const nextBtn = carDetailModal.querySelector('.car-detail-next');
    prevBtn.addEventListener('click', carDetailPrev);
    nextBtn.addEventListener('click', carDetailNext);

    // Mobile fullscreen overlay
    mobileFullscreenOverlay = carDetailModal.querySelector('.mobile-fullscreen-overlay');
    const fsCloseBtn = carDetailModal.querySelector('.mobile-fullscreen-close');
    fsCloseBtn.addEventListener('click', closeMobileFullscreen);
    
    mobileFullscreenOverlay.addEventListener('click', (e) => {
        if (e.target === mobileFullscreenOverlay) closeMobileFullscreen();
    });

    const fsPrevBtn = carDetailModal.querySelector('.mobile-fullscreen-prev');
    const fsNextBtn = carDetailModal.querySelector('.mobile-fullscreen-next');
    fsPrevBtn.addEventListener('click', fullscreenPrev);
    fsNextBtn.addEventListener('click', fullscreenNext);

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!carDetailModal.classList.contains('active')) return;
        
        if (mobileFullscreenOverlay.classList.contains('active')) {
             if (e.key === 'Escape') closeMobileFullscreen();
             if (e.key === 'ArrowLeft') fullscreenPrev();
             if (e.key === 'ArrowRight') fullscreenNext();
             return;
        }

        if (e.key === 'Escape') closeCarDetailModal();
        if (e.key === 'ArrowLeft') carDetailPrev();
        if (e.key === 'ArrowRight') carDetailNext();
    });

    // Add swipe
    setupSwipe(carDetailModal.querySelector('.car-detail-images'), carDetailNext, carDetailPrev);
    setupSwipe(mobileFullscreenOverlay.querySelector('.mobile-fullscreen-image'), fullscreenNext, fullscreenPrev);
}

export function openCarDetailModal(car) {
    if (!carDetailModal) setupCarDetailModal();
    
    updateCarDetailContent(car);
    carDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCarDetailModal() {
    if (mobileFullscreenOverlay && mobileFullscreenOverlay.classList.contains('active')) {
        closeMobileFullscreen();
    }
    carDetailModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Update car detail content
function updateCarDetailContent(car) {
    const title = carDetailModal.querySelector('.car-detail-title');
    const price = carDetailModal.querySelector('.car-detail-price');
    const specsGrid = carDetailModal.querySelector('.car-specs-grid');
    
    // Images
    currentCarDetailImages = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image];
    currentCarDetailIndex = 0;
    updateCarDetailCarousel();
    
    // Info
    title.innerHTML = `<span class="car-detail-title-main">${getCarTitle(car)}</span>`;
    price.textContent = formatPrice(car.prezzo);
    
    // Specs - Original Structure
    specsGrid.innerHTML = `
        <div class="car-spec-item">
            <span class="car-spec-label">Anno:</span>
            <span class="car-spec-value">${car.anno}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Chilometraggio:</span>
            <span class="car-spec-value">${formatNumber(car.chilometraggio)} km</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Condizioni:</span>
            <span class="car-spec-value">${car.condizioni || 'Usato'}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Carburante:</span>
            <span class="car-spec-value">${car.carburante}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Cambio:</span>
            <span class="car-spec-value">${car.tipo_cambio}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Cilindrata:</span>
            <span class="car-spec-value">${car.cilindrata > 0 ? car.cilindrata + ' cc' : 'N/A'}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Potenza:</span>
            <span class="car-spec-value">${car.cavalli} CV (${car.kw} kW)</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Euro:</span>
            <span class="car-spec-value">${car.euro}</span>
        </div>
        <div class="car-spec-item">
            <span class="car-spec-label">Posti:</span>
            <span class="car-spec-value">${car.posti}</span>
        </div>
        <div class="car-spec-item ${car.neopatentati === 'SI' || car.neopatentati === true ? 'neopatentati-si' : 'neopatentati-no'}">
            <span class="car-spec-label">Neopatentati:</span>
            <span class="car-spec-value">${car.neopatentati === 'SI' || car.neopatentati === true ? '✅ SI' : '❌ NO'}</span>
        </div>
    `;
}

function updateCarDetailCarousel() {
    const track = carDetailModal.querySelector('.car-detail-track');
    const indicators = carDetailModal.querySelector('.car-detail-indicators');
    const prevBtn = carDetailModal.querySelector('.car-detail-prev');
    const nextBtn = carDetailModal.querySelector('.car-detail-next');
    
    // Clear
    track.innerHTML = '';
    indicators.innerHTML = '';
    
    // Create slides
    currentCarDetailImages.forEach((src, index) => {
        const slide = document.createElement('div');
        slide.className = 'car-detail-slide';
        const img = document.createElement('img');
        img.src = src;
        
        slide.appendChild(img);
        track.appendChild(slide);
        
        // Indicator
        const dot = document.createElement('div');
        dot.className = `car-detail-dot ${index === currentCarDetailIndex ? 'active' : ''}`;
        dot.addEventListener('click', () => {
            currentCarDetailIndex = index;
            updateCarDetailCarousel();
        });
        indicators.appendChild(dot);
        
        // Open fullscreen on click
        img.addEventListener('click', () => openMobileFullscreen(index));
    });
    
    // Position
    track.style.transform = `translateX(-${currentCarDetailIndex * 100}%)`;
    
    if (currentCarDetailImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        indicators.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        indicators.style.display = 'flex';
    }
}

function carDetailNext() {
    currentCarDetailIndex = (currentCarDetailIndex + 1) % currentCarDetailImages.length;
    updateCarDetailCarousel();
}

function carDetailPrev() {
    currentCarDetailIndex = (currentCarDetailIndex - 1 + currentCarDetailImages.length) % currentCarDetailImages.length;
    updateCarDetailCarousel();
}

// Mobile Fullscreen Logic
function openMobileFullscreen(index) {
    // Only used conceptually maybe, but good to have
    updateMobileFullscreenContent(index);
    mobileFullscreenOverlay.classList.add('active');
    document.body.classList.add('mobile-fullscreen-active');
}

function closeMobileFullscreen() {
    mobileFullscreenOverlay.classList.remove('active');
    document.body.classList.remove('mobile-fullscreen-active');
}

function updateMobileFullscreenContent(index) {
    if (typeof index !== 'undefined') currentCarDetailIndex = index; // Sync index
    
    const img = mobileFullscreenOverlay.querySelector('.mobile-fullscreen-image');
    if (currentCarDetailImages[currentCarDetailIndex]) {
        img.src = currentCarDetailImages[currentCarDetailIndex];
    }
    
    const indicators = mobileFullscreenOverlay.querySelector('.mobile-fullscreen-indicators');
    indicators.innerHTML = '';
    currentCarDetailImages.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = `mobile-fullscreen-dot ${i === currentCarDetailIndex ? 'active' : ''}`;
        indicators.appendChild(dot);
    });
    
    const info = mobileFullscreenOverlay.querySelector('.mobile-fullscreen-info');
    info.textContent = `${currentCarDetailIndex + 1} / ${currentCarDetailImages.length}`;
}

function fullscreenNext() {
    currentCarDetailIndex = (currentCarDetailIndex + 1) % currentCarDetailImages.length;
    updateMobileFullscreenContent();
}

function fullscreenPrev() {
    currentCarDetailIndex = (currentCarDetailIndex - 1 + currentCarDetailImages.length) % currentCarDetailImages.length;
    updateMobileFullscreenContent();
}

// Swipe Helper
function setupSwipe(element, onNext, onPrev) {
    if (!element) return;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        if (Math.abs(startY - currentY) > Math.abs(startX - currentX)) {
            // Vertical scroll, ignore
            return;
        }
        if (Math.abs(startX - currentX) > 10) e.preventDefault();
    }, { passive: false });
    
    element.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        if (Math.abs(startX - endX) > 50) {
            if (startX > endX) onNext(); else onPrev();
        }
        isDragging = false;
    }, { passive: true });
}

// Create mobile filter system
export function createMobileFilterSystem() {
    // Only create mobile filter system on mobile and tablet devices (including landscape tablets)
    if (window.innerWidth > 1400) {
        return;
    }
    
    // Create mobile filter button
    const filterButton = document.createElement('button');
    filterButton.className = 'mobile-filter-button';
    filterButton.innerHTML = '<i class="fas fa-filter"></i>';
    filterButton.id = 'mobileFilterButton';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-filter-overlay';
    overlay.id = 'mobileFilterOverlay';
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'mobile-filter-popup';
    popup.id = 'mobileFilterPopup';
    
    // Create header with close button and actions
    const header = document.createElement('div');
    header.className = 'mobile-filter-header';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-filter-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    
    const actions = document.createElement('div');
    actions.className = 'mobile-filter-actions';
    
    const applyBtn = document.createElement('button');
    applyBtn.className = 'mobile-filter-apply';
    applyBtn.textContent = 'Applica';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'mobile-filter-remove';
    removeBtn.textContent = 'Rimuovi';
    
    actions.appendChild(applyBtn);
    actions.appendChild(removeBtn);
    header.appendChild(closeBtn);
    header.appendChild(actions);
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'mobile-filter-content';
    
    // Clone the desktop filters form
    const desktopForm = document.getElementById('carFilters');
    if (desktopForm) {
        content.innerHTML = desktopForm.outerHTML;
        // Update the cloned form ID to avoid conflicts
        const clonedForm = content.querySelector('#carFilters');
        if (clonedForm) {
            clonedForm.id = 'mobileCarFilters';
        }
    }
    
    // Assemble popup - content first, then header at bottom
    popup.appendChild(content);
    popup.appendChild(header);
    
    // Add to DOM
    if (!document.getElementById('mobileFilterButton')) document.body.appendChild(filterButton);
    if (!document.getElementById('mobileFilterOverlay')) document.body.appendChild(overlay);
    if (!document.getElementById('mobileFilterPopup')) document.body.appendChild(popup);
    
    // Setup event listeners
    setupMobileFilterEvents();
}

// Setup mobile filter events
function setupMobileFilterEvents() {
    const filterButton = document.getElementById('mobileFilterButton');
    const brandsFilterButton = document.getElementById('brandsFilterButton');
    const overlay = document.getElementById('mobileFilterOverlay');
    const popup = document.getElementById('mobileFilterPopup');
    
    if (!popup) return;

    const closeBtn = popup.querySelector('.mobile-filter-close');
    const applyBtn = popup.querySelector('.mobile-filter-apply');
    const removeBtn = popup.querySelector('.mobile-filter-remove');
    const mobileForm = document.getElementById('mobileCarFilters');
    
    // Store current scroll position
    let currentScrollPosition = 0;
    
    // Open popup
    const openPopup = () => {
        currentScrollPosition = window.pageYOffset;
        filterButton.classList.add('active');
        filterButton.innerHTML = '<i class="fas fa-times"></i>';
        overlay.classList.add('active');
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Close popup
    const closePopup = () => {
        filterButton.classList.remove('active');
        filterButton.innerHTML = '<i class="fas fa-filter"></i>';
        overlay.classList.remove('active');
        popup.classList.remove('active');
        document.body.style.overflow = '';
        // Restore scroll position
        window.scrollTo(0, currentScrollPosition);
    };
    
    // Event listeners for both filter buttons
    if (filterButton) {
        filterButton.addEventListener('click', openPopup);
    }
    if (brandsFilterButton) {
        brandsFilterButton.addEventListener('click', openPopup);
    }
    
    overlay.addEventListener('click', closePopup);
    closeBtn.addEventListener('click', closePopup);
    
    // Apply filters
    applyBtn.addEventListener('click', () => {
        applyMobileFilters();
        closePopup();
        setTimeout(() => {
            scrollToBrandsSection();
        }, 300);
    });
    
    // Remove filters
    removeBtn.addEventListener('click', () => {
        if (mobileForm) {
            mobileForm.reset();
        }
        applyMobileFilters();
        closePopup();
        setTimeout(() => {
            scrollToBrandsSection();
        }, 300);
    });
    
    // Setup scroll-based visibility management
    setupFilterButtonsVisibility();
}



// Apply mobile filters
function applyMobileFilters() {
    const mobileForm = document.getElementById('mobileCarFilters');
    if (!mobileForm) return;
    
    // Get current brand in view before filtering
    const currentBrand = getCurrentBrandInView();
    
    const formData = new FormData(mobileForm);
    const filters = {
        prezzoMin: parseInt(formData.get('prezzoMin')) || 0,
        prezzoMax: parseInt(formData.get('prezzoMax')) || Infinity,
        annoMin: parseInt(formData.get('annoMin')) || 0,
        annoMax: parseInt(formData.get('annoMax')) || Infinity,
        kmMin: parseInt(formData.get('kmMin')) || 0,
        kmMax: parseInt(formData.get('kmMax')) || Infinity,
        cavalliMin: parseInt(formData.get('cavalliMin')) || 0,
        cavalliMax: parseInt(formData.get('cavalliMax')) || Infinity,
        carburante: formData.get('carburante') || '',
        cambio: formData.get('cambio') || '',
        neopatentati: formData.get('neopatentati') || '',
        euro: formData.get('euro') || ''
    };

    // Apply filters
    generateCarSections(filters);
    
    const hasFilters = filters.prezzoMin > 0 || filters.prezzoMax < Infinity || 
                      filters.annoMin > 0 || filters.annoMax < Infinity || 
                      (filters.neopatentati && filters.neopatentati !== '');
    
    if (hasFilters) {
        showNotification('Filtri applicati', 'success');
    } else {
        showNotification('Filtri rimossi', 'info');
    }
    
    setTimeout(() => {
        restoreScrollPosition(currentBrand);
    }, 100);
}

function getCurrentBrandInView() {
    const brandSections = document.querySelectorAll('.cars-section');
    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const centerY = scrollTop + windowHeight / 2;
    
    for (let section of brandSections) {
        const rect = section.getBoundingClientRect();
        if (centerY >= (rect.top + scrollTop) && centerY <= (rect.top + scrollTop + rect.height)) {
            return section.querySelector('h2')?.textContent.toLowerCase().replace(/\s+/g, '-');
        }
    }
    return null;
}

function restoreScrollPosition(targetBrand) {
    if (!targetBrand) {
        const first = document.querySelector('.cars-section');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    const section = document.getElementById(targetBrand); // Assuming ID is brand ID, but here logic used lowercase name
    // Let's stick to simple logic or search
    const brandSections = document.querySelectorAll('.cars-section');
    let target = null;
    for (let sec of brandSections) {
         if (sec.querySelector('h2')?.textContent.toLowerCase().replace(/\s+/g, '-') === targetBrand) {
             target = sec;
             break;
         }
    }
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupFilterButtonsVisibility() {
    const brandsFilterButton = document.getElementById('brandsFilterButton');
    const mobileFilterButton = document.getElementById('mobileFilterButton');
    const backToTopButton = document.getElementById('backToTop');
    const brandsSection = document.querySelector('.brands-nav');
    
    if (!brandsFilterButton || !mobileFilterButton || !brandsSection) return;
    
    const handleScroll = () => {
        const rect = brandsSection.getBoundingClientRect();
        const isInView = rect.bottom > 0 && rect.top <= window.innerHeight;
        
        if (isInView) {
            brandsFilterButton.classList.remove('hidden');
            mobileFilterButton.classList.add('hidden');
            if (backToTopButton) backToTopButton.classList.remove('visible');
        } else {
            brandsFilterButton.classList.add('hidden');
            mobileFilterButton.classList.remove('hidden');
            if (backToTopButton) backToTopButton.classList.add('visible');
        }
    };
    window.addEventListener('scroll', () => setTimeout(handleScroll, 10));
    handleScroll();
}

function scrollToBrandsSection() {
    const brandsSection = document.querySelector('.brands-nav');
    if (brandsSection) {
        const headerH = document.querySelector('.header')?.offsetHeight || 0;
        window.scrollTo({ top: brandsSection.offsetTop - headerH - 20, behavior: 'smooth' });
    }
}
