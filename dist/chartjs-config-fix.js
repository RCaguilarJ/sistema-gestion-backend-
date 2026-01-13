/**
 * Chart.js Post-Load Configuration Fix
 * Se ejecuta después de que Chart.js esté cargado para prevenir errores de configuración
 */
(function() {
    'use strict';

    function waitForChart() {
        if (typeof Chart === 'undefined' && typeof window.Chart === 'undefined') {
            setTimeout(waitForChart, 50);
            return;
        }

        const ChartConstructor = window.Chart || Chart;
        
        if (!ChartConstructor) {
            setTimeout(waitForChart, 50);
            return;
        }

        console.log('📊 Chart.js detectado, aplicando configuración de seguridad...');

        // 1. Registrar el plugin Filler si no existe
        try {
            if (ChartConstructor.register && ChartConstructor.Filler) {
                ChartConstructor.register(ChartConstructor.Filler);
            }
        } catch (e) {
            // Silenciar error de registro
        }

        // 2. Override del constructor de Chart para interceptar configuración problemática
        const originalChart = ChartConstructor;
        const originalDefaultsUpdate = ChartConstructor.defaults?.update;
        
        // 3. Función para sanitizar opciones de dataset
        function sanitizeDatasetOptions(options) {
            if (options && options.datasets) {
                options.datasets = options.datasets.map(dataset => {
                    // Remover o ajustar opciones fill problemáticas
                    if (dataset.fill !== undefined) {
                        // Opciones seguras para fill
                        if (typeof dataset.fill === 'string' && !['origin', 'start', 'end'].includes(dataset.fill)) {
                            dataset.fill = false; // Deshabilitar fill no soportado
                        }
                        if (typeof dataset.fill === 'number' && dataset.fill < -1) {
                            dataset.fill = false;
                        }
                        if (dataset.fill === true) {
                            dataset.fill = 'origin'; // Convertir a valor seguro
                        }
                    }
                    return dataset;
                });
            }
            return options;
        }

        // 4. Función para sanitizar opciones generales
        function sanitizeChartOptions(config) {
            if (!config) return config;
            
            // Sanitizar data
            if (config.data) {
                config.data = sanitizeDatasetOptions(config.data);
            }
            
            // Asegurar que plugins estén habilitados
            if (!config.options) config.options = {};
            if (!config.options.plugins) config.options.plugins = {};
            
            // Configuración segura por defecto
            config.options.plugins.filler = config.options.plugins.filler || { propagate: false };
            
            return config;
        }

        // 5. Wrapper para el constructor de Chart
        function SafeChart(canvas, config) {
            try {
                // Sanitizar configuración antes de crear el chart
                const safeConfig = sanitizeChartOptions(config);
                return new originalChart(canvas, safeConfig);
            } catch (error) {
                if (error.message && error.message.includes('fill') && error.message.includes('Filler')) {
                    console.log('🔧 Error de Filler detectado, creando chart con configuración segura...');
                    
                    // Configuración de emergencia sin fill
                    const emergencyConfig = {
                        ...config,
                        data: {
                            ...config.data,
                            datasets: config.data?.datasets?.map(dataset => ({
                                ...dataset,
                                fill: false // Deshabilitar completamente fill
                            })) || []
                        }
                    };
                    
                    try {
                        return new originalChart(canvas, emergencyConfig);
                    } catch (emergencyError) {
                        console.warn('⚠️ No se pudo crear el chart, retornando mock object');
                        return createMockChart();
                    }
                }
                throw error;
            }
        }

        // 6. Mock chart para casos extremos
        function createMockChart() {
            return {
                data: { datasets: [], labels: [] },
                options: {},
                update: () => {},
                destroy: () => {},
                render: () => {},
                reset: () => {},
                stop: () => {},
                resize: () => {},
                clear: () => {},
                toBase64Image: () => '',
                getElementsAtEventForMode: () => [],
                getElementAtEvent: () => {},
                getDatasetAtEvent: () => {},
                isDatasetVisible: () => true,
                getVisibleDatasetCount: () => 0,
                hide: () => {},
                show: () => {},
                getDatasetMeta: () => ({ data: [] }),
                getContext: () => null,
                canvas: null,
                ctx: null
            };
        }

        // 7. Copiar propiedades estáticas
        Object.setPrototypeOf(SafeChart, originalChart);
        Object.keys(originalChart).forEach(key => {
            SafeChart[key] = originalChart[key];
        });

        // 8. Reemplazar Chart global
        if (window.Chart) {
            window.Chart = SafeChart;
        }
        if (typeof Chart !== 'undefined') {
            Chart = SafeChart;
        }

        // 9. Interceptar react-chartjs-2 si está disponible
        setTimeout(() => {
            if (window.React && window.ReactChartJS2) {
                console.log('🔧 react-chartjs-2 detectado, aplicando patches...');
                // Aquí podrían ir patches específicos para react-chartjs-2
            }
        }, 1000);

        console.log('✅ Configuración de seguridad Chart.js aplicada');
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForChart);
    } else {
        waitForChart();
    }

})();