document.addEventListener('DOMContentLoaded', () => {
    console.log('Recetario Latinoamericano cargado correctamente.');

    // -----------------------------------------------------------------
    // 1. LÓGICA DE CAMBIO DE TEMA (MODO OSCURO / CLARO)
    // -----------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootElement = document.documentElement;

    // Obtener tema guardado o detectar preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determinar el tema activo inicial
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Aplicar siempre el atributo data-theme e ícono al cargar la página
    rootElement.setAttribute('data-theme', initialTheme);
    updateButtonIcon(initialTheme);

    // Evento de clic para alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            rootElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateButtonIcon(newTheme);
        });
    }

    // Función auxiliar para actualizar el ícono del botón
    function updateButtonIcon(theme) {
        if (themeToggleBtn) {
            themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeToggleBtn.setAttribute('aria-label', `Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`);
        }
    }

    // -----------------------------------------------------------------
    // 2. LÓGICA DEL BUSCADOR EN TIEMPO REAL
    // -----------------------------------------------------------------
    const searchInput = document.getElementById('recipe-search');
    const recipeCards = document.querySelectorAll('.grid-recipes .card');
    const searchCount = document.getElementById('search-count');

    if (searchInput && recipeCards.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let visibleCount = 0;

            recipeCards.forEach((card) => {
                const title = card.getAttribute('data-title') || '';
                const country = card.getAttribute('data-country') || '';
                const category = card.getAttribute('data-category') || '';

                // Verifica si la consulta coincide con título, país o categoría
                const matches = title.includes(query) || 
                                country.includes(query) || 
                                category.includes(query);

                if (matches) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // Actualiza el indicador de resultados encontrados
            if (searchCount) {
                if (query === '') {
                    searchCount.textContent = '';
                } else if (visibleCount === 0) {
                    searchCount.textContent = 'No se encontraron recetas con esa búsqueda.';
                } else {
                    searchCount.textContent = `Mostrando ${visibleCount} de ${recipeCards.length} recetas`;
                }
            }
        });
    }
});