/**
 * Main Entry Point
 * Orchestrates all modules
 */

import { loadData, verifyDataStructure } from './modules/api.js';
import { initUI, generateBrands, generateCarSections } from './modules/ui.js';
import { setupFilters } from './modules/filters.js';
import { hidePageLoader, showError } from './modules/utils.js';

// App State
const app = {
    data: null
};

// Initialize Application
async function init() {
    console.log('🚀 Inizializzazione moduli...');
    
    try {
        // 1. Load Data
        console.log('📂 Caricamento dati...');
        app.data = await loadData();
        
        // 2. Init UI with data
        console.log('🎨 Inizializzazione UI...');
        initUI(app.data);
        
        // 3. Generate Content
        console.log('🏷️ Generazione brands...');
        generateBrands();
        
        console.log('🚗 Generazione sezioni auto...');
        generateCarSections();
        
        // 4. Setup Filters
        // Create a wrapper object to expose generateCarSections to filters
        const carDealerInterface = {
            generateCarSections: (filters) => generateCarSections(filters)
        };
        
        console.log('🔍 Setup filtri...');
        setupFilters(carDealerInterface);
        
        console.log('🎉 Inizializzazione completata!');
        
        // DEBUG: Visual status (Hidden by default, useful for debugging)
        /*
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: lime; padding: 10px; z-index: 9999; font-family: monospace;';
        const brandCount = app.data && app.data.brands ? app.data.brands.length : 0;
        const carCount = app.data && app.data.brands ? app.data.brands.reduce((acc, b) => acc + (b.cars ? b.cars.length : 0), 0) : 0;
        debugDiv.innerHTML = `STATUS: OK<br>DA: ../datasets/dataset.json<br>Brands: ${brandCount}<br>Cars: ${carCount}`;
        document.body.appendChild(debugDiv);
        */

        hidePageLoader();

    } catch (error) {
        console.error('❌ ERRORE durante inizializzazione:', error);
        
        // DEBUG: Visual error
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(255,0,0,0.9); color: white; padding: 10px; z-index: 9999; font-family: monospace;pointer-events:none;';
        debugDiv.innerHTML = `ERROR: ${error.message}<br>${error.stack || ''}`;
        document.body.appendChild(debugDiv);

        showError(`Errore critico: ${error.message}`);
        hidePageLoader(); // Always hide loader so user can see error
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
