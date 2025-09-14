/**
 * i18n Test Suite for PharmaSpot POS
 * Simple tests to verify i18n functionality
 */

// Test functions
const i18nTests = {
    // Test basic translation
    testBasicTranslation: function() {
        console.log('Testing basic translation...');
        
        if (window.i18nUtils) {
            const welcomeEn = window.i18nUtils.t('common.welcome');
            console.log('English welcome:', welcomeEn);
            
            // Switch to Sinhala
            window.changeLanguage('si');
            
            setTimeout(() => {
                const welcomeSi = window.i18nUtils.t('common.welcome');
                console.log('Sinhala welcome:', welcomeSi);
                
                // Switch back to English
                window.changeLanguage('en');
                console.log('Basic translation test completed');
            }, 100);
        } else {
            console.error('i18nUtils not available');
        }
    },
    
    // Test interpolation
    testInterpolation: function() {
        console.log('Testing interpolation...');
        
        if (window.i18nUtils) {
            const grossPrice = window.i18nUtils.t('pos.grossPrice', { tax: 15 });
            console.log('Gross price with tax:', grossPrice);
        } else {
            console.error('i18nUtils not available');
        }
    },
    
    // Test currency formatting
    testCurrencyFormatting: function() {
        console.log('Testing currency formatting...');
        
        if (window.i18nIntegration) {
            // Test English currency
            window.changeLanguage('en');
            setTimeout(() => {
                const priceEn = window.i18nIntegration.formatCurrency(100.50);
                console.log('English price:', priceEn);
                
                // Test Sinhala currency
                window.changeLanguage('si');
                setTimeout(() => {
                    const priceSi = window.i18nIntegration.formatCurrency(100.50);
                    console.log('Sinhala price:', priceSi);
                    
                    // Switch back to English
                    window.changeLanguage('en');
                    console.log('Currency formatting test completed');
                }, 100);
            }, 100);
        } else {
            console.error('i18nIntegration not available');
        }
    },
    
    // Test date formatting
    testDateFormatting: function() {
        console.log('Testing date formatting...');
        
        if (window.i18nIntegration) {
            const testDate = new Date('2023-12-15');
            const formattedDate = window.i18nIntegration.formatDate(testDate);
            console.log('Formatted date:', formattedDate);
        } else {
            console.error('i18nIntegration not available');
        }
    },
    
    // Test HTML element updates
    testHTMLElementUpdates: function() {
        console.log('Testing HTML element updates...');
        
        // Check if elements with data-i18n are updated
        const elements = document.querySelectorAll('[data-i18n]');
        console.log('Found', elements.length, 'elements with data-i18n attributes');
        
        elements.forEach((element, index) => {
            if (index < 5) { // Show first 5 elements
                const key = element.getAttribute('data-i18n');
                const text = element.textContent;
                console.log(`Element ${index + 1}: Key="${key}", Text="${text}"`);
            }
        });
    },
    
    // Test language switching
    testLanguageSwitching: function() {
        console.log('Testing language switching...');
        
        if (window.changeLanguage) {
            // Test switching to Sinhala
            window.changeLanguage('si');
            setTimeout(() => {
                console.log('Switched to Sinhala');
                
                // Test switching back to English
                window.changeLanguage('en');
                setTimeout(() => {
                    console.log('Switched back to English');
                    console.log('Language switching test completed');
                }, 100);
            }, 100);
        } else {
            console.error('changeLanguage function not available');
        }
    },
    
    // Test notification system
    testNotificationSystem: function() {
        console.log('Testing notification system...');
        
        if (window.i18nIntegration) {
            // Test success notification
            window.i18nIntegration.notify('success', 'messages.operationSuccess');
            
            setTimeout(() => {
                // Test error notification
                window.i18nIntegration.notify('error', 'messages.operationFailed');
                console.log('Notification system test completed');
            }, 1000);
        } else {
            console.error('i18nIntegration not available');
        }
    },
    
    // Run all tests
    runAllTests: function() {
        console.log('Starting i18n test suite...');
        console.log('================================');
        
        this.testBasicTranslation();
        
        setTimeout(() => {
            this.testInterpolation();
        }, 500);
        
        setTimeout(() => {
            this.testCurrencyFormatting();
        }, 1000);
        
        setTimeout(() => {
            this.testDateFormatting();
        }, 1500);
        
        setTimeout(() => {
            this.testHTMLElementUpdates();
        }, 2000);
        
        setTimeout(() => {
            this.testLanguageSwitching();
        }, 2500);
        
        setTimeout(() => {
            this.testNotificationSystem();
        }, 3000);
        
        setTimeout(() => {
            console.log('================================');
            console.log('i18n test suite completed');
        }, 3500);
    }
};

// Make tests available globally
window.i18nTests = i18nTests;

// Auto-run tests when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for i18n to initialize
    setTimeout(() => {
        console.log('i18n Test Suite loaded. Run window.i18nTests.runAllTests() to start testing.');
    }, 2000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18nTests;
}
