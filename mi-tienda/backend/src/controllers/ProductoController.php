<?php
    namespace App\controllers;

    
    use Exception;
    use mysqli;
    use App\models\Producto;

    class ProductoController {
        private Producto $productoModel;

        public function __construct(mysqli $conn){
            $this->productoModel = new Producto($conn);
        }

        /**
         * Muestra todos los productos
         * @return void
         */
        public function index():void{
            try{
            $minPrice = $_GET['min'] ?? null;
            $maxPrice = $_GET['max'] ?? null;

            $minPrice = $minPrice !== null ? (float)$minPrice : null;
            $maxPrice = $maxPrice !== null ? (float)$maxPrice : null;
            $result = $this->productoModel->getAll($minPrice, $maxPrice);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                    "data" => $result["data"]
                ]);
                // for($i=0; $i < count($result["data"]);$i++){
                //     foreach($result["data"][$i] as $key => $value){
                //         echo $key . ": " . $value . "\n";
                //     }
                //     echo "------------------------\n";
                // }

            }catch(Exception $e){
                $http_status = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_status, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
        /**
         * Muestra un producto por su ID
         * @param int $id ID del producto a mostrar
         * @return void
         */
        public function show(int $id):void{
            try{
                $producto = $this->productoModel->findById($id);
                if($producto["success"]){
                    response(200, [
                        "success" => true,
                        "mensaje" => $producto["mensaje"],
                        "data" => $producto["data"]
                    ]);
                }else{
                    response(404, [
                        "success" => false,
                        "mensaje" => $producto["mensaje"],
                        "data" => null
                    ]);
                }
            }catch(Exception $e){
                $http_status = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_status, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
        /**
         * Muestra productos por categoría y rango de precios
         * @param int $categoriaId ID de la categoría
         * @param float $minPrecio Precio mínimo (opcional, por defecto 0)
         * @param float $maxPrecio Precio máximo (opcional, por defecto PHP_INT_MAX)
         * @return void
         */
        public function showByCategoriaPrice(int $categoriaId):void{
            // Leer los parámetros del query string
            $minPrecio = isset($_GET['min']) ? (float) $_GET['min'] : 0;
            $maxPrecio = isset($_GET['max']) ? (float) $_GET['max'] : PHP_INT_MAX;
            try{
                $result = $this->productoModel->filterByCategoryPrice($categoriaId, $minPrecio, $maxPrecio);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                    "data" => $result["data"]
                ]);
            }catch(Exception $e){
                $http_status = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_status, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }

        
        public function getAllProductsForAndroidCatalog(): void {
            $minPrice = isset($_GET['min']) ? (float)$_GET['min'] : 0.0;
            $maxPrice = isset($_GET['max']) ? (float)$_GET['max'] : 999999999.0; 

            try {
                $productosResult = $this->productoModel->getAllProductsByPriceRange($minPrice, $maxPrice);
                
                response(200, [
                    "success" => $productosResult["success"],
                    "mensaje" => $productosResult["mensaje"],
                    "data" => $productosResult["data"]
                ]);
            } catch (Exception $e) {
                error_log("ProductoController::getAllProductsForAndroidCatalog() Error: " . $e->getMessage() . " en " . $e->getFile() . " linea " . $e->getLine());
                response(500, [
                    "success" => false,
                    "mensaje" => "Error al obtener productos para el catálogo Android: " . $e->getMessage(),
                    "data" => null
                ]);
            }
        }

            /**
             * Crea un nuevo producto
             * @param array $data Datos del producto a crear
             * @return void
             */
            public function store(array $data):void{
                verifyAuthAndRole("admin");
                try{
                    $result = $this->productoModel->create($data);
                    response(201, [
                        "success" => $result["success"],
                        "mensaje" => $result["mensaje"],
                    ]);
                }catch(Exception $e){
                    $http_status = $e->getCode() ?: 500;
                    $error_message = $e->getMessage();
                    response($http_status, [
                        "success" => false,
                        "mensaje" => $error_message,
                        "data" => null
                    ]);
                }
            }

        /**
         * Actualiza un producto existente
         * @param int $id ID del producto a actualizar
         * @param array $data Datos actualizados del producto
         * @return void
         */
        public function update(int $id, array $data):void{

            $id_user = verifyAuthAndRole("admin");
            $data["actualizado_por_id"] = $id_user["id"];
            try{
                $result = $this->productoModel->update($id, $data);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                ]);
            }catch(Exception $e){
                $http_status = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_status, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }

        /**
         * Elimina un producto por su ID
         * @param int $id ID del producto a eliminar
         * @return void
         */
        public function destroy(int $id):void{
            $id_user = verifyAuthAndRole("admin");
            try{
                $result = $this->productoModel->delete($id, $id_user["id"]);
                response(200, [
                    "success" => $result["success"],
                    "mensaje" => $result["mensaje"],
                ]);
            }catch(Exception $e){
                $http_status = $e->getCode() ?: 500;
                $error_message = $e->getMessage();
                response($http_status, [
                    "success" => false,
                    "mensaje" => $error_message,
                    "data" => null
                ]);
            }
        }
    }

   
?>