// Main class to manage the car dealership website
class CarDealer {
    constructor() {
        this.data = null;
        this.carousels = new Map(); // Map to manage carousels
        this.lightbox = null; // Reference to lightbox
        this.currentLightboxImages = []; // Current images in lightbox
        this.currentLightboxIndex = 0; // Current index in lightbox
        this.init();
    }

    // Initialize the application
    async init() {
        try {
            await this.loadData();
            this.generateBrands();
            this.generateCarSections();
            this.setupScrollBehavior();
            this.createLightbox();
        } catch (error) {
            console.error('Errore durante l\'inizializzazione:', error);
            this.showError('Errore nel caricamento dei dati');
        }
    }

    // Load JSON data
    async loadData() {
        try {
            const response = await fetch('cars-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error('Errore nel caricamento del JSON:', error);
            throw error;
        }
    }

    // Generate brands grid
    generateBrands() {
        const brandsGrid = document.querySelector('.brands-grid');
        if (!brandsGrid || !this.data) return;

        brandsGrid.innerHTML = '';
        
        // Sort brands alphabetically
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedBrands.forEach(brand => {
            const brandElement = this.createBrandElement(brand);
            brandsGrid.appendChild(brandElement);
        });
    }

    // Create single brand element
    createBrandElement(brand) {
        const brandLink = document.createElement('a');
        brandLink.href = `#${brand.id}`;
        brandLink.className = 'brand-link';

        const brandLogo = document.createElement('div');
        brandLogo.className = 'brand-logo';

        const logoImg = document.createElement('img');
        logoImg.src = brand.logo;
        logoImg.alt = brand.name;
        logoImg.onerror = () => {
            logoImg.style.display = 'none';
            brandLogo.innerHTML = this.getBrandEmoji(brand.id);
            brandLogo.style.fontSize = '2rem';
            brandLogo.style.fontWeight = 'bold';
            brandLogo.style.color = '#0D0D0D';
        };

        brandLogo.appendChild(logoImg);

        const brandName = document.createElement('span');
        brandName.className = 'brand-name';
        brandName.textContent = brand.name;

        brandLink.appendChild(brandLogo);
        brandLink.appendChild(brandName);

        return brandLink;
    }

    // Generate all car sections
    generateCarSections() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent || !this.data) return;

        // Find where to insert car sections (after brands navigation)
        const brandsNav = document.querySelector('.brands-nav');
        
        // Sort brands alphabetically
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create all sections and insert them in correct order
        sortedBrands.forEach((brand, index) => {
            const sectionElement = this.createBrandSection(brand);
            
            if (index === 0) {
                // Insert first section after brands navigation
                brandsNav.insertAdjacentElement('afterend', sectionElement);
            } else {
                // Insert subsequent sections after the previous section
                const previousSection = document.getElementById(sortedBrands[index - 1].id);
                if (previousSection) {
                    previousSection.insertAdjacentElement('afterend', sectionElement);
                }
            }
        });
    }

    // Create section for a brand
    createBrandSection(brand) {
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
            // Sort cars alphabetically by title
            const sortedCars = [...brand.cars].sort((a, b) => a.title.localeCompare(b.title));

            sortedCars.forEach(car => {
                const carElement = this.createCarCard(car);
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
    createCarCard(car) {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';

        // Car image with carousel
        const carImage = document.createElement('div');
        carImage.className = 'car-image';

        // If it has a gallery with multiple images, create carousel
        if (car.gallery && car.gallery.length > 1) {
            const carousel = this.createImageCarousel(car);
            carImage.appendChild(carousel);
        } else {
            // Single image or fallback
            if (car.image && car.image.trim() !== '') {
                const img = document.createElement('img');
                img.src = car.image;
                img.alt = car.title;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.onerror = () => {
                    carImage.innerHTML = this.getCarEmoji();
                    carImage.style.fontSize = '4rem';
                };
                carImage.appendChild(img);
            } else {
                carImage.innerHTML = this.getCarEmoji();
                carImage.style.fontSize = '4rem';
            }
        }

        // Car information
        const carInfo = document.createElement('div');
        carInfo.className = 'car-info';

        const carTitle = document.createElement('h3');
        carTitle.className = 'car-title';
        carTitle.textContent = car.title;

        const carDetails = document.createElement('p');
        carDetails.className = 'car-details';
        carDetails.innerHTML = `
            Anno: ${car.year}<br>
            Km: ${car.km.toLocaleString('it-IT')}<br>
            Alimentazione: ${car.fuel}<br>
            Cambio: ${car.transmission}
        `;

        const carPrice = document.createElement('div');
        carPrice.className = 'car-price';
        carPrice.textContent = `€ ${car.price.toLocaleString('it-IT')}`;

        carInfo.appendChild(carTitle);
        carInfo.appendChild(carDetails);
        carInfo.appendChild(carPrice);

        carCard.appendChild(carImage);
        carCard.appendChild(carInfo);

        // Entry animation
        carCard.style.opacity = '0';
        carCard.style.transform = 'translateY(20px)';
        carCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        return carCard;
    }

    // Create carousel for multiple images
    createImageCarousel(car) {
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';

        const track = document.createElement('div');
        track.className = 'carousel-track';

        // Create slide for each image
        car.gallery.forEach((imageSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = `${car.title} - Foto ${index + 1}`;
            img.onerror = () => {
                slide.innerHTML = this.getCarEmoji();
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
            this.initCarousel(carousel, car.id);
        }

        return carousel;
    }

    // Initialize carousel logic
    initCarousel(carouselElement, carId) {
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
        };

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        };

        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        };

        const goToSlide = (index) => {
            currentIndex = index;
            updateCarousel();
        };

        // Event listeners
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => goToSlide(index));
        });

        // Auto-play opzionale (commentato per ora)
        /*
        let autoPlayInterval = setInterval(nextSlide, 5000);
        
        carouselElement.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        
        carouselElement.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(nextSlide, 5000);
        });
        */

        // Salva riferimento al carosello
        this.carousels.set(carId, {
            element: carouselElement,
            currentIndex,
            updateCarousel,
            nextSlide,
            prevSlide,
            goToSlide
        });
    }

    // Crea il lightbox modal
    createLightbox() {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <div class="lightbox-title"></div>
                <button class="lightbox-close">
                    <i class="fas fa-times"></i>
                </button>
                <img class="lightbox-image" src="" alt="">
                <button class="lightbox-nav lightbox-prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="lightbox-nav lightbox-next">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <div class="lightbox-counter"></div>
            </div>
        `;

        document.body.appendChild(lightbox);
        this.lightbox = lightbox;

        // Setup event listeners per lightbox
        this.setupLightboxEvents();
    }

    // Setup eventi per il lightbox
    setupLightboxEvents() {
        const lightbox = this.lightbox;
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');

        // Close lightbox
        closeBtn.addEventListener('click', () => this.closeLightbox());
        
        // Click on background to close
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Navigation
        prevBtn.addEventListener('click', () => this.lightboxPrev());
        nextBtn.addEventListener('click', () => this.lightboxNext());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.lightboxPrev();
                    break;
                case 'ArrowRight':
                    this.lightboxNext();
                    break;
            }
        });
    }

    // Open lightbox with images
    openLightbox(images, startIndex = 0, title = '') {
        this.currentLightboxImages = images;
        this.currentLightboxIndex = startIndex;
        
        this.updateLightboxContent(title);
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Block page scroll
    }

    // Close lightbox
    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable page scroll
    }

    // Previous image in lightbox
    lightboxPrev() {
        this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.currentLightboxImages.length) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    // Next image in lightbox
    lightboxNext() {
        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    // Update lightbox content
    updateLightboxContent(title = '') {
        const lightbox = this.lightbox;
        const img = lightbox.querySelector('.lightbox-image');
        const counter = lightbox.querySelector('.lightbox-counter');
        const titleElement = lightbox.querySelector('.lightbox-title');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');

        // Update image
        img.src = this.currentLightboxImages[this.currentLightboxIndex];
        
        // Update counter
        counter.textContent = `${this.currentLightboxIndex + 1} / ${this.currentLightboxImages.length}`;
        
        // Update title
        if (title) {
            titleElement.textContent = title;
        }

        // Show/hide navigation controls
        if (this.currentLightboxImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            counter.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            counter.style.display = 'block';
        }
    }

    // Add event listeners for clickable images
    addImageClickListeners() {
        // For all car images (both single and in carousels)
        document.querySelectorAll('.car-image').forEach(carImage => {
            carImage.addEventListener('click', (e) => {
                const carCard = carImage.closest('.car-card');
                if (!carCard) return;

                // Find car data
                const carTitle = carCard.querySelector('.car-title')?.textContent || '';
                
                // Check if it's a carousel or single image
                const carousel = carImage.querySelector('.image-carousel');
                if (carousel) {
                    // It's a carousel - get all images
                    const slides = carousel.querySelectorAll('.carousel-slide img');
                    const images = Array.from(slides).map(img => img.src).filter(src => src);
                    const currentTrack = carousel.querySelector('.carousel-track');
                    const currentIndex = this.getCurrentCarouselIndex(currentTrack);
                    
                    if (images.length > 0) {
                        this.openLightbox(images, currentIndex, carTitle);
                    }
                } else {
                    // It's a single image
                    const img = carImage.querySelector('img');
                    if (img && img.src) {
                        this.openLightbox([img.src], 0, carTitle);
                    }
                }
            });
        });
    }

    // Find current carousel index
    getCurrentCarouselIndex(track) {
        const transform = track.style.transform;
        if (!transform) return 0;
        
        const match = transform.match(/translateX\((-?\d+)%\)/);
        if (!match) return 0;
        
        const translatePercent = parseInt(match[1]);
        return Math.abs(translatePercent / 100);
    }

    // Setup scroll behavior and animations
    setupScrollBehavior() {
        // Smooth scroll for brand links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
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

        // Card animation on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all car cards
        document.querySelectorAll('.car-card').forEach(card => {
            observer.observe(card);
        });

        // Back to top button
        window.addEventListener('scroll', function() {
            const backToTop = document.getElementById('backToTop');
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        // Add listeners for clickable images
        setTimeout(() => {
            this.addImageClickListeners();
        }, 100); // Small delay to ensure everything is rendered
    }

    // Fallback emojis for brands
    getBrandEmoji(brandId) {
        const emojis = {
            'abarth': '🏁',
            'alfa-romeo': '🏎️',
            'audi': '🚘',
            'bmw': '🏎️',
            'citroen': '🚗',
            'dacia': '🚙',
            'ferrari': '🏎️',
            'fiat': '�',
            'ford': '🚐',
            'honda': '🚙',
            'hyundai': '🚗',
            'jeep': '�',
            'mercedes': '🚖',
            'volkswagen': '🚙'
        };
        return emojis[brandId] || '🚗';
    }

    // Fallback emoji for cars
    getCarEmoji() {
        return '🚗';
    }

    // Show error to user
    showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                background: #ff6b6b;
                color: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
                font-weight: bold;
            `;
            errorDiv.textContent = message;
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
        }
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CarDealer();
});