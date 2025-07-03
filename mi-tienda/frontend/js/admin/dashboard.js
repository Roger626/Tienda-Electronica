// mi-tienda/frontend/js/admin/AdminDashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
    const manageProductsBtn = document.getElementById('manageProductsBtn'); 
    const categoriesSection = document.getElementById('categoriesSection');
    const productsSection = document.getElementById('productsSection'); 
    const productCategorySelectionDiv = document.getElementById('productCategorySelection'); 
    const productDisplayAreaDiv = document.getElementById('productDisplayArea'); 
    const backToCategoriesBtn = document.getElementById('backToCategoriesBtn'); 
    const productSearchInput = document.getElementById('productSearchInput'); 
    const productSearchIcon = document.getElementById('productSearchIcon'); 
    const productDisplayTitle = document.getElementById('productDisplayTitle'); 

    const categoryList = document.getElementById('categoryList'); 
    const productList = document.getElementById('productList'); 

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Modales y sus elementos
    const formModal = document.getElementById('formModal');
    const confirmModal = document.getElementById('confirmModal');
    const messageModal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalCloseBtn = document.getElementById('messageModalCloseBtn');

    // Formularios de categorías
    const categoryForm = document.getElementById('categoryForm');
    const categoryIdInput = document.getElementById('categoryId');
    const categoryNameInput = document.getElementById('categoryName');
    const categoryImageFileInput = document.getElementById('categoryImageFile');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');

    // Formularios de productos
    const productForm = document.getElementById('productForm');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productDescriptionInput = document.getElementById('productDescription');
    const productBrandInput = document.getElementById('productBrand');
    const productPriceInput = document.getElementById('productPrice');
    const productImageFileInput = document.getElementById('productImageFile'); 
    const productStockInput = document.getElementById('productStock');
    const productStatusSelect = document.getElementById('productStatus');
    const productCategorySelect = document.getElementById('productCategory');
    const saveProductBtn = document.getElementById('saveProductBtn');

    // --- Configuración de la API ---
    const API_BASE_URL = 'http://localhost/mi-tienda/backend/public/api.php';

    // Configuracion de conexión a Cloudinary
    const CLOUDINARY_CLOUD_NAME = 'dwzo5mg1r';
    const CLOUDINARY_UPLOAD_PRESET = 'Catalogo'; 
    const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


    // --- Variables de Estado ---
    let currentModalType = ''; // 'category' o 'product'
    let currentDeleteId = null;
    let currentDeleteType = ''; // 'category' o 'product'
    let allCategories = []; 
    let currentProductsForDisplay = []; // Almacena los productos de la categoría seleccionada
    let currentProductViewCategoryId = null; // ID de la categoría cuyos productos se están mostrando
    const VERY_LARGE_PRICE = 9999999;


    // --- Funciones de Utilidad ---

    /**
     * Muestra un modal de mensaje con un título y texto.
     * @param {string} title Título del mensaje.
     * @param {string} text Contenido del mensaje.
     */
    const showMessageModal = (title, text) => {
        console.log(`[Modal] Abriendo MessageModal: ${title} - ${text}`); // LOG DE DEPURACIÓN
        messageModalTitle.textContent = title;
        messageModalText.textContent = text;
        messageModal.style.display = 'block';
    };

    /**
     * Realiza una petición a la API.
     * @param {string} endpoint El endpoint específico (ej. '/categorias', '/productos/filtro/1')
     * @param {string} method Método HTTP (GET, POST, PUT, DELETE)
     * @param {object} [body] Cuerpo de la petición para POST/PUT
     * @returns {Promise<object>} Los datos de la respuesta (con `success` y `data` o `mensaje`) o un objeto de error.
     */
    const fetchData = async (endpoint, method = 'GET', body = null) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token') || ''}`
            },
            body: body ? JSON.stringify(body) : null
        };
        console.log(`Sending ${method} request to: ${url}`);
        console.log('Request body:', body);

        try {
            const response = await fetch(url, options);
            const responseText = await response.text(); 
            
            console.log(`Response Status: ${response.status}`);
            console.log(`Response Text: ${responseText}`);

            if (!response.ok) {
                let parsedError = null;
                try {
                    parsedError = JSON.parse(responseText);
                } catch (e) {
                    return { 
                        success: false, 
                        mensaje: `Error ${response.status}: El servidor respondió con un formato inesperado (posible error fatal PHP). Contenido: ${responseText.substring(0, 100)}...`,
                        data: null
                    };
                }
                return { 
                    success: false, 
                    mensaje: parsedError.mensaje || `Error ${response.status}: ${response.statusText}`, 
                    data: parsedError.data || null 
                };
            }
            
            if (response.status === 204) {
                return { success: true, mensaje: "Operación completada exitosamente.", data: null };
            }

            const data = JSON.parse(responseText); 
            return data; 

        } catch (error) {
            console.error(`Network or parsing error fetching ${endpoint}:`, error);
            showMessageModal('Error de Conexión', error.message || 'No se pudo conectar con el servidor.');
            return { success: false, mensaje: error.message || 'Error de red inesperado.', data: null };
        }
    };

    /**
     * Sube un archivo de imagen a Cloudinary.
     * @param {File} file El objeto File a subir.
     * @returns {Promise<string|null>} La URL de la imagen subida o null si falla.
     */
    const uploadImageToCloudinary = async (file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'mi-tienda-admin'); 

        try {
            console.log("Uploading image to Cloudinary...");
            const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Cloudinary Upload Error:', errorData);
                showMessageModal('Error de Subida de Imagen', `Falló la subida a Cloudinary: ${errorData.error ? errorData.error.message : 'Error desconocido'}`);
                return null;
            }

            const data = await response.json();
            console.log('Cloudinary Upload Success:', data);
            return data.secure_url; 
        } catch (error) {
            console.error('Network error during Cloudinary upload:', error);
            showMessageModal('Error de Conexión', 'No se pudo subir la imagen a Cloudinary. Revisa tu conexión.');
            return null;
        }
    };

    // --- Funciones de Autenticación y Redirección (Integradas) ---

    // Función para decodificar JWT base64 (solo para leer payload)
    const decodeJwtPayload = (token) => {
        try {
            const base64Url = token.split('.')[1]; // Obtiene la parte del payload
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Convierte a base64 estándar
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            return payload && payload.rol ? payload : null; 
        } catch (e) {
            console.error('Error decodificando token JWT:', e);
            return null;
        }
    };

    const checkAuth = () => {
        const token = localStorage.getItem('jwt_token');
        let userRole = localStorage.getItem('user_role');

        console.log('checkAuth: Token encontrado:', !!token);
        console.log('checkAuth: Rol de usuario de localStorage:', userRole);

        // Si hay token pero el rol no está definido en localStorage, intenta decodificar el token
        if (token && (userRole === null || userRole === 'undefined' || userRole === '')) {
            console.warn('userRole no encontrado en localStorage, intentando decodificar token para obtener el rol.');
            const decodedPayload = decodeJwtPayload(token);
            if (decodedPayload && decodedPayload.rol) { 
                userRole = decodedPayload.rol;
                localStorage.setItem('user_role', userRole); 
                console.log('Rol extraído del token y actualizado en localStorage:', userRole);
            } else {
                console.warn('No se pudo extraer el rol del token o el token no tiene la estructura esperada.');
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_role');
            }
        }

        // Condición para acceso: debe haber un token Y el rol debe ser 'admin'
        if (!token || userRole !== 'admin') {
            console.warn('Acceso no autorizado. Redirigiendo a la página de login.');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_role');
            window.location.href = '../../views/auth/login.html'; 
            return false;
        }
        console.log('Acceso autorizado como:', userRole);
        return true; 
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
        window.location.href = '../../views/auth/login.html'; 
    };

    // --- Gestión de Modales ---
    const openModal = (modalElement) => {
        console.log(`[Modal] Abriendo: ${modalElement.id}`); 
        modalElement.style.display = 'block';
    };

    const closeModal = (modalElement) => {
        console.log(`[Modal] Cerrando: ${modalElement.id}`); 
        modalElement.style.display = 'none';
        if (modalElement === formModal) {
            categoryForm.reset();
            productForm.reset();
            categoryForm.classList.add('hidden');
            productForm.classList.add('hidden');
            if (categoryImageFileInput) categoryImageFileInput.value = '';
            if (productImageFileInput) productImageFileInput.value = '';
        }
    };

    document.querySelectorAll('.close-button, .cancel-button').forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.target.closest('#formModal')) closeModal(formModal);
            else if (e.target.closest('#confirmModal')) closeModal(confirmModal);
            else if (e.target.closest('#messageModal')) closeModal(messageModal);
        });
    });

    messageModalCloseBtn.addEventListener('click', () => {
        closeModal(messageModal);
    });

    window.addEventListener('click', (event) => {
        if (event.target === formModal) {
            closeModal(formModal);
        } else if (event.target === confirmModal) {
            closeModal(confirmModal);
        } else if (event.target === messageModal) {
            closeModal(messageModal);
        }
    });


    // --- Funciones de Renderizado ---

    /**
     * Renderiza las tarjetas de categoría en la sección de Gestión de Categorías.
     * @param {Array} categories Array de objetos de categoría.
     */
    const renderCategories = (categories) => {
        if (!categoryList) return;
        categoryList.innerHTML = ''; 
        if (categories.length === 0) {
            categoryList.innerHTML = '<p class="no-results-message">No hay categorías para mostrar.</p>';
            return;
        }

        categories.forEach(category => {
            const placeholderText = encodeURIComponent(category.nombre || 'Categoría');
            const placeholderImageUrl = `https://placehold.co/100x100/AEC9CC/2F4F5E?text=${placeholderText}`;

            const categoryCard = document.createElement('div');
            categoryCard.classList.add('data-card');
            categoryCard.innerHTML = `
                <img src="${category.imagen_url || placeholderImageUrl}" alt="${category.nombre}" class="data-image" onerror="this.onerror=null;this.src='${placeholderImageUrl}';">
                <div class="data-details">
                    <h4>${category.nombre}</h4>
                    <p>ID: ${category.id}</p>
                </div>
                <div class="data-actions">
                    <button class="btn btn-edit" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete" data-id="${category.id}" data-name="${category.nombre}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            categoryList.appendChild(categoryCard);
        });

        categoryList.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => editCategory(e.currentTarget.dataset.id));
        });
        categoryList.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'category', e.currentTarget.dataset.name));
        });
    };

    /**
     * Renderiza las tarjetas de categoría para la selección en la sección de productos.
     * @param {Array} categories Array de objetos de categoría.
     */
    const renderProductCategoriesForSelection = (categories) => {
        if (!productCategorySelectionDiv) return;
        productCategorySelectionDiv.innerHTML = '<h2>Seleccionar Categoría para Productos</h2>'; 
        const categoryGrid = document.createElement('div');
        categoryGrid.classList.add('data-list'); 

        if (categories.length === 0) {
            categoryGrid.innerHTML = '<p class="no-results-message">No hay categorías para gestionar productos.</p>';
            productCategorySelectionDiv.appendChild(categoryGrid);
            return;
        }

        categories.forEach(category => {
            const placeholderText = encodeURIComponent(category.nombre || 'Categoría');
            const placeholderImageUrl = `https://placehold.co/100x100/AEC9CC/2F4F5E?text=${placeholderText}`;

            const categoryCard = document.createElement('div');
            categoryCard.classList.add('data-card', 'category-select-card'); 
            categoryCard.dataset.categoryId = category.id; 
            categoryCard.innerHTML = `
                <img src="${category.imagen_url || placeholderImageUrl}" alt="${category.nombre}" class="data-image" onerror="this.onerror=null;this.src='${placeholderImageUrl}';">
                <div class="data-details">
                    <h4>${category.nombre}</h4>
                    <p>ID: ${category.id}</p>
                </div>
            `;
            categoryGrid.appendChild(categoryCard);
        });
        productCategorySelectionDiv.appendChild(categoryGrid);

        productCategorySelectionDiv.querySelectorAll('.category-select-card').forEach(card => {
            card.addEventListener('click', (e) => showProductsForCategory(e.currentTarget.dataset.categoryId));
        });
    };


    /**
     * Renderiza los productos de una categoría específica.
     * @param {Array} products Array de objetos de producto de la categoría seleccionada.
     * @param {string} currentCategoryName El nombre de la categoría actual para el título.
     */
    const renderProducts = (products, currentCategoryName) => {
        if (!productList) return;
        productList.innerHTML = ''; 
        productDisplayTitle.textContent = `Gestión de Productos - ${currentCategoryName}`;

        if (products.length === 0) {
            productList.innerHTML = '<p class="no-results-message">No hay productos en esta categoría o con los filtros aplicados.</p>';
            return;
        }

        products.forEach(product => {
            const productCategory = allCategories.find(cat => String(cat.id) === String(product.categoria_id));
            const categoryName = productCategory ? productCategory.name : 'Desconocida';
            const statusText = parseInt(product.estado) === 1 ? 'Activo' : 'Inactivo'; 
            const statusClass = parseInt(product.estado) === 1 ? 'status-active' : 'status-inactive';

            const placeholderText = encodeURIComponent(product.nombre || 'Producto');
            const placeholderImageUrl = `https://placehold.co/100x100/AEC9CC/2F4F5E?text=${placeholderText}`;

            const productCard = document.createElement('div');
            productCard.classList.add('data-card');
            productCard.innerHTML = `
                <img src="${product.imagen_url || placeholderImageUrl}" alt="${product.nombre}" class="data-image" onerror="this.onerror=null;this.src='${placeholderImageUrl}';">
                <div class="data-details">
                    <h4>${product.nombre} (${product.marca || 'N/A'})</h4>
                    <p>${product.descripcion ? product.descripcion.substring(0, 70) + '...' : 'Sin descripción'}</p>
                    <p>Precio: $${parseFloat(product.precio).toFixed(2)} | Stock: ${product.stock}</p>
                    <p>Categoría: ${categoryName} | Estado: <span class="${statusClass}">${statusText}</span></p>
                </div>
                <div class="data-actions">
                    <button class="btn btn-edit" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-delete" data-id="${product.id}" data-name="${product.nombre}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            productList.appendChild(productCard);
        });

        productList.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => editProduct(e.currentTarget.dataset.id));
        });
        productList.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, 'product', e.currentTarget.dataset.name));
        });
    };

    /**
     * Pobla el select de categorías en el formulario de productos y carga todas las categorías.
     */
    const populateCategorySelect = async () => {
        try {
            const response = await fetchData('/categorias'); 
            if (response.success) {
                allCategories = response.data || []; 
                productCategorySelect.innerHTML = '<option value="">Seleccione una categoría</option>';
                allCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.nombre;
                    productCategorySelect.appendChild(option);
                });
                return true; 
            } else {
                showMessageModal('Error de Carga', response.mensaje || 'No se pudieron cargar las categorías para el selector de productos.');
                return false; 
            }
        } catch (error) {
            console.error("Error al cargar categorías para el select (red):", error);
            return false; 
        }
    };

    // --- CRUD de Categorías ---
    const loadCategories = async () => {
        categoryList.innerHTML = '<p class="loading-message">Cargando categorías...</p>';
        try {
            const data = await fetchData('/categorias');
            if (data.success) {
                allCategories = data.data || []; 
                renderCategories(allCategories);
            } else {
                showMessageModal('Error de Carga', data.mensaje || 'Ocurrió un error al cargar las categorías.');
                categoryList.innerHTML = '<p class="error-message">Error al cargar categorías.</p>';
            }
        } catch (error) {
            categoryList.innerHTML = '<p class="error-message">Error de conexión al cargar categorías.</p>';
            console.error('Error loading categories (red):', error);
        }
    };

    const addCategory = () => {
        modalTitle.textContent = 'Añadir Nueva Categoría';
        categoryForm.classList.remove('hidden');
        productForm.classList.add('hidden'); 
        categoryIdInput.value = ''; 
        categoryForm.reset(); 
        if (categoryImageFileInput) categoryImageFileInput.value = '';
        openModal(formModal);
    };

    const editCategory = async (id) => {
        modalTitle.textContent = 'Editar Categoría';
        categoryForm.classList.remove('hidden');
        productForm.classList.add('hidden');
        
        try {
            const data = await fetchData(`/categorias/${id}`); 
            if (data.success && data.data) { 
                const category = data.data; 
                categoryIdInput.value = category.id;
                categoryNameInput.value = category.nombre;
                if (categoryImageFileInput) categoryImageFileInput.value = ''; 
                openModal(formModal);
            } else {
                showMessageModal('Error', data.mensaje || 'Categoría no encontrada o error al cargarla.');
            }
        } catch (error) {
            console.error('Error fetching category for edit (red):', error);
        }
    };

    const saveCategory = async (e) => {
        e.preventDefault();
        
        const categoryName = categoryNameInput.value.trim();
        const categoryFile = categoryImageFileInput.files[0];

        if (!categoryName) {
            showMessageModal('Error de Validación', 'El nombre de la categoría es obligatorio.');
            return;
        }

        if (!categoryIdInput.value && (!categoryFile || categoryFile.size === 0)) { 
            showMessageModal('Error de Validación', 'Debe seleccionar una imagen para la nueva categoría.');
            return;
        }

        const id = categoryIdInput.value;
        let imageUrl = '';

        if (categoryFile && categoryFile.size > 0) { 
            imageUrl = await uploadImageToCloudinary(categoryFile);
            if (!imageUrl) {
                return; 
            }
        } else if (id) {
            const existingCategoryData = await fetchData(`/categorias/${id}`);
            if (existingCategoryData.success && existingCategoryData.data) {
                imageUrl = existingCategoryData.data.imagen_url || '';
            }
        }

        const categoryData = {
            nombre: categoryName, 
            imagen_url: imageUrl 
        };

        try {
            const response = await fetchData(id ? `/categorias/${id}` : '/categorias', id ? 'PUT' : 'POST', categoryData);
            if (response.success) {
                showMessageModal('Éxito', response.mensaje || (id ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.'));
                closeModal(formModal);
                await populateCategorySelect(); 
                loadCategories(); 
            } else {
                showMessageModal('Error', response.mensaje || 'Ocurrió un error al guardar la categoría.');
            }
        } catch (error) {
            console.error('Error saving category (red):', error);
        }
    };

    // --- Gestión de Productos (Nueva Lógica) ---

    /**
     * Muestra la lista de categorías para seleccionar y gestionar productos.
     */
    const loadProductCategoriesForSelection = async () => {
        productCategorySelectionDiv.classList.remove('hidden');
        productDisplayAreaDiv.classList.add('hidden');
        
        productCategorySelectionDiv.innerHTML = '<p class="loading-message">Cargando categorías para productos...</p>';
        if (allCategories.length > 0) {
            renderProductCategoriesForSelection(allCategories); 
        } else {
            try {
                const response = await fetchData('/categorias');
                if (response.success) {
                    allCategories = response.data || []; 
                    renderProductCategoriesForSelection(allCategories); 
                } else {
                    showMessageModal('Error de Carga', response.mensaje || 'No se pudieron cargar las categorías para seleccionar productos.');
                    productCategorySelectionDiv.innerHTML = '<p class="error-message">Error al cargar categorías de productos.</p>';
                }
            } catch (error) {
                productCategorySelectionDiv.innerHTML = '<p class="error-message">Error al cargar categorías de productos.</p>';
                console.error('Error loading product categories (red):', error);
            }
        }
    };

    /**
     * Muestra y gestiona los productos de una categoría específica.
     * @param {string} categoryId ID de la categoría cuyos productos se van a mostrar.
     */
    const showProductsForCategory = async (categoryId) => {
        currentProductViewCategoryId = categoryId; 
        productCategorySelectionDiv.classList.add('hidden');
        productDisplayAreaDiv.classList.remove('hidden');
        productList.innerHTML = '<p class="loading-message">Cargando productos...</p>';
        productSearchInput.value = ''; 

        try {
            const category = allCategories.find(cat => String(cat.id) === String(categoryId));
            const categoryName = category ? category.name : 'Categoría Desconocida';

            const productsDataResponse = await fetchData(`/productos/filtro/${categoryId}?min=0&max=${VERY_LARGE_PRICE}`);
            
            if (productsDataResponse.success) {
                currentProductsForDisplay = productsDataResponse.data || []; 
                filterAndRenderProducts(); 
                productCategorySelect.value = categoryId; 
            } else {
                if (productsDataResponse.mensaje && productsDataResponse.mensaje.includes("No se encontraron productos")) {
                    productList.innerHTML = `<p class="no-results-message">${productsDataResponse.mensaje}</p>`;
                } else {
                    showMessageModal('Error del Servidor', productsDataResponse.mensaje || 'Ocurrió un error inesperado al cargar productos.');
                    productList.innerHTML = '<p class="error-message">Error al cargar productos de la categoría.</p>';
                }
            }
            
        } catch (error) {
            productList.innerHTML = '<p class="error-message">Error de conexión o procesamiento.</p>';
            console.error('Error en showProductsForCategory (red/sin manejar):', error);
        }
    };

    /**
     * Filtra y renderiza los productos basándose en el término de búsqueda actual.
     */
    const filterAndRenderProducts = () => {
        const searchTerm = productSearchInput.value.toLowerCase().trim();
        
        let filtered = currentProductsForDisplay.filter(product => {
            const matchesName = product.nombre.toLowerCase().includes(searchTerm);
            const matchesDescription = product.descripcion ? product.descripcion.toLowerCase().includes(searchTerm) : false;
            const matchesBrand = product.marca ? product.marca.toLowerCase().includes(searchTerm) : false;
            return matchesName || matchesDescription || matchesBrand;
        });
        
        const currentCategory = allCategories.find(cat => String(cat.id) === String(currentProductViewCategoryId));
        const currentCategoryName = currentCategory ? currentCategory.name : 'Categoría Desconocida';

        renderProducts(filtered, currentCategoryName);
    };


    const addProduct = async () => {
        if (!currentProductViewCategoryId) {
            showMessageModal('Error', 'Primero debe seleccionar una categoría para añadir productos.');
            return;
        }
        modalTitle.textContent = 'Añadir Nuevo Producto';
        productForm.classList.remove('hidden');
        categoryForm.classList.add('hidden'); 
        productIdInput.value = ''; 
        productForm.reset(); 
        if (productImageFileInput) productImageFileInput.value = '';

        productCategorySelect.value = currentProductViewCategoryId; 
        productCategorySelect.disabled = true; 

        openModal(formModal);
    };

    const editProduct = async (id) => {
        modalTitle.textContent = 'Editar Producto';
        productForm.classList.remove('hidden');
        categoryForm.classList.add('hidden');
        
        try {
            const data = await fetchData(`/productos/${id}`);
            if (data.success && data.data) {
                const product = data.data;
                productIdInput.value = product.id;
                productNameInput.value = product.nombre;
                productDescriptionInput.value = product.descripcion || '';
                productBrandInput.value = product.marca || '';
                productPriceInput.value = parseFloat(product.precio).toFixed(2);
                if (productImageFileInput) productImageFileInput.value = ''; 
                productStockInput.value = product.stock;
                productStatusSelect.value = product.estado; 
                productCategorySelect.value = product.categoria_id; 
                productCategorySelect.disabled = false; 
                openModal(formModal);
            } else {
                showMessageModal('Error', data.mensaje || 'Producto no encontrado.');
            }
        } catch (error) {
            console.error('Error fetching product for edit (red):', error);
        }
    };

    const saveProduct = async (e) => {
        e.preventDefault();
        
        const productName = productNameInput.value.trim();
        const productDescription = productDescriptionInput.value.trim();
        const productBrand = productBrandInput.value.trim();
        const productPrice = parseFloat(productPriceInput.value);
        const productStock = parseInt(productStockInput.value);
        const productCategoryId = productCategorySelect.value;
        const productFile = productImageFileInput.files[0];

        if (!productName) {
            showMessageModal('Error de Validación', 'El nombre del producto es obligatorio.');
            return;
        }
        if (!productDescription) {
            showMessageModal('Error de Validación', 'La descripción del producto es obligatoria.');
            return;
        }
        if (!productBrand) {
            showMessageModal('Error de Validación', 'La marca del producto es obligatoria.');
            return;
        }
        
        if (isNaN(productPrice) || productPrice <= 0) {
            showMessageModal('Error de Validación', 'El precio del producto debe ser un número positivo.');
            return;
        }
        if (isNaN(productStock) || productStock < 0) {
            showMessageModal('Error de Validación', 'El stock del producto debe ser un número no negativo.');
            return;
        }
        if (!productCategoryId) {
            showMessageModal('Error de Validación', 'Debe seleccionar una categoría para el producto.');
            return;
        }

        if (!productIdInput.value && (!productFile || productFile.size === 0)) { 
            showMessageModal('Error de Validación', 'Debe seleccionar una imagen para el nuevo producto.');
            return;
        }

        const id = productIdInput.value;
        let imageUrl = '';

        if (productFile && productFile.size > 0) { 
            imageUrl = await uploadImageToCloudinary(productFile);
            if (!imageUrl) {
                return; 
            }
        } else if (id) {
            const existingProductData = await fetchData(`/productos/${id}`);
            if (existingProductData.success && existingProductData.data) {
                imageUrl = existingProductData.data.imagen_url || '';
            }
        }

        const productData = {
            nombre: productName,
            descripcion: productDescription, 
            marca: productBrand, 
            precio: productPrice,
            imagen_url: imageUrl, 
            stock: productStock,
            estado: parseInt(productStatusSelect.value), 
            categoria_id: parseInt(productCategoryId) 
        };

        try {
            const response = await fetchData(id ? `/productos/${id}` : '/productos', id ? 'PUT' : 'POST', productData);
            if (response.success) {
                showMessageModal('Éxito', response.mensaje || (id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'));
            } else {
                showMessageModal('Error', response.mensaje || 'Ocurrió un error al guardar el producto.');
            }
            closeModal(formModal);
            if (currentProductViewCategoryId) {
                await showProductsForCategory(currentProductViewCategoryId);
            } else {
                loadProductCategoriesForSelection(); 
            }
        } catch (error) {
            console.error('Error saving product (red):', error);
        }
    };


    // --- Funciones de Eliminación (Común para categorías y productos) ---
    const confirmDelete = (id, type, name) => {
        console.log(`[Modal] Llamada a confirmDelete para ID: ${id}, Tipo: ${type}, Nombre: ${name}`); 
        currentDeleteId = id;
        currentDeleteType = type;
        document.getElementById('confirmMessage').textContent = `¿Estás seguro de que quieres eliminar ${type === 'category' ? 'la categoría' : 'el producto'} "${name}" (ID: ${id})? Esta acción es irreversible.`;
        openModal(confirmModal);
    };

    const executeDelete = async () => {
        try {
            let response;
            if (currentDeleteType === 'category') {
                response = await fetchData(`/categorias/${currentDeleteId}`, 'DELETE');
            } else if (currentDeleteType === 'product') {
                response = await fetchData(`/productos/${currentDeleteId}`, 'DELETE');
            }

            if (response && response.success) {
                showMessageModal('Éxito', response.mensaje || (currentDeleteType === 'category' ? 'Categoría eliminada correctamente.' : 'Producto eliminado correctamente.'));
                if (currentDeleteType === 'category') {
                    await populateCategorySelect(); 
                    loadCategories();
                    loadProductCategoriesForSelection(); 
                } else if (currentDeleteType === 'product') {
                    if (currentProductViewCategoryId) {
                        showProductsForCategory(currentProductViewCategoryId);
                    } else {
                        loadProductCategoriesForSelection(); 
                    }
                }
                closeModal(confirmModal);
            } else {
                showMessageModal('Error', response.mensaje || `Ocurrió un error al eliminar ${currentDeleteType}.`);
            }
        } catch (error) {
            console.error(`Error deleting ${currentDeleteType} (red):`, error);
        } finally {
            currentDeleteId = null;
            currentDeleteType = '';
        }
    };

    // --- Manejo de la Navegación del Sidebar ---
    const activateSection = (sectionId) => {
        document.querySelectorAll('.management-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        if (sectionId === 'categoriesSection') {
            manageCategoriesBtn.classList.add('active');
            productCategorySelectionDiv.classList.add('hidden');
            productDisplayAreaDiv.classList.add('hidden');
            loadCategories(); 
        } else if (sectionId === 'productsSection') {
            manageProductsBtn.classList.add('active');
            loadProductCategoriesForSelection();
            currentProductViewCategoryId = null; 
            productSearchInput.value = ''; 
        }
    };

    // --- Listeners de Eventos Principales ---
    manageCategoriesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        activateSection('categoriesSection');
    });

    manageProductsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        activateSection('productsSection');
    });

    addCategoryBtn.addEventListener('click', addCategory);
    addProductBtn.addEventListener('click', addProduct);

    saveCategoryBtn.addEventListener('click', saveCategory);
    saveProductBtn.addEventListener('click', saveProduct);

    document.getElementById('confirmDeleteBtn').addEventListener('click', executeDelete);

    logoutBtn.addEventListener('click', handleLogout);

    backToCategoriesBtn.addEventListener('click', () => {
        activateSection('productsSection'); 
    });

    productSearchIcon.addEventListener('click', filterAndRenderProducts);
    productSearchInput.addEventListener('input', filterAndRenderProducts); 


    // --- Inicialización ---
    const init = async () => {
        if (!checkAuth()) { // Realizar la verificación de autenticación al inicio
            return; // Detener si no está autorizado
        }

        closeModal(formModal);
        closeModal(confirmModal);
        closeModal(messageModal);

        const categoriesLoaded = await populateCategorySelect(); 
        
        if (categoriesLoaded) {
            activateSection('categoriesSection'); 
        } else {
            console.error("No se pudieron cargar las categorías iniciales. La interfaz podría no funcionar correctamente.");
        }
    };

    init();
});
