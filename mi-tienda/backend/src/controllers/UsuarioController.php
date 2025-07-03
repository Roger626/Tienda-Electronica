<?php
    namespace App\controllers;
    use Exception;
    use mysqli;
    use App\models\Usuario;

    class UsuarioController{
        private Usuario $usuarioModel;

        public function __construct(mysqli $conn){
            $this->usuarioModel = new Usuario($conn);
        }

        public function create(array $data){
            try {
                $result = $this->usuarioModel->create($data);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"]
                ]);
            }catch(Exception $e){
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