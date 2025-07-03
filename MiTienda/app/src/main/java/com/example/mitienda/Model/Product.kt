// mi-tienda-android/app/src/main/java/com/example/mitienda/model/Product.kt

package com.example.mitienda.model

import com.google.gson.annotations.SerializedName

/**
 * Clase de datos que representa un producto.
 * Las anotaciones @SerializedName se usan para mapear los nombres de los campos del JSON de la API
 * a los nombres de las propiedades de Kotlin, si son diferentes.
 */
data class Product(
    val id: Int,
    val nombre: String,
    val descripcion: String,
    val marca: String,
    val precio: Double,
    @SerializedName("imagen_url") // Mapea 'imagen_url' de JSON a 'imageUrl' en Kotlin
    val imageUrl: String,
    val stock: Int,
    val estado: Int, // 1 para activo, 0 para inactivo
    @SerializedName("categoria_id")
    val categoryId: Int
)
