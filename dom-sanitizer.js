// dom-sanitizer.js
// Enterprise XSS Protection

const ENTITY_MAP = {

    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

export function sanitizeHTML(
    input = ''
) {

    return String(input)
        .replace(
            /[&<>"'`=\/]/g,
            s => ENTITY_MAP[s]
        );
}

export function safeInnerHTML(
    element,
    html
) {

    if (!element) {

        return;
    }

    element.innerHTML =
        sanitizeHTML(html);
}