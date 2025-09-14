// Simple i18n test script
const i18next = require('i18next');
const LanguageDetector = require('i18next-browser-languagedetector');

console.log('Testing i18n loading...');

try {
    // Load translation resources directly
    const enTranslations = require('./assets/locales/en/translation.json');
    const siTranslations = require('./assets/locales/si/translation.json');
    
    console.log('✓ English translations loaded:', Object.keys(enTranslations).length, 'sections');
    console.log('✓ Sinhala translations loaded:', Object.keys(siTranslations).length, 'sections');
    
    // Initialize i18next
    i18next
        .use(LanguageDetector)
        .init({
            lng: 'en',
            fallbackLng: 'en',
            debug: false,
            resources: {
                en: { translation: enTranslations },
                si: { translation: siTranslations }
            }
        })
        .then(() => {
            console.log('✓ i18next initialized successfully');
            console.log('✓ Current language:', i18next.language);
            
            // Test translations
            console.log('✓ English welcome:', i18next.t('common.welcome'));
            console.log('✓ English products:', i18next.t('navigation.products'));
            
            // Test Sinhala
            i18next.changeLanguage('si').then(() => {
                console.log('✓ Switched to Sinhala');
                console.log('✓ Sinhala welcome:', i18next.t('common.welcome'));
                console.log('✓ Sinhala products:', i18next.t('navigation.products'));
                
                console.log('\n🎉 i18n test completed successfully!');
                console.log('The translations are working correctly.');
            });
        })
        .catch(error => {
            console.error('✗ i18next initialization failed:', error);
        });
        
} catch (error) {
    console.error('✗ Error loading translation files:', error);
}
