/**
 * Filters Module
 * Handles car filtering logic
 */

import { hidePageLoader, showNotification } from './utils.js';

// Setup filters
export function setupFilters(carDealer) {
    const filterForm = document.getElementById('carFilters');
    const resetBtn = document.getElementById('resetFilters');
    const expandBtn = document.getElementById('expandFilters');
    const advancedFilters = document.getElementById('advancedFilters');
    const mobileFiltersToggle = document.getElementById('mobileFiltersToggle');
    const brandsFilterButton = document.getElementById('brandsFilterButton');
    
    setupFilterButtonsVisibility();
    
    // Handle expand/collapse advanced filters
    if (expandBtn && advancedFilters) {
        expandBtn.addEventListener('click', () => {
            const isExpanded = advancedFilters.classList.contains('show');
            
            if (isExpanded) {
                // Collapse
                advancedFilters.classList.remove('show');
                expandBtn.classList.remove('expanded');
                if (filterForm) filterForm.classList.remove('expanded');
                expandBtn.innerHTML = '<i class="fas fa-plus"></i> Altri filtri';
            } else {
                // Expand
                advancedFilters.classList.add('show');
                expandBtn.classList.add('expanded');
                if (filterForm) filterForm.classList.add('expanded');
                expandBtn.innerHTML = '<i class="fas fa-minus"></i> Meno filtri';
            }
        });
    }
    
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
            
            // Show notification
            showNotification('Filtri applicati', 'success');
            
            // On mobile/tablet, scroll to first car section
            if (window.innerWidth <= 1400) {
                setTimeout(() => {
                    const firstCarSection = document.querySelector('.cars-section');
                    if (firstCarSection) {
                        firstCarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        });
        
        // Real-time filtering for select inputs
        /* // DISABLED to match original behavior - only Apply button triggers search
        const selects = filterForm.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => {
                filterForm.requestSubmit();
            });
        });
        */
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (filterForm) filterForm.reset();
            carDealer.generateCarSections({});
            
            // Show notification
            showNotification('Filtri rimossi', 'info');
        });
    }
    
    // Mobile toggle handlers
    if (mobileFiltersToggle) {
        mobileFiltersToggle.addEventListener('click', () => {
            const form = document.getElementById('carFilters');
            if (form) {
                // The original code toggled 'visible' on form for mobile
                // But let's check what CSS expects. Assuming 'visible'.
                form.classList.toggle('visible');
                const isVisible = form.classList.contains('visible');
                mobileFiltersToggle.innerHTML = isVisible ? 
                    '<i class="fas fa-filter"></i> Nascondi filtri <i class="fas fa-chevron-up"></i>' : 
                    '<i class="fas fa-filter"></i> Mostra filtri <i class="fas fa-chevron-down"></i>';
            }
        });
    }

    if (brandsFilterButton) {
        brandsFilterButton.addEventListener('click', () => {
            const form = document.getElementById('carFilters');
            const mobileToggle = document.getElementById('mobileFiltersToggle');
            
            if (form) form.classList.add('visible');
            if (mobileToggle) {
                mobileToggle.innerHTML = '<i class="fas fa-filter"></i> Nascondi filtri <i class="fas fa-chevron-up"></i>';
            }
            
            // Scroll to filters
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
