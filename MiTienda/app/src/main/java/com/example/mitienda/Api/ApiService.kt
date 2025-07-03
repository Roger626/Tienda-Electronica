// mi-tienda-android/app/src/main/java/com/example/mitienda/api/ApiService.kt

package com.example.mitienda.api

import com.example.mitienda.model.ApiResponse
import com.example.mitienda.model.Category
import com.example.mitienda.model.Product
import retrofit2.Response // Importa la clase Response de Retrofit
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    @GET("categorias")
    // El tipo de retorno ahora es Response<ApiResponse<List<Category>>>
    suspend fun getCategories(): Response<ApiResponse<List<Category>>>

    @GET("productos")
    // Se añade `min` y `max` como parámetros de consulta opcionales para la ruta general de productos
    suspend fun getAllProducts(
        @Query("min") minPrice: String? = null,
        @Query("max") maxPrice: String? = null
    ): Response<ApiResponse<List<Product>>>

    @GET("productos/filtro/{categoria_id}")
    // Se asume que el endpoint para filtrar por categoría y precio sigue esta estructura
    suspend fun getProductsByCategoryAndPrice(
        @Path("categoria_id") categoryId: Int,
        @Query("min") minPrice: String? = null,
        @Query("max") maxPrice: String? = null
    ): Response<ApiResponse<List<Product>>>

    // ---------------------------------------------------------------------------------
    // Companion object para la inicialización de Retrofit (Soluciona "create" no resuelto)
    companion object {
        // CAMBIO CLAVE AQUÍ: Usar 10.0.2.2 para acceder a localhost desde el emulador de Android
        private const val BASE_URL = "http://10.0.2.2/mi-tienda/backend/public/api.php/" // ¡AJUSTA ESTA URL SI TU SERVIDOR ES DIFERENTE!

        fun create(): ApiService {
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            return retrofit.create(ApiService::class.java)
        }
    }
}
