/**
 * Example integration of i18n with existing POS functions
 * This file demonstrates how to update existing JavaScript code to use translations
 */

// Example: Update the product management functions
function updateProductManagementFunctions() {
    // Override existing product save function
    if (typeof window.saveProduct === 'function') {
        const originalSaveProduct = window.saveProduct;
        window.saveProduct = function() {
            // Call original function
            const result = originalSaveProduct.apply(this, arguments);
            
            // Show translated success message
            if (result && window.i18nIntegration) {
                window.i18nIntegration.notify('success', 'products.productAdded');
            }
            
            return result;
        };
    }
    
    // Override existing product delete function
    if (typeof window.deleteProduct === 'function') {
        const originalDeleteProduct = window.deleteProduct;
        window.deleteProduct = function() {
            // Show translated confirmation
            if (window.i18nIntegration) {
                const confirmMessage = window.i18nIntegration.t('messages.confirmDelete');
                if (confirm(confirmMessage)) {
                    const result = originalDeleteProduct.apply(this, arguments);
                    if (result) {
                        window.i18nIntegration.notify('success', 'products.productDeleted');
                    }
                    return result;
                }
                return false;
            }
            
            return originalDeleteProduct.apply(this, arguments);
        };
    }
}

// Example: Update transaction functions
function updateTransactionFunctions() {
    // Override payment confirmation
    if (typeof window.confirmPayment === 'function') {
        const originalConfirmPayment = window.confirmPayment;
        window.confirmPayment = function() {
            const result = originalConfirmPayment.apply(this, arguments);
            
            if (result && window.i18nIntegration) {
                window.i18nIntegration.notify('success', 'messages.receiptPrinted');
            }
            
            return result;
        };
    }
    
    // Override order hold function
    if (typeof window.holdOrder === 'function') {
        const originalHoldOrder = window.holdOrder;
        window.holdOrder = function() {
            const result = originalHoldOrder.apply(this, arguments);
            
            if (result && window.i18nIntegration) {
                window.i18nIntegration.notify('success', 'holdOrders.holdOrder');
            }
            
            return result;
        };
    }
}

// Example: Update form validation messages
function updateFormValidation() {
    // Override form validation to use translated messages
    if (typeof $ !== 'undefined' && $.fn.parsley) {
        // Update Parsley validation messages
        window.Parsley.addMessages('en', {
            required: window.i18nIntegration ? window.i18nIntegration.t('messages.requiredField') : 'This field is required',
            email: window.i18nIntegration ? window.i18nIntegration.t('messages.invalidEmail') : 'Invalid email address',
            minlength: window.i18nIntegration ? window.i18nIntegration.t('messages.passwordMismatch') : 'Passwords do not match'
        });
        
        window.Parsley.addMessages('si', {
            required: window.i18nIntegration ? window.i18nIntegration.t('messages.requiredField') : 'මෙම ක්ෂේත්‍රය අවශ්‍යයි',
            email: window.i18nIntegration ? window.i18nIntegration.t('messages.invalidEmail') : 'වලංගු නොවන ඊමේල් ලිපිනය',
            minlength: window.i18nIntegration ? window.i18nIntegration.t('messages.passwordMismatch') : 'මුරපද ගැලපෙන්නේ නැත'
        });
    }
}

// Example: Update DataTables with translations
function updateDataTablesWithTranslations() {
    if (typeof $ !== 'undefined' && $.fn.DataTable) {
        // Update product table headers
        const productTableHeaders = {
            'barcode': 'products.barcode',
            'item': 'pos.item',
            'name': 'common.name',
            'price': 'products.price',
            'stock': 'products.stock',
            'expiryDate': 'products.expiryDate',
            'category': 'products.category',
            'action': 'common.action'
        };
        
        // Update category table headers
        const categoryTableHeaders = {
            'name': 'common.name',
            'action': 'common.action'
        };
        
        // Update user table headers
        const userTableHeaders = {
            'name': 'common.name',
            'username': 'users.username',
            'status': 'common.status',
            'action': 'common.action'
        };
        
        // Update transaction table headers
        const transactionTableHeaders = {
            'invoice': 'transactions.invoice',
            'date': 'transactions.date',
            'total': 'transactions.total',
            'paid': 'transactions.paid',
            'change': 'transactions.change',
            'method': 'transactions.method',
            'till': 'transactions.till',
            'cashier': 'transactions.cashier',
            'view': 'transactions.view'
        };
        
        // Apply translations when tables are initialized
        $(document).on('init.dt', function(e, settings) {
            const tableId = settings.nTable.id;
            
            switch(tableId) {
                case 'productList':
                    if (window.i18nIntegration) {
                        window.i18nIntegration.updateTableHeaders(tableId, productTableHeaders);
                    }
                    break;
                case 'categoryList':
                    if (window.i18nIntegration) {
                        window.i18nIntegration.updateTableHeaders(tableId, categoryTableHeaders);
                    }
                    break;
                case 'userList':
                    if (window.i18nIntegration) {
                        window.i18nIntegration.updateTableHeaders(tableId, userTableHeaders);
                    }
                    break;
                case 'transactionList':
                    if (window.i18nIntegration) {
                        window.i18nIntegration.updateTableHeaders(tableId, transactionTableHeaders);
                    }
                    break;
            }
        });
    }
}

// Example: Update modal content dynamically
function updateModalContent() {
    // Update product modal
    const productModal = document.getElementById('newProduct');
    if (productModal) {
        const title = productModal.querySelector('.modal-title');
        if (title && window.i18nIntegration) {
            title.textContent = window.i18nIntegration.t('products.addProduct');
        }
    }
    
    // Update category modal
    const categoryModal = document.getElementById('newCategory');
    if (categoryModal) {
        const title = categoryModal.querySelector('.modal-title');
        if (title && window.i18nIntegration) {
            title.textContent = window.i18nIntegration.t('categories.addCategory');
        }
    }
    
    // Update customer modal
    const customerModal = document.getElementById('newCustomer');
    if (customerModal) {
        const title = customerModal.querySelector('.modal-title');
        if (title && window.i18nIntegration) {
            title.textContent = window.i18nIntegration.t('customers.addCustomer');
        }
    }
}

// Example: Update currency formatting
function updateCurrencyFormatting() {
    // Override currency display functions
    if (typeof window.formatCurrency === 'function') {
        const originalFormatCurrency = window.formatCurrency;
        window.formatCurrency = function(amount) {
            if (window.i18nIntegration) {
                return window.i18nIntegration.formatCurrency(amount);
            }
            return originalFormatCurrency.apply(this, arguments);
        };
    }
    
    // Update existing currency displays
    document.querySelectorAll('.currency-display').forEach(element => {
        const amount = element.getAttribute('data-amount');
        if (amount && window.i18nIntegration) {
            element.textContent = window.i18nIntegration.formatCurrency(amount);
        }
    });
}

// Example: Update date formatting
function updateDateFormatting() {
    // Override date display functions
    if (typeof window.formatDate === 'function') {
        const originalFormatDate = window.formatDate;
        window.formatDate = function(date) {
            if (window.i18nIntegration) {
                return window.i18nIntegration.formatDate(date);
            }
            return originalFormatDate.apply(this, arguments);
        };
    }
    
    // Update existing date displays
    document.querySelectorAll('.date-display').forEach(element => {
        const date = element.getAttribute('data-date');
        if (date && window.i18nIntegration) {
            element.textContent = window.i18nIntegration.formatDate(date);
        }
    });
}

// Initialize all integrations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait for i18n to be ready
    setTimeout(function() {
        updateProductManagementFunctions();
        updateTransactionFunctions();
        updateFormValidation();
        updateDataTablesWithTranslations();
        updateModalContent();
        updateCurrencyFormatting();
        updateDateFormatting();
    }, 1000);
});

// Listen for language changes and update dynamic content
window.addEventListener('languageChanged', function(event) {
    const language = event.detail.language;
    
    // Update form validation messages
    updateFormValidation();
    
    // Update modal content
    updateModalContent();
    
    // Update currency formatting
    updateCurrencyFormatting();
    
    // Update date formatting
    updateDateFormatting();
    
    // Update DataTables
    updateDataTablesWithTranslations();
});

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateProductManagementFunctions,
        updateTransactionFunctions,
        updateFormValidation,
        updateDataTablesWithTranslations,
        updateModalContent,
        updateCurrencyFormatting,
        updateDateFormatting
    };
}
