<?php
    namespace App\models;
    use Exception;
    use mysqli;

    class Producto {
        private mysqli $conn;
        public function __construct(mysqli $conn){
            $this->conn = $conn;
        }

        /**
     * Obtiene todos los productos, con filtrado opcional por rango de precio.
     * Es el método principal para obtener listas de productos.
     * @param float|null $minPrice Precio mínimo para filtrar.
     * @param float|null $maxPrice Precio máximo para filtrar.
     * @return array Un array con 'success', 'mensaje' y 'data' (lista de productos).
     * @throws Exception Si hay un error en la base de datos.
     */
    public function getAll(?float $minPrice = null, ?float $maxPrice = null): array {
        try{
            $query = "SELECT * FROM productos WHERE estado = 1"; 
            $params = [];
            $types = "";

            if ($minPrice !== null) {
                $query .= " AND precio >= ?";
                $params[] = $minPrice;
                $types .= "d"; // 'd' para double/float
            }
            if ($maxPrice !== null) {
                $query .= " AND precio <= ?";
                $params[] = $maxPrice;
                $types .= "d"; // 'd' para double/float
            }

            $query .= " ORDER BY id DESC"; 

            $stmt = $this->conn->prepare($query);

            if (!$stmt) {
                throw new Exception("Error al preparar la consulta getAll: " . $this->conn->error, 500);
            }

            if (!empty($params)) {
                $bindArgs = [$types];
                foreach ($params as $key => $value) {
                    $bindArgs[] = &$params[$key]; // Pasar por referencia
                }
                call_user_func_array([$stmt, 'bind_param'], $bindArgs);
            }

            if (!$stmt->execute()) {
                throw new Exception("Error al ejecutar la consulta getAll: " . $stmt->error, 500);
            }

            $result = $stmt->get_result();
            $productos = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            
            if (!empty($productos)) {
                return ["success" => true, "mensaje" => "Productos obtenidos exitosamente.", "data" => $productos];
            } else {
                return ["success" => true, "mensaje" => "No se encontraron productos con los filtros de precio especificados.", "data" => []];
            }
        }catch(Exception $e){
            error_log("Producto::getAll() Error: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
            throw new Exception("Error al obtener los productos", $e->getCode() ?: 500);
        }
        
    }
        /**
         * Busca un producto por su ID
         * @param int $id ID del producto a buscar
         * @return array Resultado de la búsqueda
         */
        public function findById(int $id):array{
            try{
                $query = "SELECT * FROM productos WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt){
                    throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                }
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                if($result->num_rows > 0){
                    return [
                        "success"=> true,
                        "mensaje" => "Producto encontrado",
                        "data" => $result->fetch_assoc()
                    ];
                }else{
                    return [
                        "success"=> false,
                        "mensaje" => "Producto no encontrado",
                        "data" => null
                    ];
                }
            }catch(Exception $e){
                error_log("Producto::findById() Error: " . $e->getMessage());
                throw new Exception("Error al obtener el producto", $e->getCode() ?: 500);
            }
        }
        /**
         * Filtra productos por categoria y rango de precio
         * @param int $categoriaId ID de la categoria
         * @param float $minPrecio Precio minimo
         * @param float $maxPrecio Precio maximo
         * @return array Lista de productos filtrados
         */
        public function filterByCategoryPrice(int $categoriaId, float $minPrecio=0, float $maxPrecio=PHP_INT_MAX):array{
            try{
                $query = "SELECT * FROM productos WHERE categoria_id = ? AND precio BETWEEN ? AND ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param(
                    "iii",
                    $categoriaId,
                    $minPrecio,
                    $maxPrecio
                );
                $stmt->execute();
                $result = $stmt->get_result();
                $productos = [];
                if($result->num_rows > 0){
                    while($row = $result->fetch_assoc()){
                        $productos[] = $row;
                    }
                    return [
                        "success" => true,
                        "mensaje" => "Productos filtrados correctamente",
                        "data" => $productos
                    ];
                }
                return [
                    "success" => false,
                    "mensaje" => "No se encontraron productos en esta categoria con el rango de precio especificado",
                    "data" => []
                ];
            }catch(Exception $e){
                error_log("Producto::filterByCategoryPrice() Error: " . $e->getMessage());
                throw new Exception("Error al filtrar los productos", $e->getCode() ?: 500);
            }
        }

    /**
     * Obtiene todos los productos sin filtrar por categoría, pero dentro de un rango de precios.
     * @param float $minPrice Precio mínimo.
     * @param float $maxPrice Precio máximo.
     * @return array Un array con 'success', 'mensaje' y 'data' (lista de productos).
     * @throws Exception Si hay un error en la base de datos.
     */
    public function getAllProductsByPriceRange(float $minPrice=null, float $maxPrice=null): array {
        $query = "";
        if ($minPrice === null && $maxPrice === null) {
            $query = "SELECT * FROM productos WHERE estado = 1";
        } else {
            $query = "SELECT * FROM productos WHERE precio >= ? AND precio <= ? AND estado = 1";
        }
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            throw new Exception("Error al preparar la consulta getAllProductsByPriceRange: " . $this->conn->error);
        }

        if ($minPrice !== null && $maxPrice !== null) {
            $stmt->bind_param("dd", $minPrice, $maxPrice);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $productos = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
        }
        $stmt->close();
        
        if (!empty($productos)) {
            return ["success" => true, "mensaje" => "Productos obtenidos exitosamente.", "data" => $productos];
        } else {
            return ["success" => true, "mensaje" => "No se encontraron productos con los filtros de precio especificados.", "data" => []];
        }
    }

        /**
         * Crea un nuevo producto.
         * @param array $data Datos del producto a crear.
         * @return array Resultado de la creación.
         */
        public function create(array $data): array {
            try {
                $query = "INSERT INTO productos (nombre, descripcion, marca, precio, imagen_url, stock, estado, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $this->conn->prepare($query);
                
                if (!$stmt) {
                    throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                }
                
                $stmt->bind_param(
                    "sssdsiii",
                    $data['nombre'],
                    $data['descripcion'],
                    $data['marca'],
                    $data['precio'],
                    $data['imagen_url'],
                    $data['stock'],
                    $data['estado'],
                    $data['categoria_id']
                );
                
                if ($stmt->execute()) {
                    return [
                        "success" => true,
                        "mensaje" => "Producto creado correctamente"
                    ];
                } else {
                    throw new Exception("Error al crear el producto: " . $stmt->error, 500);
                }
            } catch (Exception $e) {
                error_log("Producto::create() Error: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
                throw new Exception("Error al crear el producto", $e->getCode() ?: 500);
            }
        }

        /**
         * Actualiza un producto por su ID
         * @param int $id ID del producto a actualizar
         * @param array $data Datos del producto a actualizar
         * @return array Resultado de la actualización
         */
        public function update(int $id, array $data):array {
            try{
                $query = "UPDATE productos SET nombre = ?, descripcion = ?, marca = ?, precio = ?, imagen_url = ?, stock = ?, estado = ?, categoria_id = ? WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param(
                    "sssdsiiii",
                    $data['nombre'],
                    $data['descripcion'],
                    $data['marca'],
                    $data['precio'],
                    $data['imagen_url'],
                    $data['stock'],
                    $data['estado'],
                    $data['categoria_id'],
                    $id
                );
                if($stmt->execute()){
                    return [
                        "success" => true,
                        "mensaje" => "Producto actualizado correctamente"
                    ];
                }
                return [
                    "success" => false,
                    "mensaje" => "Identificador de producto no encontrado."
                ];
            }catch(Exception $e){
                error_log("Producto::update() Error: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
                throw new Exception("Error al actualizar el producto", $e->getCode() ?: 500);
            }
        }

        /**
         * Elimina un producto por su ID
         * @param int $id ID del producto a eliminar
         * @return array Resultado de la eliminación
         */
        public function delete(int $id, int $userId):array{
            try{

                $stmtSetUser = $this->conn->prepare("SET @usuario_actual_id = ?");
                if (!$stmtSetUser) {
                    throw new Exception("Error al preparar SET @usuario_actual_id: " . $this->conn->error, 500);
                }
                $stmtSetUser->bind_param("i", $userId);
                $stmtSetUser->execute();
                $stmtSetUser->close();

                $query = "DELETE FROM productos WHERE id = ?";
                $stmt = $this->conn->prepare($query);
                if(!$stmt) throw new Exception("Error al preparar la consulta: " . $this->conn->error, 500);
                $stmt->bind_param("i", $id);
                if($stmt->execute()){
                    return [
                        "success" => true,
                        "mensaje" => "Producto eliminado correctamente"
                    ];
                }else{
                    throw new Exception("Error al eliminar el producto: " . $stmt->error, 500);

                }
            }catch(Exception $e){
                error_log("Producto::delete() Error: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
                throw new Exception("Error al eliminar el producto", $e->getCode() ?: 500);
            }
        }

    }
?>