// cartera-utils.js
// Enterprise Cartera Utils

export function sanitizeHTML(value) {

    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function normalizeText(text) {

    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function currencyMXN(value) {

    return new Intl.NumberFormat(

        'es-MX',

        {

            style: 'currency',

            currency: 'MXN'
        }

    ).format(

        Number(value) || 0
    );
}

export function calculateNextPaymentDate(
    emissionDate,
    paymentType
) {

    if (
        !emissionDate ||
        paymentType ===
        'Prima Única'
    ) {

        return emissionDate;
    }

    const paymentDate =
        new Date(
            `${emissionDate}T12:00:00`
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    while (
        paymentDate < today
    ) {

        switch (paymentType) {

            case 'Mensual':

                paymentDate.setMonth(
                    paymentDate.getMonth() + 1
                );

                break;

            case 'Trimestral':

                paymentDate.setMonth(
                    paymentDate.getMonth() + 3
                );

                break;

            case 'Semestral':

                paymentDate.setMonth(
                    paymentDate.getMonth() + 6
                );

                break;

            case 'Anual':

                paymentDate.setFullYear(
                    paymentDate.getFullYear() + 1
                );

                break;

            default:

                return emissionDate;
        }
    }

    return paymentDate
        .toISOString()
        .split('T')[0];
}