// Main class to manage the car dealership website
class CarDealer {
    constructor() {
        this.data = null;
        this.carousels = new Map(); // Map to manage carousels
        this.lightbox = null; // Reference to lightbox
        this.currentLightboxImages = []; // Current images in lightbox
        this.currentLightboxIndex = 0; // Current index in lightbox
        this.carDetailModal = null; // Reference to car detail modal
        this.currentCarDetailImages = []; // Current images in car detail modal
        this.currentCarDetailIndex = 0; // Current index in car detail carousel
        this.mobileFullscreenOverlay = null; // Reference to mobile fullscreen overlay
        this.currentFullscreenImages = []; // Current images in mobile fullscreen
        this.currentFullscreenIndex = 0; // Current index in mobile fullscreen
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
            this.createCarDetailModal();
            this.setupFilters(); // Add filter functionality
        } catch (error) {
            console.error('Errore durante l\'inizializzazione:', error);
            this.showError('Errore nel caricamento dei dati');
        }
    }

    // Load JSON data
    async loadData() {
        try {
            const response = await fetch('cars-data2.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error('Errore nel caricamento del JSON:', error);
            throw error;
        }
    }

    // Generate brands horizontal scroll
    generateBrands() {
        const brandsScrollTrack = document.querySelector('.brands-scroll-track');
        if (!brandsScrollTrack || !this.data) return;

        brandsScrollTrack.innerHTML = '';
        
        // Sort brands alphabetically
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedBrands.forEach(brand => {
            const brandElement = this.createBrandElement(brand);
            brandsScrollTrack.appendChild(brandElement);
        });

        // Setup scroll functionality
        this.setupBrandScroll();
    }

    // Create single brand element
    createBrandElement(brand) {
        const brandItem = document.createElement('div');
        brandItem.className = 'brand-item';
        brandItem.setAttribute('data-brand', brand.id);

        const logoImg = document.createElement('img');
        logoImg.src = brand.logo;
        logoImg.alt = brand.name;
        logoImg.onerror = () => {
            logoImg.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.innerHTML = this.getBrandEmoji(brand.id);
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
            this.scrollToBrand(brand.id);
        });

        return brandItem;
    }

    // Generate all car sections
    generateCarSections(filters = {}) {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent || !this.data) return;

        // Remove existing car sections
        document.querySelectorAll('.cars-section').forEach(section => section.remove());

        // Find where to insert car sections (after filters section)
        const filtersSection = document.querySelector('.filters-section');
        const insertionPoint = filtersSection || document.querySelector('.brands-nav');
        
        // Sort brands alphabetically
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create all sections and insert them in correct order
        sortedBrands.forEach((brand, index) => {
            // Apply filters to brand cars
            let filteredCars = brand.cars || [];
            
            if (Object.keys(filters).length > 0) {
                filteredCars = this.applyFilters(filteredCars, filters);
            }
            
            // Only show brand section if it has cars after filtering
            if (filteredCars.length > 0 || Object.keys(filters).length === 0) {
                const sectionElement = this.createBrandSection({...brand, cars: filteredCars});
                
                if (index === 0) {
                    // Insert first section after filters section
                    insertionPoint.insertAdjacentElement('afterend', sectionElement);
                } else {
                    // Find the last inserted section
                    const lastSection = document.querySelector('.cars-section:last-of-type');
                    if (lastSection) {
                        lastSection.insertAdjacentElement('afterend', sectionElement);
                    } else {
                        insertionPoint.insertAdjacentElement('afterend', sectionElement);
                    }
                }
            }
        });

        // Trigger animations for all car cards after they are inserted
        setTimeout(() => {
            this.animateCarCards();
        }, 50);
    }

    // Animate car cards entrance
    animateCarCards() {
        const carCards = document.querySelectorAll('.car-card');
        carCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100); // Stagger animation
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
            Anno: ${car.anno}<br>
            Km: ${car.chilometraggio.toLocaleString('it-IT')}<br>
            Alimentazione: ${car.carburante}<br>
            Cambio: ${car.tipo_cambio}
        `;

        const carPrice = document.createElement('div');
        carPrice.className = 'car-price';
        carPrice.textContent = `€ ${car.prezzo.toLocaleString('it-IT')}`;

        carInfo.appendChild(carTitle);
        carInfo.appendChild(carDetails);
        carInfo.appendChild(carPrice);

        carCard.appendChild(carImage);
        carCard.appendChild(carInfo);

        // Add click listener to open car detail modal
        carCard.addEventListener('click', (e) => {
            // Prevent propagation for carousel controls
            if (e.target.closest('.carousel-nav') || e.target.closest('.carousel-dot')) {
                return;
            }
            this.openCarDetailModal(car);
        });

        // Entry animation
        carCard.style.opacity = '0';
        carCard.style.transform = 'translateY(20px)';
        carCard.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

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

        // Header hide/show on scroll and back to top button
        let lastScrollTop = 0;
        let isScrollingDown = false;
        
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = document.querySelector('.header');
            const backToTop = document.getElementById('backToTop');
            
            // Header hide/show logic
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down and past 100px
                if (!isScrollingDown) {
                    header.classList.add('header-hidden');
                    isScrollingDown = true;
                }
            } else if (scrollTop < lastScrollTop) {
                // Scrolling up
                if (isScrollingDown) {
                    header.classList.remove('header-hidden');
                    isScrollingDown = false;
                }
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
            
            // Back to top button
            if (scrollTop > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        // Note: Removed addImageClickListeners to avoid conflict with car detail modal
    }

    // Setup brand scroll functionality
    setupBrandScroll() {
        const container = document.querySelector('.brands-scroll-container');
        const track = document.querySelector('.brands-scroll-track');
        
        if (!container || !track) return;

        // Create progress bar if not exists
        let progressBar = container.querySelector('.scroll-progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress-bar';
            container.appendChild(progressBar);
        }

        // Create navigation arrows
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

        // Create fade elements if not exist
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

        // Update scroll state
        const updateScroll = () => {
            const scrollLeft = track.scrollLeft;
            const scrollWidth = track.scrollWidth;
            const clientWidth = track.clientWidth;
            const maxScroll = scrollWidth - clientWidth;

            // Update progress bar
            if (maxScroll > 0) {
                const progress = scrollLeft / maxScroll;
                progressBar.style.transform = `scaleX(${progress})`;
                container.classList.add('scrolling');
            } else {
                container.classList.remove('scrolling');
            }

            // Update fade indicators
            container.classList.toggle('can-scroll-left', scrollLeft > 0);
            container.classList.toggle('can-scroll-right', scrollLeft < maxScroll);
        };

        // Arrow click handlers
        const scrollAmount = 200;
        
        leftArrow.addEventListener('click', () => {
            track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', () => {
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Mouse wheel horizontal scroll
        track.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                track.scrollBy({ left: e.deltaY, behavior: 'smooth' });
            }
        });

        // Listen to scroll events
        track.addEventListener('scroll', updateScroll);
        
        // Initial update
        setTimeout(updateScroll, 100);
        
        // Update on resize
        window.addEventListener('resize', updateScroll);
    }

    // Scroll to specific brand section
    scrollToBrand(brandId) {
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

    // Create car detail modal
    createCarDetailModal() {
        const modal = document.createElement('div');
        modal.className = 'car-detail-modal';
        modal.innerHTML = `
            <div class="car-detail-content">
                <button class="car-detail-close">
                    <i class="fas fa-times"></i>
                </button>
                <div class="car-detail-images">
                    <div class="car-detail-carousel">
                        <div class="car-detail-track"></div>
                        <button class="car-detail-nav car-detail-prev">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="car-detail-nav car-detail-next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
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
                            <a href="tel:+39 320 613 8044" class="contact-item">
                                <i class="fas fa-phone"></i>
                                +39 320 613 8044
                            </a>
                            <a href="mailto:yaraautoo@gmail.com" class="contact-item">
                                <i class="fas fa-envelope"></i>
                                yaraautoo@gmail.com
                            </a>
                            <div class="social-contact-row">
                                <a href="https://www.facebook.com/yaraautoo" target="_blank" class="social-contact-item">
                                    <i class="fab fa-facebook"></i>
                                </a>
                                <a href="https://www.instagram.com/yaraauto_srl/" target="_blank" class="social-contact-item">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="https://wa.me/393206138044" target="_blank" class="social-contact-item">
                                    <i class="fab fa-whatsapp"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Mobile fullscreen overlay for images -->
            <div class="mobile-fullscreen-overlay">
                <button class="mobile-fullscreen-close">
                    <i class="fas fa-times"></i>
                </button>
                <img class="mobile-fullscreen-image" src="" alt="">
                <div class="mobile-fullscreen-controls">
                    <button class="mobile-fullscreen-nav mobile-fullscreen-prev">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="mobile-fullscreen-indicators"></div>
                    <button class="mobile-fullscreen-nav mobile-fullscreen-next">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="mobile-fullscreen-info"></div>
            </div>
        `;

        document.body.appendChild(modal);
        this.carDetailModal = modal;
        this.setupCarDetailModalEvents();
    }

    // Setup events for car detail modal
    setupCarDetailModalEvents() {
        const modal = this.carDetailModal;
        const closeBtn = modal.querySelector('.car-detail-close');
        const prevBtn = modal.querySelector('.car-detail-prev');
        const nextBtn = modal.querySelector('.car-detail-next');

        // Close modal
        closeBtn.addEventListener('click', () => this.closeCarDetailModal());
        
        // Click on background to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCarDetailModal();
            }
        });

        // Navigation
        prevBtn.addEventListener('click', () => this.carDetailPrev());
        nextBtn.addEventListener('click', () => this.carDetailNext());

        // Setup mobile fullscreen overlay
        this.mobileFullscreenOverlay = modal.querySelector('.mobile-fullscreen-overlay');
        const fullscreenCloseBtn = modal.querySelector('.mobile-fullscreen-close');
        const fullscreenPrevBtn = modal.querySelector('.mobile-fullscreen-prev');
        const fullscreenNextBtn = modal.querySelector('.mobile-fullscreen-next');
        
        fullscreenCloseBtn.addEventListener('click', () => this.closeMobileFullscreen());
        fullscreenPrevBtn.addEventListener('click', () => this.fullscreenPrev());
        fullscreenNextBtn.addEventListener('click', () => this.fullscreenNext());
        
        // Click on background to close fullscreen
        this.mobileFullscreenOverlay.addEventListener('click', (e) => {
            if (e.target === this.mobileFullscreenOverlay) {
                this.closeMobileFullscreen();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            
            // If mobile fullscreen is active, handle escape and arrows
            if (this.mobileFullscreenOverlay && this.mobileFullscreenOverlay.classList.contains('active')) {
                switch(e.key) {
                    case 'Escape':
                        this.closeMobileFullscreen();
                        break;
                    case 'ArrowLeft':
                        this.fullscreenPrev();
                        break;
                    case 'ArrowRight':
                        this.fullscreenNext();
                        break;
                }
                return;
            }
            
            switch(e.key) {
                case 'Escape':
                    this.closeCarDetailModal();
                    break;
                case 'ArrowLeft':
                    this.carDetailPrev();
                    break;
                case 'ArrowRight':
                    this.carDetailNext();
                    break;
            }
        });
    }

    // Open car detail modal
    openCarDetailModal(car) {
        this.updateCarDetailContent(car);
        this.carDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close car detail modal
    closeCarDetailModal() {
        // Close fullscreen if it's active
        if (this.mobileFullscreenOverlay && this.mobileFullscreenOverlay.classList.contains('active')) {
            this.closeMobileFullscreen();
        }
        
        this.carDetailModal.classList.remove('active');
        document.body.classList.remove('mobile-fullscreen-active');
        document.body.style.overflow = '';
    }

    // Previous image in car detail modal
    carDetailPrev() {
        if (this.currentCarDetailImages.length <= 1) return;
        this.currentCarDetailIndex = (this.currentCarDetailIndex - 1 + this.currentCarDetailImages.length) % this.currentCarDetailImages.length;
        this.updateCarDetailCarousel();
    }

    // Next image in car detail modal
    carDetailNext() {
        if (this.currentCarDetailImages.length <= 1) return;
        this.currentCarDetailIndex = (this.currentCarDetailIndex + 1) % this.currentCarDetailImages.length;
        this.updateCarDetailCarousel();
    }

    // Update car detail modal content
    updateCarDetailContent(car) {
        const modal = this.carDetailModal;
        const title = modal.querySelector('.car-detail-title');
        const price = modal.querySelector('.car-detail-price');
        const specsGrid = modal.querySelector('.car-specs-grid');
        const track = modal.querySelector('.car-detail-track');
        const indicators = modal.querySelector('.car-detail-indicators');
        const prevBtn = modal.querySelector('.car-detail-prev');
        const nextBtn = modal.querySelector('.car-detail-next');

        // Update title and price
        title.textContent = car.title;
        price.textContent = `€ ${car.prezzo.toLocaleString('it-IT')}`;

        // Update specs with all new fields
        specsGrid.innerHTML = `
            <div class="car-spec-item">
                <span class="car-spec-label">Anno:</span>
                <span class="car-spec-value">${car.anno}</span>
            </div>
            <div class="car-spec-item">
                <span class="car-spec-label">Chilometraggio:</span>
                <span class="car-spec-value">${car.chilometraggio.toLocaleString('it-IT')} km</span>
            </div>
            <div class="car-spec-item">
                <span class="car-spec-label">Condizioni:</span>
                <span class="car-spec-value">${car.condizioni}</span>
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
            <div class="car-spec-item ${car.neopatentati === 'SI' ? 'neopatentati-si' : 'neopatentati-no'}">
                <span class="car-spec-label">Neopatentati:</span>
                <span class="car-spec-value">${car.neopatentati === 'SI' ? '✅ SI' : '❌ NO'}</span>
            </div>
        `;

        // Setup images
        this.currentCarDetailImages = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image || ''];
        this.currentCarDetailIndex = 0;

        // Clear existing slides and indicators
        track.innerHTML = '';
        indicators.innerHTML = '';

        // Create slides
        this.currentCarDetailImages.forEach((imageSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'car-detail-slide';

            if (imageSrc && imageSrc.trim() !== '') {
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = `${car.title} - Foto ${index + 1}`;
                img.onerror = () => {
                    slide.innerHTML = this.getCarEmoji();
                    slide.style.fontSize = '4rem';
                    slide.style.display = 'flex';
                    slide.style.alignItems = 'center';
                    slide.style.justifyContent = 'center';
                    slide.style.color = '#666';
                };
                
                // Add click listener for mobile fullscreen (only on mobile devices)
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.innerWidth <= 768) {
                        this.openMobileFullscreen(car.title, index);
                    }
                });
                
                slide.appendChild(img);
            } else {
                slide.innerHTML = this.getCarEmoji();
                slide.style.fontSize = '4rem';
                slide.style.display = 'flex';
                slide.style.alignItems = 'center';
                slide.style.justifyContent = 'center';
                slide.style.color = '#666';
            }

            track.appendChild(slide);

            // Create indicator if multiple images
            if (this.currentCarDetailImages.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'car-detail-dot';
                if (index === 0) dot.classList.add('active');
                dot.addEventListener('click', () => this.goToCarDetailSlide(index));
                indicators.appendChild(dot);
            }
        });

        // Show/hide navigation controls
        if (this.currentCarDetailImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            indicators.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            indicators.style.display = 'flex';
        }

        this.updateCarDetailCarousel();
    }

    // Go to specific slide in car detail modal
    goToCarDetailSlide(index) {
        this.currentCarDetailIndex = index;
        this.updateCarDetailCarousel();
    }

    // Update car detail carousel
    updateCarDetailCarousel() {
        const track = this.carDetailModal.querySelector('.car-detail-track');
        const dots = this.carDetailModal.querySelectorAll('.car-detail-dot');

        // Update carousel position
        const translateX = -this.currentCarDetailIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;

        // Update indicators
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentCarDetailIndex);
        });
    }
    // Setup brands scrollbar behavior
    setupBrandsScrollbar() {
        const brandsGrid = document.querySelector('.brands-grid');
        if (!brandsGrid) return;

        let scrollTimeout;

        // Show scrollbar only when scrolling
        const showScrollbar = () => {
            brandsGrid.classList.add('scrolling');
            
            // Clear any existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Hide scrollbar after 1.5 seconds of scroll inactivity
            scrollTimeout = setTimeout(() => {
                brandsGrid.classList.remove('scrolling');
            }, 1500);
        };

        // Event listeners - only scroll events
        brandsGrid.addEventListener('scroll', showScrollbar);
        
        // Touch events for mobile scrolling
        brandsGrid.addEventListener('touchstart', showScrollbar);
        brandsGrid.addEventListener('touchmove', showScrollbar);
    }

    // Setup filter functionality
    setupFilters() {
        const form = document.getElementById('carFilters');
        const resetBtn = document.getElementById('resetFilters');
        const expandBtn = document.getElementById('expandFilters');
        const advancedFilters = document.getElementById('advancedFilters');
        
        if (!form) return;

        // Handle expand/collapse advanced filters
        if (expandBtn && advancedFilters) {
            expandBtn.addEventListener('click', () => {
                const isExpanded = advancedFilters.classList.contains('show');
                
                if (isExpanded) {
                    // Collapse
                    advancedFilters.classList.remove('show');
                    expandBtn.classList.remove('expanded');
                    form.classList.remove('expanded');
                    expandBtn.innerHTML = '<i class="fas fa-plus"></i> Altri filtri';
                } else {
                    // Expand
                    advancedFilters.classList.add('show');
                    expandBtn.classList.add('expanded');
                    form.classList.add('expanded');
                    expandBtn.innerHTML = '<i class="fas fa-minus"></i> Meno filtri';
                }
            });
        }

        // Handle form submission (apply filters)
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
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

            this.generateCarSections(filters);
            
            // Scroll to first car section after filtering
            setTimeout(() => {
                const firstCarSection = document.querySelector('.cars-section');
                if (firstCarSection) {
                    firstCarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        });

        // Handle reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                form.reset();
                this.generateCarSections(); // Regenerate without filters
                console.log('Filtri rimossi');
            });
        }

        // Setup mobile filter system
        this.setupMobileFilters();
    }

    // Apply filters to car array
    applyFilters(cars, filters) {
        return cars.filter(car => {
            // Price filter
            const prezzo = parseInt(car.prezzo) || 0;
            if (prezzo < filters.prezzoMin || prezzo > filters.prezzoMax) {
                return false;
            }

            // Year filter
            const anno = parseInt(car.anno) || 0;
            if (anno < filters.annoMin || anno > filters.annoMax) {
                return false;
            }

            // Mileage filter
            const chilometraggio = parseInt(car.chilometraggio) || 0;
            if (chilometraggio < filters.kmMin || chilometraggio > filters.kmMax) {
                return false;
            }

            // Power filter
            const cavalli = parseInt(car.cavalli) || 0;
            if (cavalli < filters.cavalliMin || cavalli > filters.cavalliMax) {
                return false;
            }

            // Fuel type filter
            if (filters.carburante && car.carburante !== filters.carburante) {
                return false;
            }

            // Transmission filter
            if (filters.cambio && car.tipo_cambio !== filters.cambio) {
                return false;
            }

            // Beginner driver filter
            if (filters.neopatentati && car.neopatentati !== filters.neopatentati) {
                return false;
            }

            // Euro category filter
            if (filters.euro && car.euro !== filters.euro) {
                return false;
            }

            return true;
        });
    }

    // Open mobile fullscreen for image
    openMobileFullscreen(carTitle, startIndex) {
        if (!this.mobileFullscreenOverlay) return;
        
        // Set current images and index
        this.currentFullscreenImages = this.currentCarDetailImages;
        this.currentFullscreenIndex = startIndex;
        
        // Setup fullscreen
        this.updateMobileFullscreen(carTitle);
        this.mobileFullscreenOverlay.classList.add('active');
        
        // Add class to body to hide car detail modal elements
        document.body.classList.add('mobile-fullscreen-active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    // Update mobile fullscreen content
    updateMobileFullscreen(carTitle) {
        const fullscreenImg = this.mobileFullscreenOverlay.querySelector('.mobile-fullscreen-image');
        const fullscreenInfo = this.mobileFullscreenOverlay.querySelector('.mobile-fullscreen-info');
        const indicators = this.mobileFullscreenOverlay.querySelector('.mobile-fullscreen-indicators');
        const prevBtn = this.mobileFullscreenOverlay.querySelector('.mobile-fullscreen-prev');
        const nextBtn = this.mobileFullscreenOverlay.querySelector('.mobile-fullscreen-next');
        
        const currentImage = this.currentFullscreenImages[this.currentFullscreenIndex];
        fullscreenImg.src = currentImage;
        fullscreenImg.alt = `${carTitle} - Foto ${this.currentFullscreenIndex + 1}`;
        fullscreenInfo.textContent = `${carTitle} - Foto ${this.currentFullscreenIndex + 1} di ${this.currentFullscreenImages.length}`;
        
        // Update indicators
        indicators.innerHTML = '';
        this.currentFullscreenImages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'mobile-fullscreen-dot';
            if (index === this.currentFullscreenIndex) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToFullscreenSlide(index, carTitle));
            indicators.appendChild(dot);
        });
        
        // Show/hide navigation
        if (this.currentFullscreenImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            indicators.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            indicators.style.display = 'flex';
        }
    }

    // Go to specific fullscreen slide
    goToFullscreenSlide(index, carTitle) {
        this.currentFullscreenIndex = index;
        this.updateMobileFullscreen(carTitle);
    }

    // Previous image in fullscreen
    fullscreenPrev() {
        if (this.currentFullscreenImages.length <= 1) return;
        this.currentFullscreenIndex = (this.currentFullscreenIndex - 1 + this.currentFullscreenImages.length) % this.currentFullscreenImages.length;
        // Get car title from modal
        const carTitle = this.carDetailModal.querySelector('.car-detail-title').textContent;
        this.updateMobileFullscreen(carTitle);
    }

    // Next image in fullscreen
    fullscreenNext() {
        if (this.currentFullscreenImages.length <= 1) return;
        this.currentFullscreenIndex = (this.currentFullscreenIndex + 1) % this.currentFullscreenImages.length;
        // Get car title from modal
        const carTitle = this.carDetailModal.querySelector('.car-detail-title').textContent;
        this.updateMobileFullscreen(carTitle);
    }

    // Close mobile fullscreen
    closeMobileFullscreen() {
        if (!this.mobileFullscreenOverlay) return;
        
        this.mobileFullscreenOverlay.classList.remove('active');
        
        // Remove class from body to restore car detail modal elements
        document.body.classList.remove('mobile-fullscreen-active');
        
        // Restore body scroll (but keep modal scroll disabled)
        // The car detail modal will handle its own scroll state
    }

    // Create mobile filter system
    createMobileFilterSystem() {
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
        document.body.appendChild(filterButton);
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        // Setup event listeners
        this.setupMobileFilterEvents();
    }

    // Setup mobile filter events
    setupMobileFilterEvents() {
        const filterButton = document.getElementById('mobileFilterButton');
        const overlay = document.getElementById('mobileFilterOverlay');
        const popup = document.getElementById('mobileFilterPopup');
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
        
        // Event listeners
        filterButton.addEventListener('click', openPopup);
        overlay.addEventListener('click', closePopup);
        closeBtn.addEventListener('click', closePopup);
        
        // Apply filters
        applyBtn.addEventListener('click', () => {
            this.applyMobileFilters();
            closePopup();
        });
        
        // Remove filters
        removeBtn.addEventListener('click', () => {
            if (mobileForm) {
                mobileForm.reset();
            }
            this.applyMobileFilters();
            closePopup();
        });
    }

    // Apply mobile filters and maintain scroll position
    applyMobileFilters() {
        const mobileForm = document.getElementById('mobileCarFilters');
        if (!mobileForm) return;
        
        // Get current brand in view before filtering
        const currentBrand = this.getCurrentBrandInView();
        
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
        this.generateCarSections(filters);
        
        // Restore position after filtering
        setTimeout(() => {
            this.restoreScrollPosition(currentBrand);
        }, 100);
    }

    // Get current brand section in view
    getCurrentBrandInView() {
        const brandSections = document.querySelectorAll('.cars-section');
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const centerY = scrollTop + windowHeight / 2;
        
        for (let section of brandSections) {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + scrollTop;
            const sectionBottom = sectionTop + rect.height;
            
            if (centerY >= sectionTop && centerY <= sectionBottom) {
                const brandName = section.querySelector('h2')?.textContent.toLowerCase().replace(/\s+/g, '-');
                return brandName;
            }
        }
        
        return null;
    }

    // Restore scroll position to specific brand or first available
    restoreScrollPosition(targetBrand) {
        if (!targetBrand) {
            // If no target brand, scroll to first car section
            const firstCarSection = document.querySelector('.cars-section');
            if (firstCarSection) {
                firstCarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        
        // Try to find the target brand section
        const brandSections = document.querySelectorAll('.cars-section');
        let targetSection = null;
        let fallbackSection = null;
        
        for (let section of brandSections) {
            const brandName = section.querySelector('h2')?.textContent.toLowerCase().replace(/\s+/g, '-');
            
            if (brandName === targetBrand) {
                targetSection = section;
                break;
            }
            
            // Store first section as fallback
            if (!fallbackSection) {
                fallbackSection = section;
            }
        }
        
        // Scroll to target or fallback
        const sectionToScrollTo = targetSection || fallbackSection;
        if (sectionToScrollTo) {
            sectionToScrollTo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carDealer = new CarDealer();
    
    // Setup brands scrollbar after DOM is ready
    setTimeout(() => {
        carDealer.setupBrandsScrollbar();
    }, 100);
    
    // Create mobile filter system
    carDealer.createMobileFilterSystem();
});