// State variables (recipesData empieza vacío hasta que se carga el JSON)
let recipesData = [];
let selectedCountry = "TODOS";
let selectedCategory = "TODAS";
let searchQuery = "";
let favorites = JSON.parse(localStorage.getItem('latin_recipes_favs')) || [];
let showFavoritesOnly = false;
let activeModalRecipe = null;
let currentServings = 4;

// DOM elements
const recipesGrid = document.getElementById('recipes-grid');
const emptyState = document.getElementById('empty-state');
const countryContainer = document.getElementById('country-filters-container');
const categoryContainer = document.getElementById('category-filters-container');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const resultsTitle = document.getElementById('results-title');
const resultsCount = document.getElementById('results-count');
const favCountBadge = document.getElementById('fav-count-badge');
const favNavIcon = document.getElementById('fav-nav-icon');
const activeFilterBadge = document.getElementById('active-filter-badge');
const activeFilterText = document.getElementById('active-filter-text');

// Initialize App (Carga el archivo JSON externo de forma asíncrona)
async function initApp() {
    try {
        const response = await fetch('./data/recipes.json');
        if (!response.ok) throw new Error('No se pudo cargar el archivo de recetas.');
        
        recipesData = await response.json();

        renderCountryFilters();
        renderCategoryFilters();
        updateFavoritesBadge();
        filterAndRenderRecipes();
    } catch (error) {
        console.error("Error al cargar recetas:", error);
        recipesGrid.innerHTML = `<p class="text-center text-red-500 col-span-full py-10">Error al cargar el recetario. Asegúrate de ejecutar tu proyecto mediante un servidor local (como Live Server en VS Code).</p>`;
    }
}

window.addEventListener('DOMContentLoaded', initApp);

// Listas dinámicas automáticas basadas en el JSON
function getCountriesList() {
    return ["TODOS", ...new Set(recipesData.map(r => `${r.flag} ${r.country}`))];
}

function getCategoriesList() {
    return ["TODAS", ...new Set(recipesData.map(r => r.category))];
}

// Render Country Filter Pills
function renderCountryFilters() {
    const countriesList = getCountriesList();
    countryContainer.innerHTML = countriesList.map(c => {
        const isSelected = (c === "TODOS" && selectedCountry === "TODOS") || selectedCountry === c;
        return `
            <button onclick="selectCountry('${c}')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected 
                ? 'bg-terracota-500 text-white shadow-md shadow-terracota-500/20' 
                : 'bg-white border border-gray-200 text-gray-700 hover:border-terracota-500 hover:text-terracota-600'
            }">
                ${c}
            </button>
        `;
    }).join('');
}

// Render Category Filter Pills
function renderCategoryFilters() {
    const categoriesList = getCategoriesList();
    categoryContainer.innerHTML = categoriesList.map(cat => {
        const isSelected = selectedCategory === cat;
        return `
            <button onclick="selectCategory('${cat}')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSelected 
                ? 'bg-maiz-500 text-white shadow-sm' 
                : 'bg-white border border-gray-200 text-gray-600 hover:border-maiz-500 hover:text-maiz-500'
            }">
                ${cat}
            </button>
        `;
    }).join('');
}

// Selection Handlers
function selectCountry(country) {
    selectedCountry = country;
    showFavoritesOnly = false;
    updateFavoritesNavState();
    renderCountryFilters();
    filterAndRenderRecipes();
}

function selectCategory(category) {
    selectedCategory = category;
    showFavoritesOnly = false;
    updateFavoritesNavState();
    renderCategoryFilters();
    filterAndRenderRecipes();
}

function handleSearch() {
    searchQuery = searchInput.value.trim().toLowerCase();
    if (searchQuery.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }
    filterAndRenderRecipes();
}

function clearSearch() {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add('hidden');
    filterAndRenderRecipes();
}

function resetCountryFilter() {
    selectedCountry = "TODOS";
    renderCountryFilters();
    filterAndRenderRecipes();
}

function resetFilters() {
    selectedCountry = "TODOS";
    selectedCategory = "TODAS";
    searchQuery = "";
    showFavoritesOnly = false;
    searchInput.value = "";
    clearSearchBtn.classList.add('hidden');
    updateFavoritesNavState();
    renderCountryFilters();
    renderCategoryFilters();
    filterAndRenderRecipes();
}

// Filter Logic
function filterAndRenderRecipes() {
    let filtered = recipesData.filter(recipe => {
        const matchesCountry = selectedCountry === "TODOS" || `${recipe.flag} ${recipe.country}` === selectedCountry;
        const matchesCategory = selectedCategory === "TODAS" || recipe.category === selectedCategory;
        const matchesSearch = searchQuery === "" || 
            recipe.title.toLowerCase().includes(searchQuery) ||
            recipe.country.toLowerCase().includes(searchQuery) ||
            recipe.ingredients.some(i => i.item.toLowerCase().includes(searchQuery));
        const matchesFavs = !showFavoritesOnly || favorites.includes(recipe.id);

        return matchesCountry && matchesCategory && matchesSearch && matchesFavs;
    });

    resultsCount.textContent = filtered.length;
    
    if (showFavoritesOnly) {
        resultsTitle.textContent = "Mis Recetas Favoritas";
    } else if (selectedCountry !== "TODOS") {
        resultsTitle.textContent = `Recetas de ${selectedCountry}`;
    } else if (selectedCategory !== "TODAS") {
        resultsTitle.textContent = `Categoría: ${selectedCategory}`;
    } else {
        resultsTitle.textContent = "Todas las Recetas";
    }

    if (selectedCountry !== "TODOS" || selectedCategory !== "TODAS" || searchQuery !== "" || showFavoritesOnly) {
        activeFilterBadge.classList.remove('hidden');
        activeFilterBadge.classList.add('flex');
        
        let text = [];
        if (showFavoritesOnly) text.push("Favoritos");
        if (selectedCountry !== "TODOS") text.push(selectedCountry);
        if (selectedCategory !== "TODAS") text.push(selectedCategory);
        if (searchQuery) text.push(`"${searchQuery}"`);
        
        activeFilterText.textContent = text.join(" • ");
    } else {
        activeFilterBadge.classList.add('hidden');
        activeFilterBadge.classList.remove('flex');
    }

    if (filtered.length === 0) {
        recipesGrid.innerHTML = "";
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        recipesGrid.innerHTML = filtered.map(recipe => createRecipeCardHTML(recipe)).join('');
    }
}

// Create HTML for Individual Recipe Card
function createRecipeCardHTML(recipe) {
    const isFav = favorites.includes(recipe.id);
    return `
        <article class="recipe-card bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-xl flex flex-col justify-between">
            <div>
                <div class="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                    
                    <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1.5">
                        <span>${recipe.flag}</span>
                        <span>${recipe.country}</span>
                    </div>

                    <button onclick="toggleFavorite(event, '${recipe.id}')" aria-label="Guardar en favoritos" class="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-terracota-500 transition-colors shadow-sm">
                        <i class="${isFav ? 'fa-solid text-terracota-500' : 'fa-regular'} fa-heart heart-icon ${isFav ? 'active' : ''} text-lg"></i>
                    </button>
                </div>

                <div class="p-5">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-orange-50 text-terracota-600 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-orange-200/60">
                            ${recipe.category}
                        </span>
                        <span class="text-xs text-gray-400 flex items-center gap-1 font-medium ml-auto">
                            <i class="fa-regular fa-clock text-terracota-500"></i> ${recipe.time}
                        </span>
                    </div>

                    <h3 class="font-serif font-extrabold text-lg text-gray-900 leading-snug mb-2 hover:text-terracota-600 transition-colors">
                        ${recipe.title}
                    </h3>
                    
                    <p class="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4">
                        ${recipe.description}
                    </p>
                </div>
            </div>

            <div class="px-5 pb-5 pt-0">
                <button onclick="openRecipeModal('${recipe.id}')" class="w-full py-2.5 px-4 rounded-xl bg-warmbg hover:bg-terracota-500 hover:text-white text-terracota-600 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-orange-200/60">
                    <span>Ver Receta Completa</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
            </div>
        </article>
    `;
}

// Toggle Favorite Functionality
function toggleFavorite(event, recipeId) {
    if (event) event.stopPropagation();
    
    const index = favorites.indexOf(recipeId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(recipeId);
    }

    localStorage.setItem('latin_recipes_favs', JSON.stringify(favorites));
    updateFavoritesBadge();
    filterAndRenderRecipes();

    if (activeModalRecipe && activeModalRecipe.id === recipeId) {
        updateModalFavButtonState();
    }
}

function toggleFavoritesOnly() {
    showFavoritesOnly = !showFavoritesOnly;
    updateFavoritesNavState();
    filterAndRenderRecipes();
}

function updateFavoritesNavState() {
    const btn = document.getElementById('favorites-toggle-btn');
    if (showFavoritesOnly) {
        btn.classList.add('bg-terracota-500', 'text-white', 'border-terracota-500');
        btn.classList.remove('bg-white', 'text-gray-700');
        favNavIcon.classList.add('text-white');
        favNavIcon.classList.remove('text-terracota-500');
    } else {
        btn.classList.remove('bg-terracota-500', 'text-white', 'border-terracota-500');
        btn.classList.add('bg-white', 'text-gray-700');
        favNavIcon.classList.remove('text-white');
        favNavIcon.classList.add('text-terracota-500');
    }
}

function updateFavoritesBadge() {
    favCountBadge.textContent = favorites.length;
}

// Modal Open & Render
function openRecipeModal(recipeId) {
    const recipe = recipesData.find(r => r.id === recipeId);
    if (!recipe) return;

    activeModalRecipe = recipe;
    currentServings = recipe.baseServings;

    document.getElementById('modal-image').src = recipe.image;
    document.getElementById('modal-title').textContent = recipe.title;
    document.getElementById('modal-country-badge').textContent = `${recipe.flag} ${recipe.country}`;
    document.getElementById('modal-category-badge').textContent = recipe.category;
    document.getElementById('modal-time').textContent = recipe.time;
    document.getElementById('modal-difficulty').textContent = recipe.difficulty;
    document.getElementById('modal-description').textContent = `"${recipe.description}"`;
    document.getElementById('servings-count').textContent = currentServings;
    document.getElementById('modal-chef-tip').textContent = recipe.chefTip;

    renderModalIngredients();
    renderModalSteps();
    updateModalFavButtonState();

    const modal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);

    document.body.style.overflow = 'hidden';
}

function closeRecipeModal() {
    const modal = document.getElementById('recipe-modal');
    const modalContent = document.getElementById('modal-content');

    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        activeModalRecipe = null;
    }, 300);
}

// Dynamically recalculate ingredient quantities based on servings
function updateServings(delta) {
    if (!activeModalRecipe) return;
    const newServings = currentServings + delta;
    if (newServings < 1 || newServings > 20) return;

    currentServings = newServings;
    document.getElementById('servings-count').textContent = currentServings;
    renderModalIngredients();
}

function renderModalIngredients() {
    if (!activeModalRecipe) return;
    const ratio = currentServings / activeModalRecipe.baseServings;

    const list = document.getElementById('modal-ingredients-list');
    list.innerHTML = activeModalRecipe.ingredients.map((ing, idx) => {
        const calculatedAmount = Math.round((ing.amount * ratio) * 100) / 100;
        return `
            <li class="flex items-center gap-3 p-3 rounded-xl bg-warmbg hover:bg-orange-100/50 transition-colors cursor-pointer border border-orange-100/50" onclick="toggleIngredientCheck(${idx})">
                <input type="checkbox" id="ing-${idx}" class="w-5 h-5 rounded text-terracota-500 focus:ring-terracota-500 accent-terracota-500 cursor-pointer">
                <label for="ing-${idx}" class="text-sm font-medium text-gray-800 cursor-pointer flex-grow select-none">
                    <span class="font-extrabold text-terracota-600">${calculatedAmount} ${ing.unit}</span> ${ing.item}
                </label>
            </li>
        `;
    }).join('');
}

function toggleIngredientCheck(idx) {
    const checkbox = document.getElementById(`ing-${idx}`);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

function renderModalSteps() {
    if (!activeModalRecipe) return;
    const list = document.getElementById('modal-steps-list');
    list.innerHTML = activeModalRecipe.steps.map((step, idx) => `
        <li class="flex gap-4 items-start">
            <span class="w-8 h-8 rounded-full bg-terracota-500 text-white font-extrabold flex items-center justify-center shrink-0 text-sm shadow-md">
                ${idx + 1}
            </span>
            <p class="text-gray-700 text-sm sm:text-base leading-relaxed pt-1">
                ${step}
            </p>
        </li>
    `).join('');
}

function updateModalFavButtonState() {
    if (!activeModalRecipe) return;
    const isFav = favorites.includes(activeModalRecipe.id);
    const btn = document.getElementById('modal-fav-btn');
    const icon = document.getElementById('modal-fav-icon');
    const text = document.getElementById('modal-fav-text');

    btn.onclick = (e) => toggleFavorite(e, activeModalRecipe.id);

    if (isFav) {
        btn.className = "flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-terracota-500 text-white border-terracota-500 flex items-center justify-center gap-2 shadow-md transition-all";
        icon.className = "fa-solid fa-heart text-white";
        text.textContent = "Guardado en Favoritos";
    } else {
        btn.className = "flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white text-gray-700 border-gray-300 hover:border-terracota-500 hover:text-terracota-600 flex items-center justify-center gap-2 transition-all";
        icon.className = "fa-regular fa-heart text-terracota-500";
        text.textContent = "Guardar en Favoritos";
    }
}

// Close modal when clicking on backdrop
document.getElementById('recipe-modal').addEventListener('click', (e) => {
    if (e.target.id === 'recipe-modal') {
        closeRecipeModal();
    }
});