<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

if (!function_exists('response')) {
    function response(int $statusCode, array $data = []): void {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$conn = null;
try {
    $conn = App\config\DB::connect();
    $router = new App\Core\Router($conn);

    // Rutas para PRODUCTOS
    $router->get('/productos', [App\controllers\ProductoController::class, 'index']); // Obtener todos
    $router->get('/productos/(\d+)', [App\controllers\ProductoController::class, 'show']); // Obtener por ID
    $router->get('/productos/filtro/(\d+)', [App\controllers\ProductoController::class, 'showByCategoriaPrice']);
    $router->get('/productos/android-catalog', [App\controllers\ProductoController::class, 'getAllProductsForAndroidCatalog']); // Obtener todos los productos para el catálogo de Android
    $router->post('/productos', [App\controllers\ProductoController::class, 'store']);// Crear un nuevo producto
    $router->put('/productos/(\d+)', [App\controllers\ProductoController::class, 'update']);// Actualizar producto por ID
    $router->delete('/productos/(\d+)', [App\controllers\ProductoController::class, 'destroy']);// Eliminar producto por ID

    // Rutas para CATEGORÍAS
    $router->get('/categorias', [App\controllers\CategoriaController::class, 'index']); // Obtener todas las categorías
    $router->post('/categorias', [App\controllers\CategoriaController::class, 'store']); // Crear una nueva categoría
    $router->get('/categorias/(\d+)', [App\controllers\CategoriaController::class, 'showById']); // Obtener categoría por ID
    $router->put('/categorias/(\d+)', [App\controllers\CategoriaController::class, 'update']); // Actualizar categoría por ID
    $router->delete('/categorias/(\d+)', [App\controllers\CategoriaController::class, 'destroy']); // Eliminar categoría por ID
    // Rutas para USUARIOS
    $router->post('/usuarios', [App\controllers\UsuarioController::class, 'create']); // Crear nuevo usuario

    // Rutas para AUTENTICACIÓN
    $router->post('/auth/login', [App\controllers\AuthController::class, 'login']);


    $router->dispatch();

} catch (Exception $e) {
    error_log("Error en api.php: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
    response($e->getCode() ?: 500, [
        'success' => false,
        'message' => 'Ocurrió un error inesperado en el servidor.'
    ]);
} finally {
    if ($conn) {
        App\config\DB::close();
    }
}