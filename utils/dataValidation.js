const error = require('./errors');
const badRequest = message => { throw error(message, 400, false); };

function object(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) badRequest('Los datos deben ser un objeto.');
    return value;
}

function integer(value, label, min = 1, max = 2147483647) {
    if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value)) ||
        !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) {
        badRequest(`${label} debe ser un entero entre ${min} y ${max}.`);
    }
    return Number(value);
}

function text(value, label, max, optional = false) {
    if (optional && (value === undefined || value === null)) return '';
    if (typeof value !== 'string') badRequest(`${label} debe ser texto.`);
    const normalized = value.trim();
    if (!optional && !normalized) badRequest(`${label} es obligatorio.`);
    if ([...normalized].length > max) badRequest(`${label} debe tener máximo ${max} caracteres.`);
    // El esquema actual usa utf8mb3: rechazar caracteres que no puede almacenar.
    if ([...normalized].some(char => char.codePointAt(0) > 0xffff)) badRequest(`${label} contiene caracteres no compatibles con la base de datos actual.`);
    return normalized;
}

function choice(value, label, options) {
    if (!options.includes(value)) badRequest(`${label} debe ser ${options.join(' o ')}.`);
    return value;
}

// Expandir la notación de números JSON pequeños sin redondear el monto recibido.
function decimalText(value) {
    if (typeof value !== 'number') return value;
    if (!Number.isFinite(value)) return '';
    const str = String(value);
    if (!str.includes('e')) return str;
    const [mantissa, exponent] = str.split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    const digits = whole + fraction;
    const point = whole.length + Number(exponent);
    if (point <= 0) return '0.' + '0'.repeat(-point) + digits;
    return point >= digits.length ? digits + '0'.repeat(point - digits.length) : digits.slice(0, point) + '.' + digits.slice(point);
}

function amount(value, crypto = false, allowZero = false) {
    const scale = crypto ? 10 : 2;
    const integerDigits = crypto ? 20 : 13;
    const str = decimalText(value);
    if (typeof str !== 'string' || str.length > 64 || !/^\d+(\.\d+)?$/.test(str)) {
        badRequest('El monto debe ser un número decimal válido y no negativo.');
    }
    let [whole, fraction = ''] = str.split('.');
    whole = whole.replace(/^0+(?=\d)/, '');
    if (fraction.length > scale) badRequest(`El monto admite máximo ${scale} decimales.`);
    if (whole.length > integerDigits) badRequest(`El monto supera el límite permitido (${integerDigits} dígitos enteros).`);
    if (!allowZero && !/[1-9]/.test(whole + fraction)) badRequest('El monto debe ser mayor que cero.');
    return whole + (fraction ? '.' + fraction : '');
}

function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) badRequest('La fecha debe tener el formato YYYY-MM-DD.');
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 ||
        day > new Date(Date.UTC(year, month, 0)).getUTCDate()) badRequest('La fecha no es válida.');
    return value;
}

function symbol(value) {
    const normalized = text(value, 'El símbolo', 10).toUpperCase();
    if (!/^[A-Z0-9]{1,10}$/.test(normalized)) badRequest('El símbolo solo admite letras y números (máximo 10).');
    return normalized;
}

function transaction(value, crypto = false, update = false) {
    object(value);
    const result = { amount: amount(value.amount, crypto) };
    if (update) result.id = integer(value.id, 'La transacción');
    if (crypto) {
        result.symbol = symbol(value.symbol);
        if (!update) result.walletId = integer(value.walletId, 'La billetera');
    } else {
        result.date = date(value.date);
        result.categoryId = integer(value.categoryId, 'La categoría');
        result.detail = text(value.detail, 'El detalle', 150, true);
    }
    return result;
}

function category(value) {
    object(value);
    const result = { name: text(value.name, 'El nombre', 50) };
    if (value.id !== undefined) result.id = integer(value.id, 'La categoría');
    else {
        result.walletId = integer(value.walletId, 'La billetera');
        result.type = choice(value.type, 'El tipo de categoría', ['income', 'expense']);
    }
    return result;
}

function wallet(value) {
    object(value);
    const type = choice(value.type === undefined ? 'fiat' : value.type, 'El tipo de billetera', ['fiat', 'crypto']);
    const startingAmount = amount(value.startingAmount === undefined ? 0 : value.startingAmount, false, true);
    if (type === 'crypto' && Number(startingAmount) !== 0) badRequest('Una billetera cripto debe tener saldo inicial cero.');
    return { name: text(value.name, 'El nombre', 50), detail: text(value.detail, 'El detalle', 150, true), type, startingAmount };
}

function walletUpdate(value, type) {
    object(value);
    choice(type, 'El tipo de billetera', ['fiat', 'crypto']);
    const allowed = type === 'fiat' ? ['id', 'name', 'detail', 'startingAmount'] : ['id', 'name', 'detail'];
    if (Object.keys(value).some(key => !allowed.includes(key))) {
        badRequest(type === 'fiat'
            ? 'Solo puede editar el nombre, la descripción y el monto inicial de una billetera fiat.'
            : 'Solo puede editar el nombre y la descripción de una billetera cripto.');
    }
    const result = { name: text(value.name, 'El nombre', 50) };
    if (value.detail !== undefined) {
        result.detail = text(value.detail, 'La descripción', 150, true);
    }
    if (type === 'fiat' && value.startingAmount !== undefined) {
        result.starting_amount = amount(value.startingAmount, false, true);
    }
    return result;
}

function addCryptoAmounts(left, right) {
    const units = value => {
        const [whole, fraction = ''] = amount(value, true, true).split('.');
        return BigInt(whole + fraction.padEnd(10, '0'));
    };
    const sum = String(units(left) + units(right)).padStart(11, '0');
    return amount(sum.slice(0, -10) + '.' + sum.slice(-10), true);
}

module.exports = { object, integer, text, choice, amount, date, symbol, transaction, category, wallet, walletUpdate, addCryptoAmounts };
