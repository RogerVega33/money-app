// Validador de usuario
function validateUsername(username) {
    const errors = []

    if (!username || typeof username !== 'string') {
        errors.push('El usuario es requerido.')
        return errors
    }

    const trimmed = username.trim()

    if (trimmed.length < 3 || trimmed.length > 25)
        errors.push('El usuario debe tener entre 3 y 25 caracteres.')

    if (!/^[a-zA-Z0-9]+$/.test(trimmed))
        errors.push('El usuario solo puede contener letras y números.')

    return errors
}

// Validador de contraseña
function validatePassword(password) {
    const errors = []

    if (!password || typeof password !== 'string') {
        errors.push('La contraseña es requerida.')
        return errors
    }

    if (password.length < 8)
        errors.push('La contraseña debe tener mínimo 8 caracteres.')

    if (password.length > 64)
        errors.push('La contraseña debe tener máximo 64 caracteres.')

    const hasUpper  = /[A-Z]/.test(password)
    const hasLower  = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    const strongPassword = password.length >= 8 && hasUpper && hasLower && hasNumber
    const longPassword   = password.length >= 12

    if (!strongPassword && !longPassword)
        errors.push('La contraseña debe tener +8 caracteres con mayúsculas, minúsculas y números — o bien +12 caracteres libres')

    return errors
}

// Función combinada
function validateUserCredentials(username, password) {
    const errors = {
        username: validateUsername(username),
        password: validatePassword(password),
    }
    const messages = Object.values(errors).flat().filter(e => e.length > 0)
    const hasErrors = messages.length > 0
    const message = messages.join(' ')
    return { hasErrors, message }
}

module.exports = { validateUsername, validatePassword, validateUserCredentials }