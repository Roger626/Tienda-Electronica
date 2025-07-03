-- ==========================
-- CREACIÓN DE BASE DE DATOS
-- ==========================
CREATE DATABASE IF NOT EXISTS tienda_catalogo;
USE tienda_catalogo;

-- ==========================
-- TABLA: USUARIOS
-- ==========================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'consulta') NOT NULL DEFAULT 'consulta',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- BACKUP: USUARIOS
-- ==========================
CREATE TABLE IF NOT EXISTS backup_usuarios (
    id INT,
    username VARCHAR(50),
    password_hash VARCHAR(255),
    rol ENUM('admin', 'consulta'),
    creado_en TIMESTAMP,
    eliminado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eliminado_por INT
);

-- ==========================
-- TABLA: CATEGORÍAS
-- ==========================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    imagen_url TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- BACKUP: CATEGORÍAS
-- ==========================
CREATE TABLE IF NOT EXISTS backup_categorias (
    id INT,
    nombre VARCHAR(100),
    imagen_url TEXT,
    creado_en TIMESTAMP,
    eliminado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eliminado_por INT
);

-- ==========================
-- TABLA: PRODUCTOS
-- ==========================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(50),
    precio DECIMAL(10,2) NOT NULL,
    imagen_url TEXT,
    stock INT NOT NULL DEFAULT 0,
    estado INT,
    categoria_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);
ALTER TABLE productos
ADD CONSTRAINT estado_check CHECK(estado IN(1,0));

-- ==========================
-- BACKUP: PRODUCTOS (CORREGIDA)
-- ==========================
CREATE TABLE IF NOT EXISTS backup_productos (
    id INT,
    nombre VARCHAR(100),
    descripcion TEXT,
    marca VARCHAR(50),
    precio DECIMAL(10,2),
    imagen_url TEXT,
    stock INT,
    estado INT,
    categoria_id INT,
    creado_en TIMESTAMP,
    eliminado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eliminado_por INT
);

-- ==========================
-- VARIABLES DE SESIÓN
-- ==========================
-- SET @usuario_actual_id = ID_DEL_USUARIO_LOGUEADO;

-- ==========================
-- TRIGGERS DE BACKUP
-- ==========================
DELIMITER //

CREATE TRIGGER before_delete_usuario
BEFORE DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO backup_usuarios
    VALUES (OLD.id, OLD.username, OLD.password_hash, OLD.rol, OLD.creado_en, NOW(), @usuario_actual_id);
END;
//

CREATE TRIGGER before_delete_categoria
BEFORE DELETE ON categorias
FOR EACH ROW
BEGIN
    INSERT INTO backup_categorias
    VALUES (OLD.id, OLD.nombre, OLD.imagen_url, OLD.creado_en, NOW(), @usuario_actual_id);
END;
//

CREATE TRIGGER before_delete_producto
BEFORE DELETE ON productos
FOR EACH ROW
BEGIN
    INSERT INTO backup_productos
    VALUES (
        OLD.id, OLD.nombre, OLD.descripcion, OLD.marca, OLD.precio, OLD.imagen_url, OLD.stock,
        OLD.estado, OLD.categoria_id, OLD.creado_en, NOW(), @usuario_actual_id
    );
END;
//

DELIMITER ;

-- ==========================
-- PROCEDIMIENTOS ALMACENADOS
-- ==========================
DELIMITER $$

CREATE PROCEDURE crear_usuario (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_rol ENUM('admin', 'consulta'),
    IN p_creado_por_id INT
)
BEGIN
    DECLARE creador_rol ENUM('admin', 'consulta');

    IF p_creado_por_id IS NULL THEN
        IF p_rol IS NOT NULL AND p_rol <> 'consulta' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo se permite crear usuarios con rol consulta mediante autoregistro.';
        ELSE
            INSERT INTO usuarios (username, password_hash, rol)
            VALUES (p_username, p_password_hash, COALESCE(p_rol, 'consulta'));
        END IF;

    ELSE
        SELECT rol INTO creador_rol FROM usuarios WHERE id = p_creado_por_id;

        IF creador_rol IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario creador no existe.';
        END IF;

        IF p_rol = 'admin' AND creador_rol <> 'admin' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo un administrador puede crear otro administrador';
        ELSE
            INSERT INTO usuarios (username, password_hash, rol)
            VALUES (p_username, p_password_hash, p_rol);
        END IF;
    END IF;
END $$

DELIMITER ;


CREATE PROCEDURE eliminar_usuario (
    IN p_id INT,
    IN p_eliminado_por_id INT
)
BEGIN
    DECLARE eliminador_rol ENUM('admin', 'consulta');
    SELECT rol INTO eliminador_rol FROM usuarios WHERE id = p_eliminado_por_id;

    IF eliminador_rol <> 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo un administrador puede eliminar usuarios';
    ELSE
        DELETE FROM usuarios WHERE id = p_id;
    END IF;
END;
//

CREATE PROCEDURE crear_categoria (
    IN p_nombre VARCHAR(100),
    IN p_imagen_url TEXT,
    IN p_creado_por_id INT
)
BEGIN
    DECLARE creador_rol ENUM('admin', 'consulta');
    SELECT rol INTO creador_rol FROM usuarios WHERE id = p_creado_por_id;

    IF creador_rol <> 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo un administrador puede crear categorías';
    ELSE
        INSERT INTO categorias (nombre, imagen_url)
        VALUES (p_nombre, p_imagen_url);
    END IF;
END;
//

CREATE PROCEDURE actualizar_categoria (
    IN p_id INT,
    IN p_nombre VARCHAR(100),
    IN p_imagen_url TEXT,
    IN p_modificado_por_id INT
)
BEGIN
    DECLARE rol_usuario ENUM('admin', 'consulta');
    SELECT rol INTO rol_usuario FROM usuarios WHERE id = p_modificado_por_id;

    IF rol_usuario <> 'admin' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Solo un administrador puede modificar categorías';
    ELSE
        UPDATE categorias
        SET nombre = p_nombre,
            imagen_url = p_imagen_url
        WHERE id = p_id;
    END IF;
END;
//

DELIMITER ;

-- ==========================
-- USUARIOS
-- ==========================
INSERT INTO usuarios (username, password_hash, rol)
VALUES 
('admin', SHA2('admin123', 256), 'admin'),
('consulta', SHA2('consulta123', 256), 'consulta');
('Roger26', SHA2('1234567',256), 'admin'),
('cliente',SHA2('1234567',256), 'consulta');

-- ==========================
-- CATEGORÍAS
-- ==========================

-- CATEGORÍAS 
INSERT INTO categorias (nombre, imagen_url)
VALUES
('Smartphones', 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750784435/mi-tienda-admin/ot80txuhjfiumpy3ww3f.jpg'),
('Laptops', 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750784901/mi-tienda-admin/edvlphqctbpssglb5bck.jpg'),
('Accesorios', 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750785794/mi-tienda-admin/ml7zyjqklivkfi3dvh87.jpg'),
('Tablets', 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750785834/mi-tienda-admin/tbbkwdw7hu39padrsz45.jpg'),
('Smartwatches', 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750785859/mi-tienda-admin/l8xrypmkmlexwmjzi3jy.jpg');

-- PRODUCTOS
INSERT INTO productos (nombre, descripcion, marca, precio, imagen_url, stock, estado, categoria_id)
VALUES 
('iPhone 14', 'Smartphone Apple 128GB', 'Apple', 999.99, 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750786713/mi-tienda-admin/oordye1aaflfjrn8rfww.jpg', 20, 1, 1),
('Galaxy Watch 5', 'Smartwatch Samsung', 'Samsung', 249.99, 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750786809/mi-tienda-admin/c1jxbnfhxuatg381krfa.jpg', 15, 1, 5),
('MacBook Pro M1', 'Portátil Apple 13\"', 'Apple', 1999.00, 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750786734/mi-tienda-admin/fwqtfcmvd4n5eduyqxji.jpg', 10, 1, 2),
('Xiaomi Pad 6', 'Tablet Android potente', 'Xiaomi', 349.99, 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750786777/mi-tienda-admin/nuhxfjqwbyqh3d24or6k.jpg', 25, 1, 4),
('Audífonos JBL', 'Accesorio de audio inalámbrico', 'JBL', 59.99, 'https://res.cloudinary.com/dwzo5mg1r/image/upload/v1750786753/mi-tienda-admin/cukr0jsfx2oxu8selp25.jpg', 50, 1, 3);


