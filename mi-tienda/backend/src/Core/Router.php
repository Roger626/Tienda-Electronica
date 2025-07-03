<?php

namespace App\Core;
use mysqli;

class Router {
    private array $routes = [];
    private mysqli $conn;

    public function __construct(mysqli $conn) {
        $this->conn = $conn;
    }

    //Métodos Públicos para Registro de Rutas (GET, POST, PUT, DELETE)
    public function get(string $path, array $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, array $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, array $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, array $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    //Método Privado Auxiliar para Añadir Rutas
    private function addRoute(string $method, string $path, array $handler): void {
        $this->routes[$method][$path] = $handler;
    }

    //Método Principal para Despachar la Solicitud (dispatch)
    public function dispatch(): void {
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $requestMethod = $_SERVER['REQUEST_METHOD'];

        $baseApiSegment = '/mi-tienda/backend/public/api.php';

        // Eliminar el segmento base del API de la URI
        if (strpos($requestUri, $baseApiSegment) === 0) {
            $requestUri = substr($requestUri, strlen($baseApiSegment));
        }

        // Normalizar la URI
        if (empty($requestUri)) {
            $requestUri = '/';
        } elseif ($requestUri[0] !== '/') {
            $requestUri = '/' . $requestUri;
        }

        // Leer el cuerpo de la petición solo para métodos que lo esperan (POST, PUT, DELETE)
        $requestData = null;
        if (in_array($requestMethod, ['POST', 'PUT', 'DELETE'])) {
            $input = file_get_contents('php://input');
            if ($input) {
                $decodedInput = json_decode($input, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $requestData = $decodedInput;
                } else {
                    response(400, ["success" => false, "message" => "Cuerpo de la petición JSON inválido."]);
                    return;
                }
            }
        }

        $matched = false;
        
        if (isset($this->routes[$requestMethod])) {
            foreach ($this->routes[$requestMethod] as $routePattern => $handler) {
                // Convertir el patrón de la ruta en una expresión regular
                $regex = '#^' . str_replace('/', '\/', $routePattern) . '$#';

                if (preg_match($regex, $requestUri, $matches)) {
                    $matched = true;
                    array_shift($matches); // Eliminar el primer elemento (la cadena completa que coincide)
                    $handler_params = $matches; // Estos son los parámetros de la URL (ej. el ID)

                    $controllerClass = $handler[0];
                    $methodName = $handler[1];

                    // Instanciar el controlador, pasando la conexión a la BD
                    $controller = new $controllerClass($this->conn);

                    // Usar Reflection para obtener la información del método del controlador
                    $reflectionMethod = new \ReflectionMethod($controller, $methodName);
                    $methodParameters = $reflectionMethod->getParameters();
                    $argsToPass = [];

                    // Iterar sobre los parámetros esperados por el método del controlador
                    foreach ($methodParameters as $param) {
                        $paramName = $param->getName();
                        $paramType = $param->getType();

                        if ($paramType && $paramType->getName() === 'int' && count($handler_params) > 0) {
                            // Se asume que el primer parámetro int es el ID de la URL
                            $argsToPass[] = (int) array_shift($handler_params);
                        } elseif ($paramType && $paramType->getName() === 'array' && $requestData !== null) {
                            // Se asume que el parámetro array es para los datos del cuerpo
                            $argsToPass[] = $requestData;
                        } elseif ($param->isDefaultValueAvailable()) {
                            // Si tiene un valor por defecto, usarlo si no se proporciona
                            $argsToPass[] = $param->getDefaultValue();
                        } else {
                            // Si es un parámetro obligatorio y no se puede resolver, esto es un error
                            response(500, ["success" => false, "message" => "Error interno: Faltan argumentos para el controlador."]);
                            return;
                        }
                    }

                    // Llamar al método del controlador con los argumentos preparados
                    call_user_func_array([$controller, $methodName], $argsToPass);
                    return;
                }
            }
        }
        response(404, ['success' => false, 'message' => 'Ruta no encontrada.']);
    }
}

?>
