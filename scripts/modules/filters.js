/**
 * Filters Module
 * Handles car filtering logic
 */

import { hidePageLoader } from './utils.js';

// Setup filters
export function setupFilters(carDealer) {
    const filterForm = document.getElementById('carFilters');
    const resetBtn = document.getElementById('resetFilters');
    const expandBtn = document.getElementById('expandFilters');
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    const brandsFilterButton = document.getElementById('brandsFilterButton');
    
    setupFilterButtonsVisibility();
    
    if (filterForm) {
        // Prevent default submit
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            const filters = Object.fromEntries(formData.entries());
            
            // Clean empty filters
            Object.keys(filters).forEach(key => {
                if (filters[key] === '' || filters[key] === null) {
                    delete filters[key];
                }
            });
            
            carDealer.generateCarSections(filters);
            
            // On mobile, scroll to results
            if (window.innerWidth <= 768) {
                const resultsSection = document.querySelector('.filters-and-brands-section');
                if (resultsSection) {
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
        
        // Real-time filtering for select inputs
        const selects = filterForm.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                filterForm.requestSubmit();
            });
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (filterForm) filterForm.reset();
            carDealer.generateCarSections({});
        });
    }
    
    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            const advancedFilters = document.getElementById('advancedFilters');
            if (advancedFilters) {
                advancedFilters.classList.toggle('visible');
                const isVisible = advancedFilters.classList.contains('visible');
                expandBtn.innerHTML = isVisible ? 
                    '<i class="fas fa-minus"></i> Meno filtri' : 
                    '<i class="fas fa-plus"></i> Altri filtri';
            }
        });
    }
    
    // Mobile toggle handlers
    if (mobileFiltersToggle) {
        mobileFiltersToggle.addEventListener('click', () => {
            const form = document.getElementById('carFilters');
            form.classList.toggle('visible');
            const isVisible = form.classList.contains('visible');
            mobileFiltersToggle.innerHTML = isVisible ? 
                '<i class="fas fa-filter"></i> Nascondi filtri <i class="fas fa-chevron-up"></i>' : 
                '<i class="fas fa-filter"></i> Mostra filtri <i class="fas fa-chevron-down"></i>';
        });
    }

    if (brandsFilterButton) {
        brandsFilterButton.addEventListener('click', () => {
            const form = document.getElementById('carFilters');
            const mobileToggle = document.getElementById('mobileFiltersToggle');
            
            form.classList.add('visible');
            if (mobileToggle) {
                mobileToggle.innerHTML = '<i class="fas fa-filter"></i> Nascondi filtri <i class="fas fa-chevron-up"></i>';
            }
            
            // Logica per scrollare ai filtri
            const filtersSection = document.querySelector('.filters-section');
            if (filtersSection) {
                filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

// Helper: Setup filter buttons visibility
function setupFilterButtonsVisibility() {
    const handleResize = () => {
        const mobileToggle = document.getElementById('mobileFiltersToggle');
        const brandsFilterBtn = document.getElementById('brandsFilterButton');
        const isMobile = window.innerWidth <= 768; // Standard mobile breakpoint
        
        if (mobileToggle) {
            mobileToggle.style.display = isMobile ? 'flex' : 'none';
        }
        
        if (brandsFilterBtn) {
            brandsFilterBtn.style.display = isMobile ? 'flex' : 'none';
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
}

// Apply filters to calculate visible cars
export function applyFilters(cars, filters) {
    if (!cars) return [];
    
    return cars.filter(car => {
        // Price Max
        if (filters.prezzoMax && car.prezzo > parseFloat(filters.prezzoMax)) return false;
        // Price Min
        if (filters.prezzoMin && car.prezzo < parseFloat(filters.prezzoMin)) return false;
        
        // Km Max
        if (filters.kmMax && car.chilometraggio > parseFloat(filters.kmMax)) return false;
        // Km Min
        if (filters.kmMin && car.chilometraggio < parseFloat(filters.kmMin)) return false;
        
        // Year Min
        if (filters.annoMin && car.anno < parseInt(filters.annoMin)) return false;
        // Year Max
        if (filters.annoMax && car.anno > parseInt(filters.annoMax)) return false;
        
        // Neopatentati
        if (filters.neopatentati && filters.neopatentati !== '') {
            if (filters.neopatentati === 'SI' && car.neopatentati !== 'SI') return false;
            if (filters.neopatentati === 'NO' && car.neopatentati === 'SI') return false;
        }
        
        // Transmission
        if (filters.cambio && filters.cambio !== '' && car.tipo_cambio !== filters.cambio) return false;
        
        // Fuel
        if (filters.carburante && filters.carburante !== '' && !car.carburante.includes(filters.carburante)) return false;
        
        // HP Max
        if (filters.cavalliMax && car.cavalli > parseFloat(filters.cavalliMax)) return false;
        // HP Min
        if (filters.cavalliMin && car.cavalli < parseFloat(filters.cavalliMin)) return false;
        
        // Euro Class
        if (filters.euro && filters.euro !== '' && car.euro !== filters.euro) return false;

        return true;
    });
}
