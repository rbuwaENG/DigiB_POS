// Simplified i18n implementation for browser
console.log('i18n: Starting browser-compatible initialization...');

// Make sure i18next is available globally
if (typeof window.i18next === 'undefined') {
    console.error('i18next not loaded! Make sure the script is included.');
    return;
}

const i18next = window.i18next;

// Queue for language changes before initialization
let languageQueue = null;

// Define the changeLanguage function immediately
window.changeLanguage = function(lng) {
    console.log('changeLanguage called with:', lng);
    if (!i18next.isInitialized) {
        console.log('i18next not initialized yet, queuing language change...');
        languageQueue = lng;
        localStorage.setItem('i18nextLng', lng);
        return;
    }
    i18next.changeLanguage(lng).then(() => {
        console.log('Language changed to:', lng);
        // Update all elements with data-i18n attributes
        updatePageTranslations();
        
        // Save language preference
        localStorage.setItem('i18nextLng', lng);
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lng } 
        }));
        
        console.log('Page translations updated');
    }).catch(error => {
        console.error('Error changing language:', error);
    });
};

console.log('i18n: changeLanguage function defined:', typeof window.changeLanguage);

// Function to update all translations on the page
function updatePageTranslations() {
  console.log('updatePageTranslations called');
  
  // Update elements with data-i18n attributes
  const elements = document.querySelectorAll('[data-i18n]');
  console.log('Found', elements.length, 'elements with data-i18n attributes');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = i18next.t(key);
    
    console.log('Updating element:', key, '->', translation);
    
    if (element.tagName === 'INPUT' && element.type === 'text') {
      element.placeholder = translation;
    } else if (element.tagName === 'INPUT' && element.type === 'submit') {
      element.value = translation;
    } else {
      element.textContent = translation;
    }
  });
  
  console.log('updatePageTranslations completed');
}

// Load translations and initialize
async function initializeI18n() {
    try {
        console.log('i18n: Loading translation files...');
        
        // Load English translations
        const enResponse = await fetch('assets/locales/en/translation.json');
        const enTranslations = await enResponse.json();
        console.log('i18n: Loaded English translations:', Object.keys(enTranslations).length, 'sections');
        
        // Load Sinhala translations
        const siResponse = await fetch('assets/locales/si/translation.json');
        const siTranslations = await siResponse.json();
        console.log('i18n: Loaded Sinhala translations:', Object.keys(siTranslations).length, 'sections');
        
        // Initialize i18next
        await i18next.init({
            lng: 'en',
            fallbackLng: 'en',
            debug: true,
            resources: {
                en: { translation: enTranslations },
                si: { translation: siTranslations }
            },
            interpolation: {
                escapeValue: false
            }
        });
        
        console.log('i18n: Initialization complete');
        console.log('i18n: Current language:', i18next.language);
        
        // Apply queued language change if any
        if (languageQueue) {
            console.log('i18n: Applying queued language change:', languageQueue);
            window.changeLanguage(languageQueue);
            languageQueue = null;
        }
        
        // Initialize translations when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeTranslations);
        } else {
            initializeTranslations();
        }
        
    } catch (error) {
        console.error('i18n: Initialization failed:', error);
    }
}

function initializeTranslations() {
    console.log('DOM loaded, initializing translations...');
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
    console.log('Saved language preference:', savedLanguage);
    
    i18next.changeLanguage(savedLanguage).then(() => {
        console.log('Initial language set to:', savedLanguage);
        updatePageTranslations();
    }).catch(error => {
        console.error('Error setting initial language:', error);
    });
}

// Export utility functions
window.i18nUtils = {
    t: (key, options) => i18next.t(key, options),
    changeLanguage: window.changeLanguage,
    getCurrentLanguage: () => i18next.language,
    updateTranslations: updatePageTranslations
};

// Start initialization
initializeI18n();
