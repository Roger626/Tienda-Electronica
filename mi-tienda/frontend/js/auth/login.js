// mi-tienda/frontend/js/auth/login.js

// Importar funciones de utilidad de validación
import { 
    showMessage, 
    hideMessage, 
    hideFieldError, 
    showFieldError, 
    validateRequired 
} from './validaciones.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessageArea = document.getElementById('loginMessageArea');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');

    // --- Configuración de la API ---
    const API_BASE_URL = 'http://localhost/mi-tienda/backend/public/api.php';

    // --- Función para decodificar JWT base64 (solo para leer payload) ---
    const decodeJwtPayload = (token) => {
        try {
            const base64Url = token.split('.')[1]; // Obtiene la parte del payload
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Convierte a base64 estándar
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            return payload && payload.rol ? payload : null; 
        } catch (e) {
            console.error('Error decodificando token JWT:', e);
            return null;
        }
    };

    // --- Event Listener para el envío del formulario de Login ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(loginMessageArea); // Oculta mensajes anteriores
        hideFieldError(usernameError); // Oculta errores de campo
        hideFieldError(passwordError); // Oculta errores de campo

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validaciones en cascada
        let isValid = true;
        if (!validateRequired(username, usernameError, 'Usuario')) isValid = false;
        if (!validateRequired(password, passwordError, 'Contraseña')) isValid = false;

        if (!isValid) {
            showMessage(loginMessageArea, 'Por favor, completa todos los campos obligatorios.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Backend response data for login:', data);

            if (data.success) {
                showMessage(loginMessageArea, 'Inicio de sesión exitoso. Redirigiendo...', 'success');
                localStorage.setItem('jwt_token', data.token);

                let userRoleFromResponse = data.user_role;
                // Si el backend no envía user_role o es undefined, se decodifica del token
                if (!userRoleFromResponse || typeof userRoleFromResponse === 'undefined') {
                    console.warn('data.user_role del backend es undefined. Intentando extraer del token...');
                    const decodedPayload = decodeJwtPayload(data.token);
                    if (decodedPayload && decodedPayload.rol) { 
                        userRoleFromResponse = decodedPayload.rol;
                        console.log('Rol extraído del token:', userRoleFromResponse);
                    } else {
                        console.error('No se pudo extraer el rol del token después de un login exitoso.');
                        showMessage(loginMessageArea, 'Error crítico: Rol de usuario no disponible.', 'error');
                        return;
                    }
                }

                localStorage.setItem('user_role', userRoleFromResponse); 
                console.log('Stored in localStorage - jwt_token:', localStorage.getItem('jwt_token'), 'user_role:', localStorage.getItem('user_role')); // LOG DE DEPURACIÓN: Qué se guardó

                setTimeout(() => {
                    // Redirección basada en el rol del usuario
                    if (userRoleFromResponse === 'admin') {
                        window.location.href = '../../views/admin/dashboard.html'; 
                    } else if (userRoleFromResponse === 'consulta') {
                        window.location.href = '../../views/cliente/home.html'; 
                    } else {
                        console.warn('Rol de usuario desconocido:', userRoleFromResponse, '. Redirigiendo a página de inicio por defecto.');
                        window.location.href = '/'; 
                    }
                }, 1500); 

            } else {
                showMessage(loginMessageArea, data.mensaje || 'Credenciales inválidas. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error de red o del servidor durante el login:', error);
            showMessage(loginMessageArea, 'Error de conexión. No se pudo conectar con el servidor.', 'error');
        }
    });

    // --- Verificación inicial: si ya hay un token válido, redirigir ---
    const checkAuthAndRedirect = () => {
        const token = localStorage.getItem('jwt_token');
        let userRole = localStorage.getItem('user_role'); // Intenta obtener el rol de localStorage

        console.log(`Initial check - localStorage token:`, token, `localStorage userRole:`, userRole);

        // Si hay token pero el rol no está definido en localStorage, intenta decodificar el token
        if (token && (userRole === null || userRole === 'undefined' || userRole === '')) {
            console.warn('userRole no encontrado en localStorage, intentando decodificar token para obtener el rol.');
            const decodedPayload = decodeJwtPayload(token);
            if (decodedPayload && decodedPayload.rol) { 
                userRole = decodedPayload.rol;
                localStorage.setItem('user_role', userRole); // Actualiza localStorage para futuras cargas
                console.log('Rol extraído del token y actualizado en localStorage:', userRole);
            } else {
                console.warn('No se pudo extraer el rol del token o el token no tiene la estructura esperada. Permaneciendo en página de login.');
                // Si no se puede obtener el rol del token, se limpia el token y el rol
                localStorage.removeItem('jwt_token');
                localStorage.removeItem('user_role');
                return; // No redirigir
            }
        }

        if (token && userRole && userRole !== 'undefined') { 
            console.log(`Token JWT y rol (${userRole}) encontrados. Redirigiendo al dashboard.`);
            if (userRole === 'admin') {
                window.location.href = '../../views/admin/dashboard.html'; 
            } else if (userRole === 'consulta') {
                window.location.href = '../../views/cliente/home.html'; 
            } else {
                console.warn('Rol de usuario desconocido al cargar la página:', userRole, '. Permaneciendo en la página de login.');
            }
        } else {
             console.warn('No se encontró token o rol válido. Permitiendo permanencia en la página de login.');
             
        }
    };

    checkAuthAndRedirect();
});
