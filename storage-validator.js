// storage-validator.js
// Enterprise Validation Layer

const UUID_REGEX =
    /^[a-zA-Z0-9_-]{6,120}$/;

const DATE_REGEX =
    /^\d{4}-\d{2}-\d{2}$/;

export class StorageValidator {

    static validateStoreName(store) {

        if (
            !store ||
            typeof store !== 'string'
        ) {

            throw new Error(
                '[VALIDATOR] Invalid store name'
            );
        }

        return true;
    }

    static validateId(id) {

        if (
            !id ||
            typeof id !== 'string'
        ) {

            throw new Error(
                '[VALIDATOR] Invalid ID'
            );
        }

        if (!UUID_REGEX.test(id)) {

            throw new Error(
                '[VALIDATOR] Unsafe ID format'
            );
        }

        return true;
    }

    static validatePayload(payload) {

        if (
            !payload ||
            typeof payload !== 'object' ||
            Array.isArray(payload)
        ) {

            throw new Error(
                '[VALIDATOR] Invalid payload'
            );
        }

        return true;
    }

    static sanitizeString(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return '';
        }

        return String(value)
            .trim()
            .replace(/[<>]/g, '');
    }

    static sanitizeNumber(value) {

        const n = Number(value);

        if (Number.isNaN(n)) {

            return 0;
        }

        return n;
    }

    static sanitizeBoolean(value) {

        return Boolean(value);
    }

    static sanitizeDate(value) {

        if (!value) {

            return '';
        }

        const str =
            String(value).trim();

        if (!DATE_REGEX.test(str)) {

            return '';
        }

        return str;
    }

    static sanitizeObject(obj) {

        const clean = {};

        Object.entries(obj)
            .forEach(([key, value]) => {

                if (
                    typeof value === 'string'
                ) {

                    clean[key] =
                        this.sanitizeString(value);

                } else if (
                    typeof value === 'number'
                ) {

                    clean[key] =
                        this.sanitizeNumber(value);

                } else if (
                    typeof value === 'boolean'
                ) {

                    clean[key] =
                        this.sanitizeBoolean(value);

                } else {

                    clean[key] = value;
                }
            });

        return clean;
    }
}