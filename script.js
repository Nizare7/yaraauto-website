// Classe principale per gestire il sito auto
class CarDealer {
    constructor() {
        this.data = null;
        this.carousels = new Map(); // Mappa per gestire i caroselli
        this.lightbox = null; // Riferimento al lightbox
        this.currentLightboxImages = []; // Immagini correnti nel lightbox
        this.currentLightboxIndex = 0; // Indice corrente nel lightbox
        this.init();
    }

    // Inizializza l'applicazione
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

    // Carica i dati JSON
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

    // Genera la griglia delle marche
    generateBrands() {
        const brandsGrid = document.querySelector('.brands-grid');
        if (!brandsGrid || !this.data) return;

        brandsGrid.innerHTML = '';
        
        // Ordina le marche alfabeticamente
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedBrands.forEach(brand => {
            const brandElement = this.createBrandElement(brand);
            brandsGrid.appendChild(brandElement);
        });
    }

    // Crea elemento singola marca
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

    // Genera tutte le sezioni auto
    generateCarSections() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent || !this.data) return;

        // Trova dove inserire le sezioni auto (dopo la navigazione marche)
        const brandsNav = document.querySelector('.brands-nav');
        
        // Ordina le marche alfabeticamente
        const sortedBrands = [...this.data.brands].sort((a, b) => a.name.localeCompare(b.name));
        
        sortedBrands.forEach(brand => {
            const sectionElement = this.createBrandSection(brand);
            brandsNav.insertAdjacentElement('afterend', sectionElement);
        });
    }

    // Crea sezione per una marca
    createBrandSection(brand) {
        const section = document.createElement('section');
        section.id = brand.id;
        section.className = 'cars-section';

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = brand.name;

        const carsGrid = document.createElement('div');
        carsGrid.className = 'cars-grid';

        // Ordina le auto alfabeticamente per titolo
        const sortedCars = [...brand.cars].sort((a, b) => a.title.localeCompare(b.title));

        sortedCars.forEach(car => {
            const carElement = this.createCarCard(car);
            carsGrid.appendChild(carElement);
        });

        section.appendChild(title);
        section.appendChild(carsGrid);

        return section;
    }

    // Crea card singola auto
    createCarCard(car) {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';

        // Immagine auto con carosello
        const carImage = document.createElement('div');
        carImage.className = 'car-image';

        // Se ha una gallery con più immagini, crea il carosello
        if (car.gallery && car.gallery.length > 1) {
            const carousel = this.createImageCarousel(car);
            carImage.appendChild(carousel);
        } else {
            // Singola immagine o fallback
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

        // Informazioni auto
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

        // Animazione di entrata
        carCard.style.opacity = '0';
        carCard.style.transform = 'translateY(20px)';
        carCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        return carCard;
    }

    // Crea carosello per più immagini
    createImageCarousel(car) {
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';

        const track = document.createElement('div');
        track.className = 'carousel-track';

        // Crea slide per ogni immagine
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

        // Controlli di navigazione
        if (car.gallery.length > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'carousel-nav carousel-prev';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'carousel-nav carousel-next';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

            // Indicatori
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

            // Inizializza il carosello
            this.initCarousel(carousel, car.id);
        }

        return carousel;
    }

    // Inizializza la logica del carosello
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

            // Aggiorna indicatori
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

        // Chiudi lightbox
        closeBtn.addEventListener('click', () => this.closeLightbox());
        
        // Click su sfondo per chiudere
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.closeLightbox();
            }
        });

        // Navigazione
        prevBtn.addEventListener('click', () => this.lightboxPrev());
        nextBtn.addEventListener('click', () => this.lightboxNext());

        // Tasti da tastiera
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

    // Apri lightbox con immagini
    openLightbox(images, startIndex = 0, title = '') {
        this.currentLightboxImages = images;
        this.currentLightboxIndex = startIndex;
        
        this.updateLightboxContent(title);
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Blocca scroll della pagina
    }

    // Chiudi lightbox
    closeLightbox() {
        this.lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Riabilita scroll della pagina
    }

    // Immagine precedente nel lightbox
    lightboxPrev() {
        this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.currentLightboxImages.length) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    // Immagine successiva nel lightbox
    lightboxNext() {
        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    // Aggiorna contenuto del lightbox
    updateLightboxContent(title = '') {
        const lightbox = this.lightbox;
        const img = lightbox.querySelector('.lightbox-image');
        const counter = lightbox.querySelector('.lightbox-counter');
        const titleElement = lightbox.querySelector('.lightbox-title');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');

        // Aggiorna immagine
        img.src = this.currentLightboxImages[this.currentLightboxIndex];
        
        // Aggiorna contatore
        counter.textContent = `${this.currentLightboxIndex + 1} / ${this.currentLightboxImages.length}`;
        
        // Aggiorna titolo
        if (title) {
            titleElement.textContent = title;
        }

        // Mostra/nascondi controlli navigazione
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

    // Aggiungi event listeners per le immagini cliccabili
    addImageClickListeners() {
        // Per tutte le immagini delle auto (sia singole che nei caroselli)
        document.querySelectorAll('.car-image').forEach(carImage => {
            carImage.addEventListener('click', (e) => {
                const carCard = carImage.closest('.car-card');
                if (!carCard) return;

                // Trova i dati dell'auto
                const carTitle = carCard.querySelector('.car-title')?.textContent || '';
                
                // Controlla se è un carosello o immagine singola
                const carousel = carImage.querySelector('.image-carousel');
                if (carousel) {
                    // È un carosello - prendi tutte le immagini
                    const slides = carousel.querySelectorAll('.carousel-slide img');
                    const images = Array.from(slides).map(img => img.src).filter(src => src);
                    const currentTrack = carousel.querySelector('.carousel-track');
                    const currentIndex = this.getCurrentCarouselIndex(currentTrack);
                    
                    if (images.length > 0) {
                        this.openLightbox(images, currentIndex, carTitle);
                    }
                } else {
                    // È un'immagine singola
                    const img = carImage.querySelector('img');
                    if (img && img.src) {
                        this.openLightbox([img.src], 0, carTitle);
                    }
                }
            });
        });
    }

    // Trova l'indice corrente del carosello
    getCurrentCarouselIndex(track) {
        const transform = track.style.transform;
        if (!transform) return 0;
        
        const match = transform.match(/translateX\((-?\d+)%\)/);
        if (!match) return 0;
        
        const translatePercent = parseInt(match[1]);
        return Math.abs(translatePercent / 100);
    }

    // Setup comportamento scroll e animazioni
    setupScrollBehavior() {
        // Scroll smooth per i link delle marche
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

        // Animazione delle card al scroll
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

        // Osserva tutte le card delle auto
        document.querySelectorAll('.car-card').forEach(card => {
            observer.observe(card);
        });

        // Pulsante torna su
        window.addEventListener('scroll', function() {
            const backToTop = document.getElementById('backToTop');
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        // Aggiungi listener per le immagini cliccabili
        setTimeout(() => {
            this.addImageClickListeners();
        }, 100); // Piccolo delay per assicurarsi che tutto sia renderizzato
    }

    // Emoji di fallback per le marche
    getBrandEmoji(brandId) {
        const emojis = {
            'fiat': '🚗',
            'volkswagen': '🚙',
            'ford': '🚐',
            'bmw': '🏎️',
            'audi': '🚘',
            'mercedes': '🚖'
        };
        return emojis[brandId] || '🚗';
    }

    // Emoji di fallback per le auto
    getCarEmoji() {
        return '🚗';
    }

    // Mostra errore all'utente
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

// Avvia l'applicazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    new CarDealer();
});