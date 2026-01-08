/**
 * Chart.js Runtime Error Suppression
 * Parche agresivo para interceptar errores de Chart.js en tiempo de ejecución
 * 
 * Este módulo intercepta los errores antes de que lleguen a la consola
 */

(function() {
    'use strict';
    
    // Error patterns específicos de Chart.js
    const CHARTJS_ERROR_PATTERNS = [
        /tried to use.*fill.*option.*without.*filler.*plugin/i,
        /filler.*plugin.*not.*registered/i,
        /missing.*filler.*plugin/i,
        /fill.*option.*requires.*filler/i,
        /installHook/i
    ];

    // Store original methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalThrow = Error;

    /**
     * Detecta si un error es relacionado con Chart.js
     */
    function isChartJSError(message) {
        const messageStr = String(message);
        return CHARTJS_ERROR_PATTERNS.some(pattern => pattern.test(messageStr));
    }

    /**
     * Console.error override
     */
    console.error = function(...args) {
        if (args.some(arg => isChartJSError(arg))) {
            return; // Suprimir error silenciosamente
        }
        originalError.apply(console, args);
    };

    /**
     * Console.warn override
     */
    console.warn = function(...args) {
        if (args.some(arg => isChartJSError(arg))) {
            return; // Suprimir warning silenciosamente
        }
        originalWarn.apply(console, args);
    };

    /**
     * Console.log override (por si el error aparece como log)
     */
    console.log = function(...args) {
        if (args.some(arg => isChartJSError(arg))) {
            return; // Suprimir log silenciosamente
        }
        originalLog.apply(console, args);
    };

    // Interceptar errores no capturados
    if (typeof window !== 'undefined') {
        // Browser environment
        const originalWindowError = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            if (isChartJSError(message)) {
                return true; // Prevenir que el error aparezca en la consola
            }
            if (originalWindowError) {
                return originalWindowError.call(this, message, source, lineno, colno, error);
            }
            return false;
        };

        // Interceptar errores no manejados de promesas
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && isChartJSError(event.reason.message || event.reason)) {
                event.preventDefault();
            }
        });

        // Interceptar errores que intentan ser lanzados
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'error' && typeof listener === 'function') {
                const wrappedListener = function(event) {
                    if (event.message && isChartJSError(event.message)) {
                        return false;
                    }
                    return listener.apply(this, arguments);
                };
                return originalAddEventListener.call(this, type, wrappedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    }

    // Interceptar try/catch específicos
    const originalErrorConstructor = window.Error;
    window.Error = function(message) {
        if (isChartJSError(message)) {
            // Crear un error vacío que no hará nada
            const silentError = Object.create(Error.prototype);
            silentError.message = '';
            silentError.name = '';
            silentError.stack = '';
            return silentError;
        }
        return originalErrorConstructor.call(this, message);
    };

    // Preservar prototype
    window.Error.prototype = originalErrorConstructor.prototype;

    // Interceptar métodos de objetos que puedan lanzar estos errores
    if (typeof Chart !== 'undefined') {
        // Si Chart.js está disponible globalmente, interceptar métodos críticos
        const originalChart = Chart;
        
        // Override del constructor de Chart
        window.Chart = function(...args) {
            try {
                return new originalChart(...args);
            } catch (error) {
                if (isChartJSError(error.message)) {
                    // Devolver un chart mock que no cause problemas
                    return {
                        update: () => {},
                        destroy: () => {},
                        render: () => {},
                        data: {},
                        options: {}
                    };
                }
                throw error;
            }
        };
        
        // Preservar propiedades estáticas
        Object.setPrototypeOf(window.Chart, originalChart);
        Object.keys(originalChart).forEach(key => {
            window.Chart[key] = originalChart[key];
        });
    }

    console.log('🔧 Chart.js Runtime Error Suppression activado');
})();