<?php
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;
  

    /**
     * Verifica si la petición está autenticada con un JWT válido y si el usuario tiene el rol requerido.
     * Si falla, envía una respuesta de error y termina la ejecución.
     * @param string|null $requiredRole El rol necesario (ej. 'admin'). Null si solo se requiere autenticación sin rol específico.
     * @return array Los datos del usuario (id, username, rol) si la verificación es exitosa.
     */
    function verifyAuthAndRole(?string $requiredRole = null): array {
        $jwt_secret = $_ENV['JWT_SECRET'] ?? null; 

        if (!$jwt_secret) {
            error_log("JWT_SECRET no está configurado en las variables de entorno.");
            response(500, ['success' => false, 'message' => 'Error de configuración del servidor.']);
        }

        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            response(401, ['success' => false, 'message' => 'Token de autenticación no proporcionado o formato inválido.']);
        }

        $jwt = $matches[1];

        try {
            // Decodifica el token usando la clave secreta y el algoritmo
            $decoded = JWT::decode($jwt, new Key($jwt_secret, 'HS256'));
            $userData = [
                'id'       => $decoded->sub ?? null,
                'username' => $decoded->username ?? null,
                'rol'      => $decoded->rol ?? null 
            ];


            // Validar que los datos esenciales existan en el token
            if (empty($userData['id']) || empty($userData['username']) || empty($userData['rol'])) {
                error_log("JWT Decodificado: " . json_encode($decoded)); // Log del payload para depuración
                response(401, ['success' => false, 'message' => 'Token inválido: Datos de usuario incompletos.']);
            }

            if ($requiredRole !== null) { // Si se requiere un rol específico
                if ($userData['rol'] !== $requiredRole) {
                    response(403, ['success' => false, 'message' => 'Acceso denegado. Permisos insuficientes.']);
                }
            }
            
            return $userData; // Devuelve los datos del usuario si todo es válido

        } catch (\Firebase\JWT\ExpiredException $e) {
            response(401, ['success' => false, 'message' => 'Token expirado.']);
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            response(401, ['success' => false, 'message' => 'Firma del token inválida.']);
        } catch (Exception $e) {
            error_log("Error de verificación de JWT: " . $e->getMessage());
            response(401, ['success' => false, 'message' => 'Token inválido: ' . $e->getMessage()]);
        }
        
        exit; // Termina la ejecución si se ha enviado una respuesta de error
    }
?>
