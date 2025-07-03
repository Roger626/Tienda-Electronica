<?php
    namespace App\models;

    use Exception;
    use mysqli;

    class Categoria{
        private mysqli $conn;
        public function __construct(mysqli $conn){
            $this->conn = $conn;
        }

        public function all():array{
            try{
                $query = "SELECT * FROM categorias";
                $result = $this->conn->query($query);
                $data = [];
                if($result->num_rows > 0){
                    while($row = $result->fetch_assoc()){
                        $data[] = $row;
                    }
                    return [
                        "success" => true,
                        "mensaje" => "Categorias obtenidas correctamente",
                        "data" => $data
                    ];
                }
                return [
                    "success" => false,
                    "mensaje" => "No hay categorias disponibles",
                    "data" => $data
                ];
            }catch(Exception $e){
                error_log("Categoria::all() Error: " . $e->getMessage());
                throw new Exception("Error al obtener las categorias", $e->getCode() ?: 500);
            }
        }

        
        public function findById(int $id):array{
            try{
                $query = "SELECT * FROM categorias WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param("i", $id);
                if(!$stmt->execute()) throw new Exception("Error al ejecutar la consulta: " . $stmt->error, 500);
                $result = $stmt->get_result();
                if($result->num_rows > 0){
                    return [
                        "success" => true,
                        "mensaje" => "Categoria encontrada",
                        "data" => $result->fetch_assoc()
                    ];
                }
                return [
                    "success" => false,
                    "mensaje" => "Categoria no encontrada",
                    "data" => null
                ];
            }catch(Exception $e){
                error_log("Categoria::findById() Error: " . $e->getMessage());
                throw new Exception("Error al buscar la categoria", $e->getCode() ?: 500);
            }
        }

        public function create(array $data):array{
            try{
                $query = "CALL crear_categoria(?,?,?)";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param(
                    "ssi",
                    $data["nombre"],
                    $data["imagen_url"],
                    $data["creado_por_id"]
                );
                if(!$stmt->execute()) throw new Exception("Error al crear la categoria: " . $stmt->error, 500);
                return [
                    "success" => true,
                    "mensaje" => "Categoria creada exitosamente"
                ];
            }catch(Exception $e){
                error_log("Categoria::create() Error: " . $e->getMessage());
                throw new Exception("Error al crear la categoria", $e->getCode() ?: 500);
            }
        }


        public function update(int $id, array $data): array {
        try{
            $existingCategory = $this->findById($id);
            if (!$existingCategory['success']) {
                throw new Exception("Categoría con ID " . $id . " no encontrada para actualizar.", 404);
            }
            if (!isset($data['nombre']) || !isset($data['imagen_url']) || !isset($data['actualizado_por_id'])) {
                throw new Exception("Faltan datos obligatorios para actualizar la categoría (nombre, imagen_url, actualizado_por_id).", 400);
            }

            $query = "CALL actualizar_categoria(?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                throw new Exception("Error al preparar la consulta de actualización de categoría: " . $this->conn->error, 500);
            }
            $stmt->bind_param(
                "issi", 
                $id,
                $data["nombre"],
                $data["imagen_url"],
                $data["actualizado_por_id"]
            );

            if (!$stmt->execute()) {
                error_log("Categoria::update() Error: " . $stmt->error);
                if (strpos($stmt->error, 'Solo un administrador puede modificar categorías') !== false) {
                    throw new Exception("Permiso denegado: Solo un administrador puede modificar categorías.", 403);
                }
                if ($stmt->errno == 1062) { 
                    throw new Exception("Ya existe una categoría con ese nombre.", 409);
                }
                throw new Exception("Error al ejecutar la actualización de categoría: " . $stmt->error, 500);
            }
            $stmt->close();
            return ["success" => true, "mensaje" => "Categoría actualizada exitosamente."];
            }catch (Exception $e) {
                error_log("Categoria::update() Error: " . $e->getMessage());
                throw new Exception("Error al actualizar la categoría: " . $e->getMessage(), $e->getCode() ?: 500);
            }
        }
        
    

        public function delete(int $id, int $userId):array{
            try{
                $stmtSetUser = $this->conn->prepare("SET @usuario_actual_id = ?");
                if (!$stmtSetUser) {
                    throw new Exception("Error al preparar SET @usuario_actual_id: " . $this->conn->error, 500);
                }
                $stmtSetUser->bind_param("i", $userId);
                $stmtSetUser->execute();
                $stmtSetUser->close();

                $query = "DELETE FROM categorias WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param("i", $id);
                if(!$stmt->execute()) throw new Exception("Error al eliminar la categoria: " . $stmt->error, 500);
                return [
                    "success" => true,
                    "mensaje" => "Categoria eliminada exitosamente"
                ];
            }catch(Exception $e){
                error_log("Categoria::delete() Error: " . $e->getMessage());
                throw new Exception("Error al eliminar la categoria", $e->getCode() ?: 500);
            }
        }
    }
    
?>