// Comprehensive i18n debugging script
console.log('=== i18n Debug Script ===');

// Check if i18next is available
console.log('1. i18next available:', typeof window.i18next !== 'undefined');
console.log('2. i18next initialized:', window.i18next ? window.i18next.isInitialized : 'N/A');
console.log('3. Current language:', window.i18next ? window.i18next.language : 'N/A');

// Check if our functions are available
console.log('4. changeLanguage available:', typeof window.changeLanguage !== 'undefined');
console.log('5. i18nUtils available:', typeof window.i18nUtils !== 'undefined');

// Check localStorage
console.log('6. Saved language in localStorage:', localStorage.getItem('i18nextLng'));

// Check if translations are loaded
if (window.i18next && window.i18next.isInitialized) {
    console.log('7. English welcome:', window.i18next.t('common.welcome'));
    console.log('8. Sinhala welcome:', window.i18next.t('common.welcome', { lng: 'si' }));
    console.log('9. Available resources:', Object.keys(window.i18next.getResourceBundle('en', 'translation')));
    console.log('10. Sinhala resources:', Object.keys(window.i18next.getResourceBundle('si', 'translation')));
} else {
    console.log('7-10. i18next not initialized, cannot test translations');
}

// Check DOM elements
const elements = document.querySelectorAll('[data-i18n]');
console.log('11. Elements with data-i18n:', elements.length);
elements.forEach((el, index) => {
    if (index < 5) { // Show first 5
        const key = el.getAttribute('data-i18n');
        const text = el.textContent;
        console.log(`   Element ${index + 1}: "${key}" -> "${text}"`);
    }
});

// Test manual translation
if (window.i18next && window.i18next.isInitialized) {
    console.log('12. Testing manual translation...');
    try {
        window.i18next.changeLanguage('si').then(() => {
            console.log('13. Language changed to Sinhala');
            console.log('14. Sinhala products:', window.i18next.t('navigation.products'));
            
            // Update elements manually
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (key) {
                    const translation = window.i18next.t(key);
                    if (el.tagName === 'INPUT' && el.type === 'text') {
                        el.placeholder = translation;
                    } else {
                        el.textContent = translation;
                    }
                }
            });
            console.log('15. Manual update completed');
        });
    } catch (error) {
        console.error('12. Error testing translation:', error);
    }
}

console.log('=== Debug Complete ===');
