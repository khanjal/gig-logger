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
