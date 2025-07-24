/**
 * Type definitions for data-only objects (no functions/methods)
 */
/**
 * Type guard to check if a value is a JsonObject
 */
export function isJsonObject(value) {
    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && Object.values(value).every(v => v === null ||
            typeof v === 'string' ||
            typeof v === 'number' ||
            typeof v === 'boolean' ||
            isJsonObject(v) ||
            Array.isArray(v));
}
/**
 * Type guard to ensure no functions in object
 */
export function isDataOnly(obj) {
    if (!isJsonObject(obj))
        return false;
    const checkValue = (val) => {
        if (typeof val === 'function')
            return false;
        if (Array.isArray(val))
            return val.every(item => checkValue(item));
        if (typeof val === 'object' && val !== null) {
            return Object.values(val).every(item => checkValue(item));
        }
        return true;
    };
    return checkValue(obj);
}
