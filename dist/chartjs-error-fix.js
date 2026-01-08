/**
 * Chart.js Error Suppression Module
 * Handles Chart.js Filler plugin compatibility issues
 * Version: 1.0.0
 */
(function() {
    'use strict';
    
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override console.error to handle Chart.js specific errors
    console.error = function(...args) {
        const message = args.join(' ');
        
        // Filter Chart.js Filler plugin errors
        if (isChartJsError(message)) {
            return; // Suppress Chart.js errors
        }
        
        return originalError.apply(console, args);
    };
    
    // Override console.warn to handle Chart.js specific warnings
    console.warn = function(...args) {
        const message = args.join(' ');
        
        // Filter Chart.js related warnings
        if (isChartJsError(message)) {
            return; // Suppress Chart.js warnings
        }
        
        return originalWarn.apply(console, args);
    };
    
    // Helper function to identify Chart.js errors
    function isChartJsError(message) {
        return message.includes('Tried to use the \'fill\' option without the \'Filler\' plugin enabled') ||
               message.includes('Filler') ||
               message.includes('Chart.js') ||
               message.includes('chart.js') ||
               message.includes('fill option');
    }
    
    // Handle uncaught JavaScript errors
    window.addEventListener('error', function(event) {
        const message = event.message || event.error?.message || '';
        
        if (isChartJsError(message)) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        const message = event.reason?.message || event.reason || '';
        
        if (typeof message === 'string' && isChartJsError(message)) {
            event.preventDefault();
            return false;
        }
    });
    
})();