/**
 * i18n Integration Utilities for PharmaSpot POS
 * Provides seamless integration between i18next and existing application code
 */

// Wait for i18next to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize i18n integration after DOM is ready
    initializeI18nIntegration();
});

function initializeI18nIntegration() {
    // Override existing functions to use translations
    overrideExistingFunctions();
    
    // Add language change handlers
    addLanguageChangeHandlers();
    
    // Update dynamic content
    updateDynamicContent();
}

function overrideExistingFunctions() {
    // Override notification functions to use translations
    if (typeof Notiflix !== 'undefined') {
        const originalNotify = Notiflix.Notify.success;
        Notiflix.Notify.success = function(message, options = {}) {
            const translatedMessage = window.i18nUtils ? window.i18nUtils.t(message) : message;
            return originalNotify.call(this, translatedMessage, options);
        };
        
        const originalError = Notiflix.Notify.failure;
        Notiflix.Notify.failure = function(message, options = {}) {
            const translatedMessage = window.i18nUtils ? window.i18nUtils.t(message) : message;
            return originalError.call(this, translatedMessage, options);
        };
    }
}

function addLanguageChangeHandlers() {
    // Handle language selector in settings
    const languageSelector = document.getElementById('language');
    if (languageSelector) {
        languageSelector.addEventListener('change', function() {
            const selectedLanguage = this.value;
            if (window.changeLanguage) {
                window.changeLanguage(selectedLanguage);
                
                // Show success message
                if (typeof Notiflix !== 'undefined') {
                    Notiflix.Notify.success('settings.settingsSaved');
                }
            }
        });
    }
    
    // Listen for language change events
    window.addEventListener('languageChanged', function(event) {
        const language = event.detail.language;
        updateCurrencySymbol(language);
        updateDateFormat(language);
        updateDynamicTables();
    });
}

function updateCurrencySymbol(language) {
    // Update currency symbol based on language
    const currencySymbols = {
        'en': '$',
        'si': 'රු.'
    };
    
    const symbol = currencySymbols[language] || '$';
    
    // Update currency display elements
    document.querySelectorAll('.currency-symbol').forEach(element => {
        element.textContent = symbol;
    });
    
    // Update price displays
    document.querySelectorAll('[data-currency]').forEach(element => {
        const amount = element.getAttribute('data-currency');
        element.textContent = `${symbol}${amount}`;
    });
}

function updateDateFormat(language) {
    // Update date format based on language
    const dateFormats = {
        'en': 'MM/DD/YYYY',
        'si': 'DD/MM/YYYY'
    };
    
    const format = dateFormats[language] || 'MM/DD/YYYY';
    
    // Update moment.js locale if available
    if (typeof moment !== 'undefined') {
        moment.locale(language === 'si' ? 'si' : 'en');
    }
}

function updateDynamicTables() {
    // Update DataTables language if available
    if (typeof $.fn.DataTable !== 'undefined') {
        const languageData = {
            'en': {
                "sEmptyTable": "No data available in table",
                "sInfo": "Showing _START_ to _END_ of _TOTAL_ entries",
                "sInfoEmpty": "Showing 0 to 0 of 0 entries",
                "sInfoFiltered": "(filtered from _MAX_ total entries)",
                "sLengthMenu": "Show _MENU_ entries",
                "sLoadingRecords": "Loading...",
                "sProcessing": "Processing...",
                "sSearch": "Search:",
                "sZeroRecords": "No matching records found"
            },
            'si': {
                "sEmptyTable": "වගුවේ දත්ත නොමැත",
                "sInfo": "_TOTAL_ අතරින් _START_ සිට _END_ දක්වා පෙන්වමින්",
                "sInfoEmpty": "0 අතරින් 0 සිට 0 දක්වා පෙන්වමින්",
                "sInfoFiltered": "(_MAX_ මුළු ඇතුළත් කිරීම් වලින් පෙරණය කරන ලද)",
                "sLengthMenu": "_MENU_ ඇතුළත් කිරීම් පෙන්වන්න",
                "sLoadingRecords": "පූරණය වෙමින්...",
                "sProcessing": "සැකසෙමින්...",
                "sSearch": "සොයන්න:",
                "sZeroRecords": "ගැලපෙන වාර්තා හමු නොවීය"
            }
        };
        
        const currentLang = window.i18nUtils ? window.i18nUtils.getCurrentLanguage() : 'en';
        const langData = languageData[currentLang] || languageData['en'];
        
        // Update existing DataTables
        $.fn.DataTable.defaults.language = langData;
        
        // Reinitialize existing tables
        $('.dataTable').each(function() {
            if ($.fn.DataTable.isDataTable(this)) {
                $(this).DataTable().destroy();
                $(this).DataTable({
                    language: langData
                });
            }
        });
    }
}

function updateDynamicContent() {
    // Update modal titles and content
    updateModalContent();
    
    // Update form labels and placeholders
    updateFormElements();
    
    // Update button texts
    updateButtonTexts();
}

function updateModalContent() {
    const modalTitles = {
        'Products': 'products.title',
        'Categories': 'categories.title',
        'Users': 'users.title',
        'Settings': 'settings.title',
        'New Customer': 'customers.addCustomer',
        'New Product': 'products.addProduct',
        'New Category': 'categories.addCategory',
        'Payment': 'payment.title',
        'Hold Order': 'holdOrders.title'
    };
    
    Object.keys(modalTitles).forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const titleElement = modal.querySelector('.modal-title');
            if (titleElement && window.i18nUtils) {
                titleElement.textContent = window.i18nUtils.t(modalTitles[modalId]);
            }
        }
    });
}

function updateFormElements() {
    // Update form labels and placeholders
    const formElements = {
        'productName': 'products.productName',
        'barcode': 'products.barcode',
        'category': 'products.category',
        'price': 'products.price',
        'stock': 'products.stock',
        'minStock': 'products.minStock',
        'expiryDate': 'products.expiryDate',
        'customerName': 'customers.customerName',
        'phone': 'customers.phone',
        'email': 'customers.email',
        'address': 'customers.address',
        'fullname': 'users.fullName',
        'username': 'users.username',
        'password': 'users.password',
        'store': 'settings.storeName',
        'address_one': 'settings.addressLine1',
        'address_two': 'settings.addressLine2',
        'contact': 'settings.contactNumber',
        'tax': 'settings.vatNumber',
        'symbol': 'settings.currencySymbol',
        'percentage': 'settings.vatPercentage',
        'footer': 'settings.receiptFooter'
    };
    
    Object.keys(formElements).forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element && window.i18nUtils) {
            const translationKey = formElements[elementId];
            const translation = window.i18nUtils.t(translationKey);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'LABEL') {
                element.textContent = translation;
            }
        }
    });
}

function updateButtonTexts() {
    // Update submit buttons
    const submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
    submitButtons.forEach(button => {
        if (button.value === 'Save Settings' || button.textContent === 'Save Settings') {
            if (window.i18nUtils) {
                button.value = window.i18nUtils.t('settings.saveSettings');
                button.textContent = window.i18nUtils.t('settings.saveSettings');
            }
        }
    });
}

// Utility functions for use in existing code
window.i18nIntegration = {
    // Translate a message
    t: function(key, options = {}) {
        return window.i18nUtils ? window.i18nUtils.t(key, options) : key;
    },
    
    // Show translated notification
    notify: function(type, messageKey, options = {}) {
        const message = this.t(messageKey);
        if (typeof Notiflix !== 'undefined') {
            Notiflix.Notify[type](message, options);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    // Update table headers
    updateTableHeaders: function(tableId, headers) {
        const table = document.getElementById(tableId);
        if (table) {
            const headerRow = table.querySelector('thead tr');
            if (headerRow) {
                const cells = headerRow.querySelectorAll('th');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.textContent = this.t(headers[index]);
                    }
                });
            }
        }
    },
    
    // Update select options
    updateSelectOptions: function(selectId, options) {
        const select = document.getElementById(selectId);
        if (select) {
            const optionElements = select.querySelectorAll('option');
            optionElements.forEach(option => {
                const value = option.value;
                if (options[value]) {
                    option.textContent = this.t(options[value]);
                }
            });
        }
    },
    
    // Format currency with current language
    formatCurrency: function(amount) {
        const currentLang = window.i18nUtils ? window.i18nUtils.getCurrentLanguage() : 'en';
        const symbols = { 'en': '$', 'si': 'රු.' };
        const symbol = symbols[currentLang] || '$';
        return `${symbol}${parseFloat(amount).toFixed(2)}`;
    },
    
    // Format date with current language
    formatDate: function(date) {
        if (typeof moment !== 'undefined') {
            const currentLang = window.i18nUtils ? window.i18nUtils.getCurrentLanguage() : 'en';
            moment.locale(currentLang === 'si' ? 'si' : 'en');
            return moment(date).format('DD/MM/YYYY');
        }
        return new Date(date).toLocaleDateString();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.i18nIntegration;
}
