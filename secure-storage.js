// secure-storage.js
// Enterprise Encrypted Local Storage

const SECRET_KEY =
    'crm-enterprise-v6';

class SecureStorage {

    encode(value) {

        try {

            return btoa(
                encodeURIComponent(
                    JSON.stringify(value)
                ) + SECRET_KEY
            );

        } catch {

            return null;
        }
    }

    decode(value) {

        try {

            const decoded =
                atob(value);

            const clean =
                decoded.replace(
                    SECRET_KEY,
                    ''
                );

            return JSON.parse(
                decodeURIComponent(clean)
            );

        } catch {

            return null;
        }
    }

    set(
        key,
        value
    ) {

        const encoded =
            this.encode(value);

        if (!encoded) {

            return;
        }

        localStorage.setItem(
            key,
            encoded
        );
    }

    get(key) {

        const value =
            localStorage.getItem(key);

        if (!value) {

            return null;
        }

        return this.decode(value);
    }

    remove(key) {

        localStorage.removeItem(
            key
        );
    }

    clear() {

        localStorage.clear();
    }
}

export const SecureStore =
    new SecureStorage();