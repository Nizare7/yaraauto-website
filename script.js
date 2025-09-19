// Classe principale per gestire il sito auto
class CarDealer {
    constructor() {
        this.data = null;
        this.carousels = new Map(); // Mappa per gestire i caroselli
        this.init();
    }

    // Inizializza l'applicazione
    async init() {
        try {
            await this.loadData();
            this.generateBrands();
            this.generateCarSections();
            this.setupScrollBehavior();
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
        
        this.data.brands.forEach(brand => {
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
        
        this.data.brands.forEach(brand => {
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

        brand.cars.forEach(car => {
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