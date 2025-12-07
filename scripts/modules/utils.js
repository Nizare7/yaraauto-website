/**
 * Utility Functions
 */

// Show error message
export function showError(message) {
    // Check if error container exists, if not create one
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        document.body.prepend(errorContainer);
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'error-close';
    closeBtn.onclick = () => errorDiv.remove();
    errorDiv.appendChild(closeBtn);
    
    errorContainer.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show notification
export function showNotification(message, type = 'success') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container); // Add to specific container if needed
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'info' ? 'info-circle' : 'exclamation-triangle';
                 
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Hide page loader
export function hidePageLoader() {
    const loader = document.getElementById('pageLoader');
    const body = document.body;
    
    if (loader && !loader.classList.contains('hidden')) {
        setTimeout(() => {
            loader.classList.add('hidden');
            body.classList.remove('loading');
        }, 500);
    }
}

// Helper: Get formatted car title
export function getCarTitle(car) {
    return `${car.brand} ${car.name}`;
}

// Helper: Get brand emoji fallback
export function getBrandEmoji(brandId) {
    const emojis = {
        'abarth': '🦂',
        'alfa-romeo': '🐍',
        'audi': '⭕',
        'bmw': '🔵',
        'citroen': '🇫🇷',
        'dacia': '🚙',
        'ferrari': '🐎',
        'fiat': '🇮🇹',
        'ford': '🚙',
        'jeep': '🚙',
        'lancia': '🛡️',
        'maserati': '🔱',
        'mercedes': '⭐',
        'mini': '🚙',
        'nissan': '🇯🇵',
        'opel': '⚡',
        'peugeot': '🦁',
        'porsche': '🐎',
        'renault': '💎',
        'seat': '🇪🇸',
        'skoda': '🚙',
        'smart': '🚙',
        'suzuki': '🇯🇵',
        'toyota': '🇯🇵',
        'volkswagen': 'VW',
        'volvo': '🇸🇪'
    };
    return emojis[brandId] || '🚗';
}

// Helper: Get generic car emoji
export function getCarEmoji() {
    return '🚗';
}

// Helper: Format price
export function formatPrice(price) {
    return `€ ${price.toLocaleString('it-IT')}`;
}

// Helper: Format number
export function formatNumber(num) {
    return num.toLocaleString('it-IT');
}
