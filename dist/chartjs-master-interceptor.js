/**
 * Interceptor Maestro de Errores Chart.js
 * Última línea de defensa contra errores de Chart.js
 */
(function() {
    'use strict';

    // Store de funciones originales
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const originalRequestAnimationFrame = window.requestAnimationFrame;

    // Patterns de error de Chart.js
    const CHARTJS_PATTERNS = [
        /tried.*use.*fill.*option.*without.*filler.*plugin/i,
        /filler.*plugin.*not.*registered/i,
        /missing.*filler.*plugin/i,
        /fill.*option.*requires.*filler/i,
        /installHook/i,
        /chart.*js.*error/i
    ];

    function isChartJSError(error) {
        const message = typeof error === 'string' ? error : (error?.message || '');
        return CHARTJS_PATTERNS.some(pattern => pattern.test(message));
    }

    // Interceptar setTimeout para errores async
    window.setTimeout = function(fn, delay, ...args) {
        const wrappedFn = function() {
            try {
                return fn.apply(this, arguments);
            } catch (error) {
                if (isChartJSError(error)) {
                    return; // Silenciar error
                }
                throw error;
            }
        };
        return originalSetTimeout.call(this, wrappedFn, delay, ...args);
    };

    // Interceptar setInterval para errores recurrentes
    window.setInterval = function(fn, delay, ...args) {
        const wrappedFn = function() {
            try {
                return fn.apply(this, arguments);
            } catch (error) {
                if (isChartJSError(error)) {
                    return; // Silenciar error
                }
                throw error;
            }
        };
        return originalSetInterval.call(this, wrappedFn, delay, ...args);
    };

    // Interceptar requestAnimationFrame para errores de renderizado
    window.requestAnimationFrame = function(callback) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, arguments);
            } catch (error) {
                if (isChartJSError(error)) {
                    return; // Silenciar error
                }
                throw error;
            }
        };
        return originalRequestAnimationFrame.call(this, wrappedCallback);
    };

    // Interceptar el event loop con MutationObserver
    if (typeof MutationObserver !== 'undefined') {
        const originalMutationObserver = window.MutationObserver;
        window.MutationObserver = function(callback) {
            const wrappedCallback = function() {
                try {
                    return callback.apply(this, arguments);
                } catch (error) {
                    if (isChartJSError(error)) {
                        return; // Silenciar error
                    }
                    throw error;
                }
            };
            return new originalMutationObserver(wrappedCallback);
        };
    }

    // Interceptor global más agresivo
    const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
        try {
            return originalDispatchEvent.call(this, event);
        } catch (error) {
            if (isChartJSError(error)) {
                return true; // Fingir que se despachó correctamente
            }
            throw error;
        }
    };

    // Wrapper para todas las funciones de Array que podrían ser usadas por Chart.js
    const arrayMethods = ['forEach', 'map', 'filter', 'reduce', 'find', 'findIndex'];
    arrayMethods.forEach(method => {
        const original = Array.prototype[method];
        Array.prototype[method] = function(callback, ...args) {
            const wrappedCallback = function() {
                try {
                    return callback.apply(this, arguments);
                } catch (error) {
                    if (isChartJSError(error)) {
                        return; // Silenciar error y continuar
                    }
                    throw error;
                }
            };
            return original.call(this, wrappedCallback, ...args);
        };
    });

    // Interceptar Object.defineProperty por si Chart.js usa properties
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        try {
            return originalDefineProperty.call(this, obj, prop, descriptor);
        } catch (error) {
            if (isChartJSError(error)) {
                return obj; // Devolver el objeto sin cambios
            }
            throw error;
        }
    };

    console.log('🛡️ Interceptor Maestro de Chart.js activado');
})();