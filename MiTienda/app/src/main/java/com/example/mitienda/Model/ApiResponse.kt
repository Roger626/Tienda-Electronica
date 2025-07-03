// mi-tienda-android/app/src/main/java/com/example/mitienda/model/ApiResponse.kt

package com.example.mitienda.model

import com.google.gson.annotations.SerializedName

/**
 * Clase de datos genérica para encapsular la respuesta común de la API.
 * Asume que la API devuelve un objeto JSON con:
 * - `success`: un booleano indicando si la operación fue exitosa.
 * - `data`: el payload de datos real (puede ser una lista de objetos, un solo objeto, etc.).
 * - `mensaje`: un mensaje de estado o error (opcional).
 *
 * @param T El tipo de datos que se espera en el campo `data`.
 */
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: T?, // 'T?' indica que los datos pueden ser nulos si success es false o no hay datos
    @SerializedName("mensaje") val mensaje: String? // 'String?' indica que el mensaje puede ser nulo
)

// Las clases Product y Category DEBEN estar definidas en sus propios archivos:
// Product.kt
// Category.kt
// dentro del mismo paquete 'com.example.mitienda.model'.
