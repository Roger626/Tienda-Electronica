// mi-tienda-android/app/src/main/java/com/example/mitienda/model/Category.kt

package com.example.mitienda.model

import com.google.gson.annotations.SerializedName

/**
 * Clase de datos que representa una categoría.
 */
data class Category(
    val id: Int,
    val nombre: String,
    @SerializedName("imagen_url")
    val imageUrl: String? // Puede ser nula si no todas las categorías tienen imagen
)
