// mi-tienda-android/app/src/main/java/com/example/mitienda/api/RetrofitClient.kt

package com.example.mitienda.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    // Cambia esto a la URL de tu backend PHP.
    // Para emulador de Android (localhost de la máquina): "http://10.0.2.2/mi-tienda/backend/public/api.php/"
    // Para dispositivo físico en red local: "http://TU_IP_LOCAL/mi-tienda/backend/public/api.php/"
    // ASEGÚRATE DE LA BARRA AL FINAL SI TU ROUTER LA ESPERA (o quitarla si no)
    private const val BASE_URL = "http://10.0.2.2/mi-tienda/backend/public/api.php/"

    // Interceptor para logging de peticiones HTTP (útil para depuración)
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY // Registra cabeceras y cuerpo de la petición/respuesta
    }

    // Cliente OkHttp con configuraciones como timeouts y logging
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS) // Tiempo de conexión
        .readTimeout(30, TimeUnit.SECONDS)    // Tiempo de lectura
        .writeTimeout(30, TimeUnit.SECONDS)   // Tiempo de escritura
        .build()

    // Instancia de Retrofit configurada
    val instance: ApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient) // Asigna el cliente OkHttp
            .addConverterFactory(GsonConverterFactory.create()) // Convierte JSON a objetos Kotlin
            .build()
        retrofit.create(ApiService::class.java) // Crea la implementación de ApiService
    }
}
