// mi-tienda/frontend/js/auth/register.js
import { 
    showMessage, 
    hideMessage, 
    showFieldError, 
    hideFieldError, 
    validateRequired, 
    validatePasswordLength, 
    validatePasswordsMatch 
} from './validaciones.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerPasswordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerMessageArea = document.getElementById('registerMessageArea');
    const registerUsernameError = document.getElementById('registerUsernameError');
    const registerPasswordError = document.getElementById('registerPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // --- Configuración de la API ---
    const API_BASE_URL = 'http://localhost/mi-tienda/backend/public/api.php';

    // --- Event Listener para el envío del formulario de Registro ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage(registerMessageArea); // Oculta mensajes anteriores
        hideFieldError(registerUsernameError);
        hideFieldError(registerPasswordError);
        hideFieldError(confirmPasswordError);

        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let isValid = true;
        // Validaciones en cascada
        if (!validateRequired(username, registerUsernameError, 'Nombre de Usuario')) isValid = false;
        if (!validatePasswordLength(password, registerPasswordError)) isValid = false;
        if (!validatePasswordsMatch(password, confirmPassword, confirmPasswordError)) isValid = false;

        if (!isValid) {
            showMessage(registerMessageArea, 'Por favor, corrige los errores en el formulario.', 'error');
            return;
        }

        try {
            const userData = {
                username: username,
                password: password,
                rol: 'consulta', 
                creado_por_id: null // Para auto-registro
            };

            const response = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                showMessage(registerMessageArea, data.mensaje || 'Cuenta creada exitosamente. ¡Redirigiendo al login!', 'success');
                registerForm.reset();
                setTimeout(() => {
                    window.location.href = 'login.html'; 
                }, 2000);

            } else {
                showMessage(registerMessageArea, data.mensaje || 'Error al crear la cuenta. Inténtalo de nuevo.', 'error');
            }

        } catch (error) {
            console.error('Error de red o del servidor durante el registro:', error);
            showMessage(registerMessageArea, 'Error de conexión. No se pudo conectar con el servidor.', 'error');
        }
    });

    // --- Verificación inicial: si ya hay un token válido, redirigir ---
    const checkAuthAndRedirect = () => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            console.log('Token JWT encontrado. Redirigiendo al dashboard.');
            window.location.href = '../admin/dashboard.html'; 
        }
    };

    checkAuthAndRedirect();
});
