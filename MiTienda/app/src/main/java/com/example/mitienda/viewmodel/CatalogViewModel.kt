// mi-tienda-android/app/src/main/java/com/example/mitienda/viewmodel/CatalogViewModel.kt

package com.example.mitienda.viewmodel

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mitienda.api.ApiService
import com.example.mitienda.model.Category
import com.example.mitienda.model.Product
import kotlinx.coroutines.launch
import retrofit2.HttpException
import java.io.IOException

class CatalogViewModel : ViewModel() {

    private val apiService = ApiService.create()

    private val _categories = MutableLiveData<List<Category>>()
    val categories: LiveData<List<Category>> get() = _categories

    private val _products = MutableLiveData<List<Product>>()
    val products: LiveData<List<Product>> get() = _products

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> get() = _isLoading

    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> get() = _errorMessage

    // Filter state
    var selectedCategoryId: Int? = 0 // 0 for "Todo"
    var currentMinPrice: Double = 0.0
    var currentMaxPrice: Double = 9999999.0 // Large default value for max price

    // Dynamic max price
    private val _dynamicMaxPrice = MutableLiveData<Double>()
    val dynamicMaxPrice: LiveData<Double> get() = _dynamicMaxPrice


    init {
        fetchCategories()
        fetchProducts(selectedCategoryId, currentMinPrice, currentMaxPrice)
    }

    private fun fetchCategories() {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = apiService.getCategories()
                if (response.isSuccessful) {
                    val apiResponse = response.body()
                    if (apiResponse != null && apiResponse.success) {
                        val allCategoriesList = mutableListOf<Category>()
                        allCategoriesList.add(Category(0, "Todo", "https://placehold.co/70x70/E9F1F5/2F4F5E?text=Todo"))
                        allCategoriesList.addAll(apiResponse.data ?: emptyList())
                        _categories.value = allCategoriesList
                    } else {
                        _errorMessage.value = apiResponse?.mensaje ?: "Error desconocido al cargar categorías."
                    }
                } else {
                    _errorMessage.value = "Error al conectar con la API de categorías: ${response.code()}"
                }
            } catch (e: IOException) {
                _errorMessage.value = "Error de red al cargar categorías: ${e.message}"
                Log.e("CatalogViewModel", "Network error fetching categories", e)
            } catch (e: HttpException) {
                _errorMessage.value = "Error HTTP al cargar categorías: ${e.message()}"
                Log.e("CatalogViewModel", "HTTP error fetching categories", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun calculateDynamicMaxPrice() {
        val productsList = _products.value ?: emptyList()
        if (productsList.isEmpty()) {
            _dynamicMaxPrice.value = 2000.0 // Default value if no products
            return
        }
        val maxPrice = productsList.maxOfOrNull { it.precio.toString().toDoubleOrNull() ?: 0.0 } ?: 0.0
        _dynamicMaxPrice.value = (maxPrice + 0.99).toInt().toDouble()
        Log.d("CatalogViewModel", "Calculated dynamic max price: ${_dynamicMaxPrice.value}")
    }

    fun fetchProducts(
        categoryId: Int?,
        minPrice: Double,
        maxPrice: Double,
        searchQuery: String = ""
    ) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val response = if (categoryId == null || categoryId == 0) {
                    apiService.getAllProducts(minPrice.toString(), maxPrice.toString())
                } else {
                    apiService.getProductsByCategoryAndPrice(categoryId, minPrice.toString(), maxPrice.toString())
                }

                if (response.isSuccessful) {
                    val apiResponse = response.body()
                    if (apiResponse != null && apiResponse.success) {
                        val productsFromApi = apiResponse.data ?: emptyList()
                        val filteredBySearch = if (searchQuery.isNotBlank()) {
                            productsFromApi.filter {
                                it.nombre.contains(searchQuery, ignoreCase = true) ||
                                        it.descripcion.contains(searchQuery, ignoreCase = true) ||
                                        it.marca.contains(searchQuery, ignoreCase = true)
                            }
                        } else {
                            productsFromApi
                        }
                        _products.value = filteredBySearch
                        _errorMessage.value = ""

                        calculateDynamicMaxPrice()

                    } else {
                        _products.value = emptyList()
                        _errorMessage.value = apiResponse?.mensaje ?: "No se encontraron productos."
                        _dynamicMaxPrice.value = 2000.0
                    }
                } else {
                    _products.value = emptyList()
                    _errorMessage.value = "Error al conectar con la API de productos: ${response.code()}"
                    _dynamicMaxPrice.value = 2000.0
                }
            } catch (e: IOException) {
                _products.value = emptyList()
                _errorMessage.value = "Error de red al cargar productos: ${e.message}"
                Log.e("CatalogViewModel", "Network error fetching products", e)
                _dynamicMaxPrice.value = 2000.0
            } catch (e: HttpException) {
                _products.value = emptyList()
                _errorMessage.value = "Error HTTP al cargar productos: ${e.message()}"
                Log.e("CatalogViewModel", "HTTP error fetching products", e)
                _dynamicMaxPrice.value = 2000.0
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectCategory(categoryId: Int) {
        selectedCategoryId = categoryId
        currentMinPrice = 0.0
        currentMaxPrice = 9999999.0
        fetchProducts(selectedCategoryId, currentMinPrice, currentMaxPrice)
    }

    fun setPriceRange(min: Double, max: Double) {
        currentMinPrice = min
        currentMaxPrice = max
        fetchProducts(selectedCategoryId, currentMinPrice, currentMaxPrice)
    }

    fun setSearchQuery(query: String) {
        if (query.isBlank()) {
            fetchProducts(selectedCategoryId, currentMinPrice, currentMaxPrice)
        } else {
            val currentProductsValue = _products.value ?: emptyList()
            val filteredBySearch = currentProductsValue.filter {
                it.nombre.contains(query, ignoreCase = true) ||
                        it.descripcion.contains(query, ignoreCase = true) ||
                        it.marca.contains(query, ignoreCase = true)
            }
            _products.value = filteredBySearch
        }
    }

    fun clearFilters() {
        selectedCategoryId = 0
        currentMinPrice = 0.0
        currentMaxPrice = 9999999.0
        fetchProducts(selectedCategoryId, currentMinPrice, currentMaxPrice)
    }
}
