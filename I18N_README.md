# Internationalization (i18n) Implementation for PharmaSpot POS

This document describes the comprehensive i18n implementation for the PharmaSpot Electron POS application, supporting English and Sinhala languages.

## 🚀 Features

- **Complete i18n Support**: Full translation support for English and Sinhala
- **Dynamic Language Switching**: Change languages at runtime without restart
- **Electron-Optimized**: Uses `i18next-electron-fs-backend` for file system access
- **Automatic Detection**: Detects user's preferred language from browser settings
- **Persistent Settings**: Remembers language preference across sessions
- **Comprehensive Coverage**: All UI elements, forms, tables, and messages translated
- **Currency & Date Formatting**: Language-specific formatting for currency and dates
- **Integration Ready**: Easy integration with existing JavaScript code

## 📁 File Structure

```
assets/
├── js/
│   ├── i18n.js                 # Main i18n configuration
│   ├── i18n-integration.js     # Integration utilities
│   └── i18n-examples.js        # Example implementations
└── locales/
    ├── en/
    │   └── translation.json     # English translations
    └── si/
        └── translation.json     # Sinhala translations
```

## 🛠️ Installation

The required dependencies are already installed:

```bash
npm install i18next i18next-electron-fs-backend i18next-browser-languagedetector
```

## ⚙️ Configuration

### Main Configuration (`assets/js/i18n.js`)

The i18n system is configured with:

- **Backend**: `i18next-electron-fs-backend` for Electron file system access
- **Detection**: Automatic language detection from browser/localStorage
- **Fallback**: English as fallback language
- **Namespaces**: Single `translation` namespace
- **Interpolation**: Support for variables and formatting

### Translation Files

#### English (`assets/locales/en/translation.json`)
Complete English translations organized by sections:
- `common`: Common UI elements
- `login`: Login form
- `navigation`: Main navigation
- `pos`: Point of Sale interface
- `products`: Product management
- `categories`: Category management
- `customers`: Customer management
- `transactions`: Transaction handling
- `payment`: Payment processing
- `users`: User management
- `settings`: Application settings
- `messages`: System messages
- `currency`: Currency formatting
- `dateTime`: Date/time formatting

#### Sinhala (`assets/locales/si/translation.json`)
Complete Sinhala translations with proper Unicode characters [[memory:8666778]].

## 🎯 Usage

### Basic Translation

```javascript
// Get translation
const message = window.i18nUtils.t('common.welcome');

// With variables
const price = window.i18nUtils.t('pos.grossPrice', { tax: 15 });
```

### Language Switching

```javascript
// Change language
window.changeLanguage('si'); // Switch to Sinhala
window.changeLanguage('en'); // Switch to English

// Get current language
const currentLang = window.i18nUtils.getCurrentLanguage();
```

### HTML Integration

```html
<!-- Basic translation -->
<span data-i18n="common.welcome">Welcome</span>

<!-- Placeholder translation -->
<input type="text" data-i18n="login.username" placeholder="Username">

<!-- Attribute translation -->
<img data-i18n-attr="alt:common.logo" src="logo.png">

<!-- Title translation -->
<button data-i18n-title="common.help" title="Help">?</button>
```

### Dynamic Content Updates

```javascript
// Update table headers
window.i18nIntegration.updateTableHeaders('productList', {
    'name': 'products.productName',
    'price': 'products.price',
    'stock': 'products.stock'
});

// Show translated notifications
window.i18nIntegration.notify('success', 'products.productAdded');
window.i18nIntegration.notify('error', 'messages.operationFailed');

// Format currency
const formattedPrice = window.i18nIntegration.formatCurrency(100.50);
// English: $100.50
// Sinhala: රු.100.50

// Format date
const formattedDate = window.i18nIntegration.formatDate(new Date());
// English: 15/12/2023
// Sinhala: 15/12/2023
```

## 🔧 Integration with Existing Code

### Override Existing Functions

```javascript
// Example: Override product save function
const originalSaveProduct = window.saveProduct;
window.saveProduct = function() {
    const result = originalSaveProduct.apply(this, arguments);
    if (result) {
        window.i18nIntegration.notify('success', 'products.productAdded');
    }
    return result;
};
```

### Update Form Validation

```javascript
// Update Parsley validation messages
window.Parsley.addMessages('en', {
    required: window.i18nIntegration.t('messages.requiredField')
});

window.Parsley.addMessages('si', {
    required: window.i18nIntegration.t('messages.requiredField')
});
```

### Update DataTables

```javascript
// Update table language
$.fn.DataTable.defaults.language = {
    'sEmptyTable': window.i18nIntegration.t('messages.dataNotFound'),
    'sSearch': window.i18nIntegration.t('common.search') + ':'
};
```

## 🎨 UI Components

### Language Switcher

The language switcher is integrated into the Settings modal:

```html
<div class="form-group">
    <label for="language">Language / භාෂාව</label>
    <select name="language" id="language" class="form-control">
        <option value="en">English</option>
        <option value="si">සිංහල</option>
    </select>
</div>
```

### Automatic Updates

The system automatically updates:
- All elements with `data-i18n` attributes
- Form placeholders and labels
- Button texts and tooltips
- Table headers and content
- Modal titles and content
- Currency and date displays

## 📱 Language-Specific Features

### Currency Formatting
- **English**: `$100.50`
- **Sinhala**: `රු.100.50`

### Date Formatting
- **English**: `MM/DD/YYYY`
- **Sinhala**: `DD/MM/YYYY`

### Text Direction
- **English**: Left-to-right
- **Sinhala**: Left-to-right (Sinhala script)

## 🔄 Event Handling

### Language Change Events

```javascript
// Listen for language changes
window.addEventListener('languageChanged', function(event) {
    const language = event.detail.language;
    console.log('Language changed to:', language);
    
    // Update dynamic content
    updateCurrencySymbol(language);
    updateDateFormat(language);
    updateDataTables();
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Translations not loading**
   - Check file paths in `i18n.js`
   - Verify translation files exist
   - Check browser console for errors

2. **Language not persisting**
   - Check localStorage permissions
   - Verify language detection settings

3. **Dynamic content not updating**
   - Ensure `i18n-integration.js` is loaded
   - Check event listeners are attached

### Debug Mode

Enable debug mode in `i18n.js`:

```javascript
.init({
    debug: true, // Enable debug logging
    // ... other options
});
```

## 📈 Performance Considerations

- **Lazy Loading**: Translations are loaded on demand
- **Caching**: Translations are cached in localStorage
- **Minimal Overhead**: Only active translations are loaded
- **Efficient Updates**: Only changed elements are updated

## 🔮 Future Enhancements

- **Additional Languages**: Easy to add more languages
- **RTL Support**: Right-to-left language support
- **Pluralization**: Advanced pluralization rules
- **Context-Aware**: Context-specific translations
- **Translation Management**: Web-based translation management

## 📚 Best Practices

1. **Consistent Keys**: Use consistent naming for translation keys
2. **Namespace Organization**: Organize translations by feature/section
3. **Fallback Handling**: Always provide fallback translations
4. **Testing**: Test with both languages thoroughly
5. **Performance**: Monitor translation loading performance
6. **Maintenance**: Keep translations up-to-date with UI changes

## 🤝 Contributing

When adding new features:

1. Add translation keys to both language files
2. Update HTML elements with `data-i18n` attributes
3. Test language switching functionality
4. Update this documentation

## 📄 License

This i18n implementation follows the same license as the main PharmaSpot application.

---

**Note**: This implementation provides a solid foundation for internationalization in Electron applications. The modular design allows for easy extension and maintenance.
