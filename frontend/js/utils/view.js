import { successMessage } from './html.js';

let flashMessage = '';

export const $ = (selector) => document.querySelector(selector);

// Shown once at the top of the next rendered page, then cleared.
export function setFlash(message) {
  flashMessage = message;
}

export function render(html) {
  $('#app').innerHTML = (flashMessage ? successMessage(flashMessage) : '') + html;
  flashMessage = '';
}

export function refresh() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function navigate(hash) {
  if (location.hash === hash) {
    refresh();
  } else {
    location.hash = hash;
  }
}
