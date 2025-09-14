// Simple direct i18n implementation
console.log('Simple i18n: Starting...');

// Global variables
let translations = {
    en: {},
    si: {}
};
let currentLanguage = 'en';

// Load translations
async function loadTranslations() {
    try {
        console.log('Loading translations...');
        
        // Load English
        const enResponse = await fetch('assets/locales/en/translation.json');
        translations.en = await enResponse.json();
        console.log('English translations loaded:', Object.keys(translations.en).length, 'sections');
        
        // Load Sinhala
        const siResponse = await fetch('assets/locales/si/translation.json');
        translations.si = await siResponse.json();
        console.log('Sinhala translations loaded:', Object.keys(translations.si).length, 'sections');
        
        return true;
    } catch (error) {
        console.error('Error loading translations:', error);
        return false;
    }
}

// Get translation
function t(key, lang = currentLanguage) {
    const keys = key.split('.');
    let value = translations[lang];
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key; // Return key if translation not found
        }
    }
    
    return value || key;
}

// Change language
function changeLanguage(lang) {
    console.log('Changing language to:', lang);
    currentLanguage = lang;
    localStorage.setItem('i18nextLng', lang);
    
    // Update all elements
    updateElements();
    
    // Trigger event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
    }));
}

// Update DOM elements
function updateElements() {
    console.log('Updating elements for language:', currentLanguage);
    
    const elements = document.querySelectorAll('[data-i18n]');
    console.log('Found', elements.length, 'elements to update');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        
        console.log('Updating:', key, '->', translation);
        
        if (element.tagName === 'INPUT' && element.type === 'text') {
            element.placeholder = translation;
        } else if (element.tagName === 'INPUT' && element.type === 'submit') {
            element.value = translation;
        } else {
            element.textContent = translation;
        }
    });
    
    console.log('Elements updated');
}

// Initialize
async function init() {
    console.log('Initializing simple i18n...');
    
    const loaded = await loadTranslations();
    if (!loaded) {
        console.error('Failed to load translations');
        return;
    }
    
    // Load saved language
    const savedLang = localStorage.getItem('i18nextLng') || 'en';
    console.log('Saved language:', savedLang);
    
    // Set initial language
    currentLanguage = savedLang;
    
    // Update elements when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateElements);
    } else {
        updateElements();
    }
    
    console.log('Simple i18n initialized');
}

// Make functions globally available
window.changeLanguage = changeLanguage;
window.t = t;
window.i18nUtils = {
    t: t,
    changeLanguage: changeLanguage,
    getCurrentLanguage: () => currentLanguage,
    updateTranslations: updateElements
};

// Start initialization
init();
