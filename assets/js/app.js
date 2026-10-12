/**
 * @version 2.0.0
*/
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Inicializar módulos
    initThemeManager();
    initLiveSearch();
});

/**
 * 1. GESTOR DE TEMA (MODO OSCURO / CLARO)
 */
function initThemeManager() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;

    if (!themeToggleBtn) return;

    // Sincronizar el estado del botón con el tema actual ya renderizado por el script inline del head
    const currentTheme = rootElement.getAttribute('data-theme') || 'light';
    updateButtonState(themeToggleBtn, currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        const activeTheme = rootElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        
        // Aplicar atributos y persistencia
        rootElement.setAttribute('data-theme', activeTheme);
        localStorage.setItem('theme', activeTheme);
        
        updateButtonState(themeToggleBtn, activeTheme);
    });
}

/**
 * Actualiza el texto, ícono y accesibilidad del botón de tema
 */
function updateButtonState(button, theme) {
    const isDark = theme === 'dark';
    button.textContent = isDark ? '☀️' : '🌙';
    button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    button.setAttribute('aria-pressed', isDark);
}


/**
 * Normalización de tildes y control de rendimiento (debounce).
 */
function initLiveSearch() {
    const searchInput = document.getElementById('recipe-search');
    const recipeCards = document.querySelectorAll('.grid-recipes .card');
    const searchCount = document.getElementById('search-count');

    if (!searchInput || recipeCards.length === 0) return;

    // Función auxiliar para limpiar acentos y mayúsculas (Búsqueda tolerante)
    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Control de rendimiento (Debounce: espera 200ms tras dejar de escribir)
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(() => {
            const rawQuery = e.target.value.trim();
            const query = normalizeText(rawQuery);
            let visibleCount = 0;

            recipeCards.forEach((card) => {
                const title = normalizeText(card.getAttribute('data-title') || '');
                const country = normalizeText(card.getAttribute('data-country') || '');
                const category = normalizeText(card.getAttribute('data-category') || '');

                const matches = title.includes(query) || 
                                country.includes(query) || 
                                category.includes(query);

                if (matches) {
                    card.classList.remove('is-hidden');
                    visibleCount++;
                } else {
                    card.classList.add('is-hidden');
                }
            });

            // Actualizar contador con accesibilidad
            if (searchCount) {
                if (rawQuery === '') {
                    searchCount.textContent = '';
                } else if (visibleCount === 0) {
                    searchCount.textContent = 'No se encontraron recetas con esa búsqueda.';
                } else {
                    searchCount.textContent = `Mostrando ${visibleCount} de ${recipeCards.length} recetas`;
                }
            }
        }, 200);
    });
}