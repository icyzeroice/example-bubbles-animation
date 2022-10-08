import { isUndefined } from "lodash"

/**
 * 需要确保 key 和 value 不会为 undefined
 */
export class Bimap<TKey, TValue> {
    private mapForward = new Map<TKey, TValue>()
    private mapInverse = new Map<TValue, TKey>()

    hasKey(key: TKey) {
        return this.mapForward.has(key)
    }

    hasValue(value: TValue) {
        return this.mapInverse.has(value)
    }

    getValue(key: TKey) {
        return this.mapForward.get(key)
    }

    getKey(value: TValue) {
        return this.mapInverse.get(value)
    }

    setPair(key: TKey, value: TValue) {
        this.mapForward.set(key, value)
        this.mapInverse.set(value, key)
    }

    deleteKey(key: TKey) {
        const value = this.mapForward.get(key)

        if (!isUndefined(value)) {
            this.mapInverse.delete(value)
        }

        this.mapForward.delete(key)
    }

    deleteValue(value: TValue) {
        const key = this.mapInverse.get(value)

        if (!isUndefined(key)) {
            this.mapForward.delete(key)
        }

        this.mapInverse.delete(value)
    }
}