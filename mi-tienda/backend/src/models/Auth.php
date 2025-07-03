<?php
    namespace App\models;
    use Exception;
    use mysqli;

    class Auth {
        private mysqli $conn;
        public function __construct(mysqli $conn){
            $this->conn = $conn;
        }    

        public function login(array $data):array{
            try{
                $hashedPass = hash("sha256", $data["password"]);
                $query = "SELECT password_hash, id, rol FROM usuarios WHERE username = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param("s", $data["username"]);
                $stmt->execute();
                $result = $stmt->get_result();
                if($result->num_rows === 1){
                    $user = $result->fetch_assoc();

                    if($user["password_hash"] === $hashedPass){
                        return [
                            "success" => true,
                            "mensaje" => "Inicio de sesión exitoso",
                            "user" => [
                                "id" => $user["id"],
                                "username" => $data["username"],
                                "rol" => $user["rol"]
                            ]
                        ];
                    }
                    return [
                        "success" => false,
                        "mensaje" => "Contraseña incorrecta"
                    ];
                }
                return [
                    "success" => false,
                    "mensaje" => "Usuario no encontrado"
                ];
            }catch(Exception $e){
                error_log("Auth::login() Error: " . $e->getMessage());
                throw new Exception("Error al iniciar sesión", $e->getCode() ?: 500);
            }
        }
    }
?>