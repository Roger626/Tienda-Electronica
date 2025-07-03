<?php
    namespace App\config;

    use mysqli;
    use Exception;
    use Dotenv\Dotenv;

    class DB{
        private static $instance = null;
        private $conn;


        private function __construct(){
            $dotenv = Dotenv::createImmutable(__DIR__ . '/../../../');
            $dotenv->load();

            $host = $_ENV['DB_HOST'] ?? "localhost";
            $user = $_ENV['DB_USER'] ?? "root";
            $password = $_ENV['DB_PASS'] ?? "";
            $database = $_ENV['DB_NAME'] ?? "tienda_catalogo";
            $port = $_ENV['DB_PORT'] ?? 3307;

            mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
            try{
                $this->conn = new mysqli($host, $user, $password, $database, $port);
                $this->conn->set_charset("utf8mb4");
            }catch(Exception $e){
                error_log("Error de conexión a la base de datos: " . $e->getMessage());
                throw new Exception("No se pudo conectar a la base de datos", 500);
            }
        }

        public static function connect(){
            if(self::$instance === null){
                self::$instance = new DB();
            }//solo permite una instancia de la clase Database
            //si la instancia ya existe, retorna la conexión
            return self::$instance->conn;
        }

        public static function close(){
            if(self::$instance !== null && self::$instance->conn instanceof mysqli){
                self::$instance->conn->close();
                self::$instance = null;
            }
        }
        
    }
?>