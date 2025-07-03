<?php
    namespace App\controllers;
    use Exception;
    use mysqli;
    use App\models\Categoria;

    class CategoriaController{
        private Categoria $categoriaModel;
        public function __construct(mysqli $conn){
            $this->categoriaModel = new Categoria($conn);
        }

        public function index(){
            try{
                $result = $this->categoriaModel->all();
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                    "data" => $result["data"]
                ]);
            }catch(Exception $e){
                $http_code = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_code, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
        public function showById(int $id){
            try{
                $result = $this->categoriaModel->findById($id);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                    "data" => $result["data"]
                ]);
            }catch(Exception $e){
                $http_code = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_code, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }

        public function store(array $data){
            $id_user = verifyAuthAndRole("admin");
            $data["creado_por_id"] = $id_user;
            try{
                $result = $this->categoriaModel->create($data);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"]
                ]);
            }catch(Exception $e){
                $http_code = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_code, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
        public function update(int $id, array $data){
            $id_user = verifyAuthAndRole("admin");
            $data["actualizado_por_id"] = $id_user;
            try{
                $result = $this->categoriaModel->update($id, $data);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"]
                ]);
            }catch(Exception $e){
                $http_code = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_code, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }

        public function destroy(int $id){
            $id_user = verifyAuthAndRole("admin");
            try{
                $result = $this->categoriaModel->delete($id, $id_user["id"]);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"]
                ]);
            }catch(Exception $e){
                $http_code = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_code, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
    }
    
?>