<?php
    namespace App\controllers;
    use Exception;
    use mysqli;
    use Firebase\JWT\JWT;
    use Firebase\JWT\Key;
    use DateTimeImmutable;
    use App\models\Auth;

    class AuthController {
        private Auth $authModel;

        public function __construct(mysqli $conn){
            $this->authModel = new Auth($conn);
        }

        
        /**
         * Maneja el inicio de sesión de un usuario.
         * 
         * @param array $data Datos del usuario (username y password).
         * @return void
         */
        public function login(array $data):void{
            $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            response(400, ["success" => false, "mensaje" => "Usuario y contraseña son obligatorios."]);
            return;
        }

        try {
            $loginResult = $this->authModel->login($data); 

            if ($loginResult['success']) {
                $user = $loginResult['user']; 

                // Generar el token JWT
                $secretKey = $_ENV['JWT_SECRET'] ?? 'your_secret_key_here';
                
                $issuedAt = new DateTimeImmutable();
                $expire = $issuedAt->modify('+1 hour')->getTimestamp();
                $serverName = $_ENV['APP_URL'] ?? 'http://localhost'; 

                $tokenPayload = [
                    'iat'  => $issuedAt->getTimestamp(),         // Tiempo de emisión
                    'exp'  => $expire,                           // Tiempo de expiración
                    'iss'  => $serverName,                       // Emisor
                    'nbf'  => $issuedAt->getTimestamp(),         // No antes de
                    'rol' => $user['rol'],                       // El rol del usuario desde el modelo
                    'sub' => $user['id'],                        // Sujeto (ID del usuario)
                    'username' => $user['username']              // Nombre de usuario en el token
                ];
                
                $jwt = JWT::encode(
                    $tokenPayload,
                    $secretKey,
                    'HS256' 
                );

               
                response(200, [
                    "success" => true,
                    "mensaje" => "Autenticación exitosa.",
                    "token" => $jwt,
                    "user_role" => $user['rol'] 
                ]);
            } else {
                response(401, ["success" => false, "mensaje" => $loginResult['mensaje']]);
            }

        } catch(Exception $e){
            $http_code = $e->getCode() ?: 500;
            $error_message = $e->getMessage();
            response($http_code, [
                "success" => false,
                "mensaje" => $error_message
                ]);
            }
        }

}
?>