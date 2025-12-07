/**
 * API Module
 * Handles data fetching and processing
 */

import { showError, hidePageLoader } from './utils.js';

// Load JSON data
export async function loadData() {
    console.log('📡 Tentativo di caricamento da: ../datasets/dataset.json');
    
    try {
        const response = await fetch('../datasets/dataset.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const text = await response.text();
        const data = JSON.parse(text);
        
        console.log('✅ JSON parsato con successo');
        
        // Filter sold cars and empty brands
        return filterSoldCarsAndEmptyBrands(data);
        
    } catch (error) {
        console.error('❌ ERRORE in loadData:', error);
        
        let errorMsg = `Errore nell'inizializzazione: ${error.message}`;
        
        if (error.name === 'SyntaxError') {
            errorMsg = 'File JSON malformato: controlla la sintassi del file cars-data.json';
        } else if (error.message.includes('404')) {
            errorMsg = 'File dati non trovato nella directory specificata';
        } else if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Impossibile caricare il file: controlla che il server sia attivo';
        }
        
        showError(errorMsg);
        hidePageLoader(); // Ensure loader is hidden even on error so user sees the error
        throw error;
    }
}

// Filter sold cars and brand without available cars
function filterSoldCarsAndEmptyBrands(data) {
    if (!data || !data.brands) return data;
    
    // Filter sold cars for each brand
    const processedBrands = data.brands.map(brand => {
        if (!brand.cars || !Array.isArray(brand.cars)) {
            return brand;
        }
        
        // Filter only available cars (venduto !== true)
        const availableCars = brand.cars.filter(car => car.venduto !== true);
        
        return {
            ...brand,
            cars: availableCars
        };
    });
    
    // Remove brands with no available cars
    const brandsWithCars = processedBrands.filter(brand => 
        brand.cars && brand.cars.length > 0
    );
    
    console.log(`✅ Filtraggio completato: ${brandsWithCars.length} brand con auto disponibili`);
    
    return {
        ...data,
        brands: brandsWithCars
    };
}

// Verify data structure
export function verifyDataStructure(data) {
    if (!data) throw new Error('Dati non caricati');
    if (!data.brands || !Array.isArray(data.brands)) throw new Error('Struttura dati non valida: manca array brands');
    
    data.brands.forEach((brand, index) => {
        if (!brand.name || !brand.id) {
            console.warn(`Brand ${index} manca di name o id`);
        }
    });
}
