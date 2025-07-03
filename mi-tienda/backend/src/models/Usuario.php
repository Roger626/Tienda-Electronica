<?php
    namespace App\models;
    use Exception;
    use mysqli;

    class Usuario {
        private mysqli $conn;

        public function __construct(mysqli $conn){
            $this->conn = $conn;
        }


        /**
         * Crea un nuevo usuario en la base de datos
         * @param array $data Datos del usuario a crear
         * @return array Resultado de la creación
         */
        public function create(array $data):array{
            try{
                $query = "CALL crear_usuario(?,?,?,?)";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception ("Error al preparar la consulta: " . $this->conn->error, 500);

                if(
                    !isset($data["username"]) ||
                    !isset($data["password"]) ||
                    !isset($data["rol"])  
                ) throw new Exception("Faltan datos obligatorios", 400);
                //Si el usuario se autoregistra, lo hara como "solo consulta"
                $hashedPassword = hash("sha256", $data["password"]);
                $creado_por_id = $data["creado_por_id"] ?? null;
                $stmt->bind_param(
                    "sssi",
                    $data["username"],
                    $hashedPassword,
                    $data["rol"],
                    $creado_por_id
                );
                if(!$stmt->execute()) throw new Exception("Error al crear el usuario: " . $stmt->error, 500);
                return [
                    "success" => true,
                    "mensaje" => "Usuario creado exitosamente"
                ];
            }catch(Exception $e){
                error_log("Usuario::create() Error: " . $e->getMessage());
                throw new Exception("Error al crear el usuario", $e->getCode() ?: 500);

            }
            
        }
    }
?>