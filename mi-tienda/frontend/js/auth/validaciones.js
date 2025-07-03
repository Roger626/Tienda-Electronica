// mi-tienda/frontend/js/utils/formValidation.js

/**
 * Muestra un mensaje en un área de mensajes específica.
 * @param {HTMLElement} areaElement El elemento DIV donde se mostrará el mensaje.
 * @param {string} message El texto del mensaje.
 * @param {string} type El tipo de mensaje ('success', 'error', 'info').
 */
export const showMessage = (areaElement, message, type) => {
    areaElement.textContent = message;
    areaElement.classList.remove('hidden', 'error', 'success', 'info');
    areaElement.classList.add(type);
    areaElement.style.display = 'block'; // Asegura que sea visible
};

/**
 * Oculta un área de mensajes específica.
 * @param {HTMLElement} areaElement El elemento DIV a ocultar.
 */
export const hideMessage = (areaElement) => {
    areaElement.classList.add('hidden');
    areaElement.textContent = '';
    areaElement.style.display = 'none'; // Asegura que esté oculto
};

/**
 * Muestra un mensaje de error debajo de un campo de formulario.
 * @param {HTMLElement} errorElement El elemento P donde se mostrará el error.
 * @param {string} message El texto del error.
 */
export const showFieldError = (errorElement, message) => {
    errorElement.textContent = message;
    errorElement.style.display = 'block'; // Asegura que sea visible
};

/**
 * Oculta el mensaje de error de un campo de formulario.
 * @param {HTMLElement} errorElement El elemento P a ocultar.
 */
export const hideFieldError = (errorElement) => {
    errorElement.textContent = '';
    errorElement.style.display = 'none'; 
};

/**
 * Valida un campo de texto para asegurar que no esté vacío.
 * @param {string} value El valor del campo.
 * @param {HTMLElement} errorElement El elemento para mostrar errores.
 * @param {string} fieldName El nombre del campo para el mensaje.
 * @returns {boolean} True si es válido, false si está vacío.
 */
export const validateRequired = (value, errorElement, fieldName) => {
    if (!value) {
        showFieldError(errorElement, `${fieldName} es obligatorio.`);
        return false;
    }
    hideFieldError(errorElement);
    return true;
};

/**
 * Valida el formato de email.
 * @param {string} email El email a validar.
 * @param {HTMLElement} errorElement El elemento para mostrar errores.
 * @returns {boolean} True si es un email válido.
 */
export const validateEmail = (email, errorElement) => {
    if (!validateRequired(email, errorElement, 'Email')) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFieldError(errorElement, 'Ingresa un formato de email válido.');
        return false;
    }
    hideFieldError(errorElement);
    return true;
};

/**
 * Valida la longitud mínima de una contraseña.
 * @param {string} password La contraseña.
 * @param {HTMLElement} errorElement El elemento para mostrar errores.
 * @param {number} minLength La longitud mínima requerida.
 * @returns {boolean} True si es válida.
 */
export const validatePasswordLength = (password, errorElement, minLength = 6) => {
    if (!validateRequired(password, errorElement, 'Contraseña')) return false;
    if (password.length < minLength) {
        showFieldError(errorElement, `La contraseña debe tener al menos ${minLength} caracteres.`);
        return false;
    }
    hideFieldError(errorElement);
    return true;
};

/**
 * Valida que dos contraseñas coincidan.
 * @param {string} password La primera contraseña.
 * @param {string} confirmPassword La confirmación de la contraseña.
 * @param {HTMLElement} errorElement El elemento para mostrar errores.
 * @returns {boolean} True si coinciden.
 */
export const validatePasswordsMatch = (password, confirmPassword, errorElement) => {
    if (!validateRequired(confirmPassword, errorElement, 'Confirmar contraseña')) return false;
    if (password !== confirmPassword) {
        showFieldError(errorElement, 'Las contraseñas no coinciden.');
        return false;
    }
    hideFieldError(errorElement);
    return true;
};
