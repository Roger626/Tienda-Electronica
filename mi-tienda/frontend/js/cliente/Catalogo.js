// mi-tienda/frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const minPriceInput = document.getElementById('min-price-input');
    const maxPriceInput = document.getElementById('max-price-input'); 
    const minPriceSlider = document.getElementById('min-price-slider');
    const maxPriceSlider = document.getElementById('max-price-slider');
    const clearFiltersBtn = document.querySelector('.clear-filters-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const categoryCarousel = document.querySelector('.category-carousel');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const searchInput = document.querySelector('.search-input');
    const searchIcon = document.querySelector('.search-icon');

    
    const API_BASE_URL = 'http://localhost/mi-tienda/backend/public/api.php';
 
    let allProducts = []; // Para almacenar todos los productos fetched (después de filtrado inicial del backend)
    let filteredProductsData = []; // Para almacenar los productos después de aplicar todos los filtros
    let allCategories = []; // Para almacenar todas las categorías fetched
    let displayedProductsCount = 0; // Para la paginación de "Mostrar Más"
    const PRODUCTS_PER_LOAD = 12; // Cuántos productos cargar cada vez
    const VERY_LARGE_PRICE = 9999999;
    let currentCategoryMaxPrice = 2000; // Valor por defecto inicial, se actualizará dinámicamente

    /**
     * Realiza una petición GET a la API y devuelve los datos.
     * @param {string} endpoint El endpoint específico (ej. '/productos', '/categorias')
     * @param {URLSearchParams} [params] Parámetros de consulta opcionales
     * @returns {Promise<Array>} Un array de datos o un array vacío en caso de error.
     */
    const fetchData = async (endpoint, params = new URLSearchParams()) => {
        const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
        console.log("Fetching from:", url);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const responseText = await response.text();
                console.error(`API Error ${response.status} fetching ${endpoint}:`);
                console.error("Response text:", responseText);
                try {
                    const errorData = JSON.parse(responseText); 
                    console.error("Parsed error data:", errorData.mensaje || errorData);
                    if (response.status === 200 && errorData.mensaje && errorData.mensaje.includes("No se encontraron productos")) {
                        return [];
                    }
                } catch (parseError) {
                    console.error("Failed to parse error response as JSON:", parseError);
                    console.error("This usually means the server returned non-JSON content (e.g., PHP errors/warnings).");
                }
                return []; 
            }
            const data = await response.json();
            if (data.success) {
                return data.data || [];
            } else {
                console.error(`API Error ${endpoint}:`, data.mensaje);
                return [];
            }
        } catch (error) {
            console.error(`Network or parsing error fetching ${endpoint}:`, error);
            return [];
        }
    };

    /**
     * Obtiene los productos desde el backend, aplicando filtros iniciales de categoría y precio.
     * El término de búsqueda se aplica posteriormente en el frontend.
     * @param {string} categoryId ID de la categoría seleccionada (o 'all')
     * @param {number} minPrice Precio mínimo
     * @param {number} maxPrice Precio máximo
     * @returns {Promise<Array>} Lista de productos filtrados por backend.
     */
    const fetchProductsFromBackend = async (categoryId, minPrice, maxPrice) => {
        let endpoint;
        const params = new URLSearchParams();

        if (categoryId && categoryId !== 'all') {
            endpoint = `/productos/filtro/${categoryId}`;
            params.append('min', minPrice);
            params.append('max', maxPrice);
        } else {
            endpoint = `/productos`;
        }
        
        const products = await fetchData(endpoint, params);
        console.log("Products fetched from backend (before client-side filtering):", products); // Para depuración
        return products;
    };


    /**
     * Obtiene todas las categorías desde el backend.
     * @returns {Promise<Array>} Lista de categorías.
     */
    const fetchCategoriesFromBackend = async () => {
        const categories = await fetchData('/categorias');
        const processedCategories = categories
            .filter(cat => cat && typeof cat === 'object' && cat.id !== undefined && cat.id !== null)
            .map(cat => ({
                id: String(cat.id), 
                name: cat.nombre || 'Categoría sin nombre', 
                imageUrl: cat.imagen_url || 'https://placehold.co/70x70/E9F1F5/2F4F5E?text=Cat' 
            }));
        console.log("Categories fetched and processed:", processedCategories); 
        return processedCategories;
    };

    // --- Funciones de Renderizado ---

    // Función para crear una tarjeta de producto HTML
    const createProductCard = (product) => {
        if (!product || typeof product !== 'object') {
            console.error("Attempted to create product card for invalid product object:", product);
            return null; 
        }

        const card = document.createElement('div');
        card.classList.add('product-card');

        console.log("--- Processing product for card (ID:", product.id, ") ---");
        console.log("Product object:", product);
        console.log("product.categoria_id (raw):", product.categoria_id, "Type:", typeof product.categoria_id);
        console.log("Current state of allCategories array:", allCategories); 

        const originalImageUrl = product.imagen_url;
        const fallbackImageUrl = `https://placehold.co/200x200/AEC9CC/2F4F5E?text=${product.nombre ? product.nombre.substring(0, Math.min(product.nombre.length, 10)).replace(/\s/g, '+') : 'Producto'}`;
        
        const img = document.createElement('img');
        img.src = originalImageUrl || fallbackImageUrl; 
        img.alt = product.nombre || 'Producto sin nombre'; 
        img.classList.add('product-image');
        img.onerror = function() {
            console.warn(`Failed to load image: ${this.src}. Falling back to placeholder.`);
            this.src = fallbackImageUrl; 
            this.onerror = null; 
        };
        card.appendChild(img);

        const name = document.createElement('h3');
        name.classList.add('product-name');
        name.textContent = product.nombre || 'Nombre no disponible'; 
        card.appendChild(name);

        const category = document.createElement('p');
        category.classList.add('product-category');
        
        let categoryName = 'Categoría Desconocida'; 
        
        if (product.categoria_id !== undefined && product.categoria_id !== null) {
            const targetCategoryId = String(product.categoria_id); 
            console.log("  Searching for category with target ID:", targetCategoryId);

            const foundCategory = allCategories.find(cat => {
                return cat && typeof cat === 'object' && cat.id !== undefined && cat.id !== null && String(cat.id) === targetCategoryId;
            });

            if (foundCategory) {
                categoryName = foundCategory.name;
                console.log("  Found Category Name:", categoryName);
            } else {
                console.warn(`Category with ID "${targetCategoryId}" not found in allCategories for product:`, product);
            }
        } else {
            console.warn("Product is missing 'categoria_id' or it's null, cannot determine category name for product:", product);
        }

        category.textContent = categoryName;
        card.appendChild(category);

        const price = document.createElement('p');
        price.classList.add('product-price');
        const productPrice = parseFloat(product.precio);
        price.textContent = `$${isNaN(productPrice) ? '0.00' : productPrice.toFixed(2)}`; 
        card.appendChild(price);

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('product-card-actions');

        const buyButton = document.createElement('button');
        buyButton.classList.add('btn', 'btn-primary', 'buy-button');
        buyButton.textContent = `Comprar`;
        buyButton.addEventListener('click', () => alert(`Comprar ${product.nombre || 'Producto'} por $${productPrice.toFixed(2)}`));
        actionsDiv.appendChild(buyButton);

        const addToCartButton = document.createElement('button'); 
        addToCartButton.classList.add('btn', 'btn-secondary', 'add-to-cart-button'); 

        addToCartButton.innerHTML = '<i class="fas fa-shopping-basket"></i>';
        addToCartButton.addEventListener('click', () => alert(`Añadir ${product.nombre || 'Producto'} al carrito`));
        actionsDiv.appendChild(addToCartButton);

        card.appendChild(actionsDiv);

        return card;
    };

    // Función para crear un elemento de categoría HTML
    const createCategoryItem = (category) => {
        const div = document.createElement('div');
        div.classList.add('category-item');
        div.dataset.category = category.id; 

        const img = document.createElement('img');
        img.src = category.imageUrl;
        img.alt = `Categoría ${category.name}`;
        img.onerror = function() {
            console.warn(`Failed to load category image: ${this.src}. Falling back to placeholder.`);
            this.src = `https://placehold.co/70x70/AEC9CC/2F4F5E?text=${category.name ? category.name.substring(0, Math.min(category.name.length, 4)).replace(/\s/g, '+') : 'Cat'}`;
            this.onerror = null; 
        };
        div.appendChild(img);

        const p = document.createElement('p');
        p.textContent = category.name;
        div.appendChild(p);

        return div;
    };

    // Función para renderizar los productos en la cuadrícula
    const renderProducts = (productsToRender) => {
        productGrid.innerHTML = ''; 
        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p class="no-results-message">No se encontraron productos con los filtros aplicados.</p>';
            return;
        }
        productsToRender.forEach(product => {
            const card = createProductCard(product);
            if (card) { 
                productGrid.appendChild(card);
            }
        });
    };

    // Función para renderizar las categorías en el carrusel
    const renderCategories = (categories) => {
        categoryCarousel.innerHTML = ''; 
        allCategories = categories.filter(cat => cat && typeof cat === 'object' && cat.id !== undefined && cat.id !== null);
        console.log("All Categories loaded (filtered for validity):", allCategories); 

        const allCategoryItem = createCategoryItem({
            id: 'all',
            name: 'Todo',
            imageUrl: 'https://placehold.co/70x70/E9F1F5/2F4F5E?text=Todo'
        });
        categoryCarousel.appendChild(allCategoryItem);

        allCategories.forEach(category => {
            if (category.id !== 'all') {
                const item = createCategoryItem(category);
                categoryCarousel.appendChild(item);
            }
        });
        attachCategoryEventListeners();
        document.querySelector('.category-item[data-category="all"]').classList.add('active');
    };

    // --- Lógica de Interacción y Filtrado ---

    // Función para actualizar el valor máximo de los sliders y inputs de precio
    // resetCurrentValues: Si es true, reinicia min a 0 y max al valor calculado.
    const updatePriceRangeUIMax = (newMaxPriceForCategory, resetCurrentValues = false) => {
        let calculatedMax = Math.max(newMaxPriceForCategory || 0, 0); 
        calculatedMax = Math.ceil(calculatedMax); 
        maxPriceInput.max = calculatedMax;
        maxPriceSlider.max = calculatedMax;

        // Si se pide un reset (cambio de categoría, limpiar filtros) o si el rango actual es inválido/cero
        if (resetCurrentValues || parseFloat(maxPriceInput.value) === 0 || parseFloat(minPriceInput.value) > calculatedMax) {
            minPriceInput.value = minPriceInput.min || '0';
            minPriceSlider.value = minPriceSlider.min || '0';
            maxPriceInput.value = calculatedMax;
            maxPriceSlider.value = calculatedMax;
            console.log(`Price range UI reset to full range: ${minPriceInput.value} - ${maxPriceInput.value}`);
        } else {
            // Mantener los valores del usuario, pero ajustarlos si exceden el nuevo max
            let currentMinVal = parseFloat(minPriceInput.value);
            let currentMaxVal = parseFloat(maxPriceInput.value);

            currentMaxVal = Math.min(currentMaxVal, calculatedMax); // Asegurarse que el max actual no supere el nuevo max de la categoría
            currentMinVal = Math.min(currentMinVal, currentMaxVal); // Asegurar que min <= max
            currentMinVal = Math.max(currentMinVal, parseFloat(minPriceInput.min || '0')); // Asegurar que min >= minAllowed

            minPriceInput.value = currentMinVal;
            minPriceSlider.value = currentMinVal;
            maxPriceInput.value = currentMaxVal;
            maxPriceSlider.value = currentMaxVal;

            console.log(`Price range UI adjusted (keeping user's values within new bounds): ${minPriceInput.value} - ${maxPriceInput.value}`);
        }
       
        currentCategoryMaxPrice = calculatedMax; 
        console.log("Updated dynamic max price (for global reset reference) to:", currentCategoryMaxPrice);
    };

    // Función para adjuntar listeners a las categorías (importante para elementos dinámicos)
    const attachCategoryEventListeners = () => {
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', handleCategoryClick);
        });
    };

    // Handler para el clic en una categoría
    const handleCategoryClick = (event) => {
        document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
        event.currentTarget.classList.add('active');
        // Al cambiar de categoría, siempre se fuerza un reset completo para recalcular el max de esa categoría
        // y mostrar su rango completo por defecto.
        applyFiltersAndRender(true); 
    };

    // Función para aplicar todos los filtros (backend y frontend) y renderizar
    // resetPriceSliders: indica si se deben restablecer los valores de los sliders después de calcular el nuevo rango máximo.
    const applyFiltersAndRender = async (resetPriceSliders = false) => {
        const selectedCategory = document.querySelector('.category-item.active')?.dataset.category || 'all';
        const searchTerm = searchInput.value.toLowerCase().trim();

        let productsFetchedForMaxCalculation;

        productsFetchedForMaxCalculation = await fetchProductsFromBackend(selectedCategory, 0, VERY_LARGE_PRICE);
        let highestPriceInFetchedProducts = 0;
        if (productsFetchedForMaxCalculation.length > 0) {
            highestPriceInFetchedProducts = Math.max(...productsFetchedForMaxCalculation.map(p => parseFloat(p.precio)).filter(price => !isNaN(price)));
        }
        
        // Actualizar el UI de los sliders (sus atributos max y sus valores)
        // La bandera `resetPriceSliders` aquí es crucial para decidir si se resetean los valores 
        // de `minPriceInput.value` y `maxPriceInput.value` a 0 y el nuevo máximo.
        updatePriceRangeUIMax(highestPriceInFetchedProducts, resetPriceSliders);
        const minPriceFilter = parseFloat(minPriceInput.value);
        const maxPriceFilter = parseFloat(maxPriceInput.value);
        allProducts = productsFetchedForMaxCalculation;

        //Aplicar el filtro de búsqueda Y PRECIO sobre `allProducts` 
        filteredProductsData = allProducts.filter(product => {
            let matchesPrice = true;
            const currentProductPrice = parseFloat(product.precio);

            if (!isNaN(currentProductPrice)) {
                matchesPrice = currentProductPrice >= minPriceFilter && currentProductPrice <= maxPriceFilter;
            } else {
                matchesPrice = false;
                console.warn(`Product ${product.id} (${product.nombre}) has invalid price: ${product.precio}. Excluded from price filter.`);
            }
            
            const matchesSearch = (product.nombre && product.nombre.toLowerCase().includes(searchTerm)) || 
                                  (product.id_categoria !== undefined && product.id_categoria !== null && 
                                   allCategories.find(cat => cat.id === String(product.id_categoria))?.name.toLowerCase().includes(searchTerm));
            
            if (!matchesSearch && searchTerm) { 
                console.log(`Product ${product.id} (${product.nombre}) filtered by search term "${searchTerm}".`);
            }
            if (!matchesPrice && matchesSearch && !searchTerm) {
                 console.log(`Product ${product.id} (${product.nombre}) filtered by price. Price: ${product.precio}, Min: ${minPriceFilter}, Max: ${maxPriceFilter}`);
            }

            return matchesPrice && matchesSearch;
        });

        //Reiniciar paginación y renderizar los productos filtrados
        displayedProductsCount = PRODUCTS_PER_LOAD;
        const productsToShow = filteredProductsData.slice(0, displayedProductsCount);
        renderProducts(productsToShow);

        //Mostrar u ocultar botón "Mostrar Más"
        loadMoreBtn.style.display = (filteredProductsData.length > displayedProductsCount) ? 'flex' : 'none';
    };


    // --- Lógica de Interacción del Frontend ---

    // Sliders de Rango de Precio
    const updateSliderRange = () => {
        const minVal = parseInt(minPriceSlider.value);
        const maxVal = parseInt(maxPriceSlider.value);

        if (minVal > maxVal) {
            minPriceSlider.value = maxVal; 
        }
        
        minPriceInput.value = minPriceSlider.value;
        maxPriceInput.value = maxPriceSlider.value;
        
        // Cuando el usuario mueve los sliders, no se debe resetear el rango de precios.
        applyFiltersAndRender(false); 
    };

    minPriceSlider.addEventListener('input', updateSliderRange);
    maxPriceSlider.addEventListener('input', updateSliderRange);

    // Inputs de Rango de Precio (texto)
    minPriceInput.addEventListener('change', (e) => {
        let value = parseInt(e.target.value);
        const minAllowed = parseInt(minPriceSlider.min || '0');
        const maxAllowed = parseInt(minPriceSlider.max || '1000'); 

        if (isNaN(value) || value < minAllowed) value = minAllowed;
        if (value > maxAllowed) value = maxAllowed;
        if (value > parseFloat(maxPriceInput.value)) value = parseFloat(maxPriceInput.value); 

        minPriceInput.value = value;
        minPriceSlider.value = value;
        applyFiltersAndRender(false); 
    });

    maxPriceInput.addEventListener('change', (e) => {
        let value = parseInt(e.target.value);
        const minAllowed = parseInt(maxPriceSlider.min || '0');
        const maxAllowed = parseInt(maxPriceSlider.max || '1000'); 

        if (isNaN(value) || value < minAllowed) value = minAllowed;
        if (value > maxAllowed) value = maxAllowed;
        if (value < parseFloat(minPriceInput.value)) value = parseFloat(minPriceInput.value); 

        maxPriceInput.value = value;
        maxPriceSlider.value = value;
        applyFiltersAndRender(false); 
    });

    // Limpiar Filtros
    clearFiltersBtn.addEventListener('click', () => {
        // Obtenemos la categoría seleccionada actualmente
        const selectedCategory = document.querySelector('.category-item.active')?.dataset.category || 'all';

        // Solo limpiar el input de búsqueda y resetear los valores de precio
        searchInput.value = ''; 
        applyFiltersAndRender(true); 
    });

    // Funcionalidad de Búsqueda
    searchIcon.addEventListener('click', () => applyFiltersAndRender(false)); 
    searchInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') {
            applyFiltersAndRender(false); 
        }
    });

    // Botón "Mostrar Más"
    loadMoreBtn.addEventListener('click', () => {
        displayedProductsCount += PRODUCTS_PER_LOAD;
        const productsToShow = filteredProductsData.slice(0, displayedProductsCount); 
        renderProducts(productsToShow);

        if (filteredProductsData.length <= displayedProductsCount) {
            loadMoreBtn.style.display = 'none';
        }
    });

    // Botón de Cerrar Sesión
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        alert('Sesión cerrada. Serás redirigido a la página de inicio.');
        window.location.href = '../../views/auth/login.html'; 
    });


    // --- Inicialización al Cargar la Página ---
    const init = async () => {
        minPriceInput.value = minPriceInput.min || '0';
        maxPriceInput.value = maxPriceInput.max || '2000'; 
        minPriceSlider.value = minPriceSlider.min || '0';
        maxPriceSlider.value = maxPriceSlider.max || '2000'; 

        allCategories = await fetchCategoriesFromBackend(); 
        renderCategories(allCategories); 
        
        applyFiltersAndRender(true); 
    };

    init();
});
