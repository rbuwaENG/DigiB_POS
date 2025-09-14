const i18next = require('i18next');
const LanguageDetector = require('i18next-browser-languagedetector');

console.log('i18n: Initializing...');

// Make i18next available globally for debugging
window.i18next = i18next;

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

// Load translation resources directly
const enTranslations = require('../locales/en/translation.json');
const siTranslations = require('../locales/si/translation.json');

console.log('i18n: Loaded English translations:', Object.keys(enTranslations).length, 'sections');
console.log('i18n: Loaded Sinhala translations:', Object.keys(siTranslations).length, 'sections');

// Initialize i18next with direct resources
i18next
  .use(LanguageDetector)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: true, // Enable debug for troubleshooting
    
    // Direct resource loading
    resources: {
      en: {
        translation: enTranslations
      },
      si: {
        translation: siTranslations
      }
    },
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes
      formatSeparator: ',',
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    },
    
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Missing key handling
    saveMissing: true,
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
      console.warn(`Missing translation for key: ${key} in language: ${lng}`);
    }
  })
  .then(function() {
    console.log('i18n: Initialization complete');
    console.log('i18n: Current language:', i18next.language);
    console.log('i18n: Available resources:', i18next.getResourceBundle('en', 'translation'));
    
    // Apply queued language change if any
    if (languageQueue) {
      console.log('i18n: Applying queued language change:', languageQueue);
      window.changeLanguage(languageQueue);
      languageQueue = null;
    }
    
    // Initialize translations when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
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
    });
  })
  .catch(function(error) {
    console.error('i18n: Initialization failed:', error);
    console.error('Error details:', error.stack);
  });

// Export the configured i18next instance
module.exports = i18next;


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
  
  // Update elements with data-i18n-attr attributes
  document.querySelectorAll('[data-i18n-attr]').forEach(element => {
    const attrConfig = element.getAttribute('data-i18n-attr');
    const [attr, key] = attrConfig.split(':');
    const translation = i18next.t(key);
    element.setAttribute(attr, translation);
  });
  
  // Update title attribute translations
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = i18next.t(key);
  });
  
  console.log('updatePageTranslations completed');
}


// Export utility functions
window.i18nUtils = {
  t: (key, options) => i18next.t(key, options),
  changeLanguage: window.changeLanguage,
  getCurrentLanguage: () => i18next.language,
  updateTranslations: updatePageTranslations
};

// Make sure the function is available immediately
console.log('i18n: Setting up global functions...');
console.log('i18n: changeLanguage function available:', typeof window.changeLanguage);

// Add a test function for debugging
window.testI18n = function() {
    console.log('=== i18n Test ===');
    console.log('i18next initialized:', i18next.isInitialized);
    console.log('Current language:', i18next.language);
    console.log('English welcome:', i18next.t('common.welcome'));
    console.log('English products:', i18next.t('navigation.products'));
    
    // Test Sinhala
    i18next.changeLanguage('si').then(() => {
        console.log('Sinhala welcome:', i18next.t('common.welcome'));
        console.log('Sinhala products:', i18next.t('navigation.products'));
        console.log('=== Test Complete ===');
    });
};
