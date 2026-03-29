export function groupBy<T, K>(items: T[], keyFn: (t: T) => K): Map<K, T[]> {
    const m = new Map<K, T[]>();
    for (const it of items) {
        const k = keyFn(it);
        const arr = m.get(k);
        if (arr) arr.push(it);
        else m.set(k, [it]);
    }
    return m;
}

export function uniquePush<T>(arr: T[] | undefined, value: T): void {
    if (!arr) return;
    if (!arr.includes(value)) arr.push(value);
}

/**
 * Gets a value from an item or falls back to the first item in an array that has that property.
 * Useful for forms that need to default to the most recent non-empty value.
 * @param item The primary item to get the value from
 * @param fallbackArray Array to search if primary item doesn't have the value
 * @param propertyName The property name to retrieve
 * @returns The value or undefined
 * 
 * @example
 * const shift = shifts[0];
 * const service = getValueOrFallback(shift, shifts, 'service');
 * // Returns shift.service if truthy, otherwise finds first shift with service property
 */
export function getValueOrFallback<T>(item: T | undefined, fallbackArray: T[], propertyName: keyof T): any {
    if (item && item[propertyName]) {
        return item[propertyName];
    }
    const fallbackItem = fallbackArray.find(x => x[propertyName]);
    return fallbackItem?.[propertyName];
}
