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
    let activeTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    // Aplicar tema e ícono al cargar la página
    if (savedTheme) {
        rootElement.setAttribute('data-theme', savedTheme);
    }
    updateButtonIcon(activeTheme);

    // Evento de clic para alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootElement.getAttribute('data-theme') || (systemPrefersDark ? 'dark' : 'light');
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

                // Verifica si la consulta coincide con el título, país o categoría
                const matches = title.includes(query) || 
                                country.includes(query) || 
                                category.includes(query);

                if (matches) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Actualiza el indicador de resultados encontrados
            if (searchCount) {
                if (query === '') {
                    searchCount.textContent = '';
                } else {
                    searchCount.textContent = `Mostrando ${visibleCount} de ${recipeCards.length} recetas`;
                }
            }
        });
    }
});