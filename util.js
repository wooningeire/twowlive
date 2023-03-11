export const qs = (selector="*", context=document) => context.querySelector(selector);
export const qsa = (selector="*", context=document) => context.querySelectorAll(selector);
export const ce = (tagName="div", {context=document}={}) => context.createElement(tagName);

export const mod = (dividend, divisor) => (dividend % divisor + divisor) % divisor;

// Removes all the children of an element
export function declade(element) {
    while (element.lastElementChild) {
        element.lastElementChild.remove();
    }
    return element;
}

export function btoaN(text, n) {
    for (let i = 0; i < n; i++) {
        text = btoa(text);
    }
    return text;
}

export function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
    return element;
}