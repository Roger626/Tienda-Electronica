plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt") // Para procesadores de anotaciones como Dagger Hilt o Room, o Retrofit
}

android {
    namespace = "com.example.mitienda" // Reemplaza con el namespace de tu proyecto
    compileSdk = 34 // Asegúrate de tener la versión 34 del SDK instalada

    defaultConfig {
        applicationId = "com.example.mitienda" // Reemplaza con el ID de tu aplicación
        minSdk = 26 // SDK mínimo soportado
        targetSdk = 34 // SDK objetivo
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    // Habilitar View Binding para facilitar el acceso a las vistas
    buildFeatures {
        viewBinding = true
    }
}

dependencies {

    // Dependencias por defecto
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // KTX para ViewModels y LiveData
    implementation ("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation ("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.activity:activity-ktx:1.8.2") // Para registerForActivityResult, etc.

    // Retrofit para comunicación de red con tu API PHP
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    // Convertidor de JSON a objetos Kotlin (Gson)
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    // Cliente HTTP (OkHttp) - Opcional para logging, intercepción
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0") // Para logs de red

    // Coil para carga de imágenes asíncrona
    implementation("io.coil-kt:coil:2.6.0")

    // Para un RecyclerView
    implementation("androidx.recyclerview:recyclerview:1.3.2")

    // Para pruebas
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}