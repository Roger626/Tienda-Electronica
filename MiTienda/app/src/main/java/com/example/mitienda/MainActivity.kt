// mi-tienda-android/app/src/main/java/com/example/mitienda/MainActivity.kt

package com.example.mitienda

import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.mitienda.adapter.CategoryAdapter
import com.example.mitienda.adapter.ProductAdapter
import com.example.mitienda.databinding.ActivityMainBinding
import com.example.mitienda.model.Category
import com.example.mitienda.ui.FiltersBottomSheetDialogFragment // Asegúrate de que esta importación sea correcta
import com.example.mitienda.viewmodel.CatalogViewModel

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val catalogViewModel: CatalogViewModel by viewModels()
    private lateinit var categoryAdapter: CategoryAdapter
    private lateinit var productAdapter: ProductAdapter

    private var categoryNamesMap: Map<Int, String> = emptyMap()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupCategoryCarousel()
        setupProductGrid()
        setupObservers()
        setupFiltersAndSearch()
    }

    private fun setupCategoryCarousel() {
        categoryAdapter = CategoryAdapter(mutableListOf()) { category ->
            Log.d("MainActivity", "Category clicked: ${category.nombre} (ID: ${category.id})")
            catalogViewModel.selectCategory(category.id)
            binding.searchInput.text.clear()
            // No llamar a setSearchQuery aquí, ya se hace dentro de selectCategory al reiniciar filtros.
            // catalogViewModel.setSearchQuery("") // Esto se gestiona en selectCategory para resetear la búsqueda
            val selectedCategoryName = category.nombre
            binding.productsSectionTitle.text = "Productos en $selectedCategoryName"
        }
        binding.categoryCarousel.apply {
            layoutManager = LinearLayoutManager(this@MainActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = categoryAdapter
        }
    }

    private fun setupProductGrid() {
        productAdapter = ProductAdapter(mutableListOf(), categoryNamesMap)
        binding.productGrid.apply {
            layoutManager = GridLayoutManager(this@MainActivity, 2)
            adapter = productAdapter
        }
    }

    private fun setupObservers() {
        catalogViewModel.categories.observe(this) { categories ->
            Log.d("MainActivity", "Categories updated: ${categories.size} items")
            categoryAdapter.updateCategories(categories)
            categoryNamesMap = categories.associateBy({ it.id }, { it.nombre })

            // Re-inicializa el adaptador de productos para que use el categoryNamesMap actualizado
            // Esto asegura que los nombres de categoría se muestren correctamente
            // en las tarjetas de producto cuando se carga la aplicación.
            productAdapter = ProductAdapter(mutableListOf(), categoryNamesMap)
            binding.productGrid.adapter = productAdapter

            if (catalogViewModel.selectedCategoryId == null || catalogViewModel.selectedCategoryId == 0) {
                categoryAdapter.selectCategoryById(0)
                binding.productsSectionTitle.text = "Productos Destacados"
            } else {
                categoryAdapter.selectCategoryById(catalogViewModel.selectedCategoryId!!)
                val selectedCategoryName = categoryNamesMap[catalogViewModel.selectedCategoryId] ?: "Categoría Desconocida"
                binding.productsSectionTitle.text = "Productos en $selectedCategoryName"
            }
        }

        catalogViewModel.products.observe(this) { products ->
            Log.d("MainActivity", "Products updated: ${products.size} items")
            productAdapter.updateProducts(products)
            binding.emptyResultsMessage.visibility = if (products.isEmpty()) View.VISIBLE else View.GONE
        }

        catalogViewModel.isLoading.observe(this) { isLoading ->
            binding.loadingIndicator.visibility = if (isLoading) View.VISIBLE else View.GONE
            binding.productGrid.visibility = if (isLoading) View.GONE else View.VISIBLE
            binding.emptyResultsMessage.visibility = View.GONE
        }

        catalogViewModel.errorMessage.observe(this) { errorMessage ->
            if (errorMessage.isNotBlank()) {
                Log.e("MainActivity", "API Error: $errorMessage")
                Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show()
                binding.emptyResultsMessage.text = errorMessage
                binding.emptyResultsMessage.visibility = View.VISIBLE
            } else {
                binding.emptyResultsMessage.visibility = View.GONE
            }
        }

        // El dynamicMaxPrice ya no se pasa directamente al BottomSheet,
        // el BottomSheet lo observará directamente del ViewModel.
        // catalogViewModel.dynamicMaxPrice.observe(this) { maxPrice ->
        //     // Aquí puedes hacer algo si quieres que MainActivity reaccione a este cambio,
        //     // pero no es necesario para pasar el valor al BottomSheet.
        // }
    }

    private fun setupFiltersAndSearch() {
        // --- Barra de Búsqueda ---
        binding.searchIcon.setOnClickListener {
            catalogViewModel.setSearchQuery(binding.searchInput.text.toString())
        }

        binding.searchInput.setOnEditorActionListener { v, actionId, event ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                catalogViewModel.setSearchQuery(binding.searchInput.text.toString())
                true
            } else {
                false
            }
        }

        // --- Botón de Filtro (abre el BottomSheet) ---
        binding.filterIcon.setOnClickListener {
            // Ya no necesitas pasar el dynamicMaxPrice directamente aquí.
            // El FiltersBottomSheetDialogFragment obtendrá el ViewModel y observará dynamicMaxPrice.
            val filtersBottomSheet = FiltersBottomSheetDialogFragment.newInstance() // No se pasan args aquí
            filtersBottomSheet.onApplyFilters = { min: Double, max: Double -> // Tipo explícito para min y max
                Log.d("MainActivity", "Applying filters: Min=$min, Max=$max")
                catalogViewModel.setPriceRange(min, max)
                // Después de aplicar filtros, la búsqueda debe ser re-evaluada
                // sobre los nuevos productos cargados.
                catalogViewModel.setSearchQuery(binding.searchInput.text.toString())
            }
            filtersBottomSheet.onResetFilters = {
                Log.d("MainActivity", "Resetting filters.")
                catalogViewModel.clearFilters()
                binding.searchInput.text.clear()
                // La selección de categoría "Todo" y el título se manejan en clearFilters() del ViewModel
                // y en el observador de categories en MainActivity.
                categoryAdapter.selectCategoryById(0) // Visualmente selecciona "Todo"
                binding.productsSectionTitle.text = "Productos Destacados" // Restablece el título
            }
            filtersBottomSheet.show(supportFragmentManager, FiltersBottomSheetDialogFragment.TAG)
        }
    }
}
