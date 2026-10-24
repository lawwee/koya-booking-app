import { formatDateTime } from './format.js';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// Accepts an Error or a plain message. Unauthorized API errors get a link to Settings.
export function errorMessage(errorOrMessage) {
  const isError = errorOrMessage instanceof Error;
  const message = isError ? errorOrMessage.message : errorOrMessage;
  const settingsLink = isError && errorOrMessage.unauthorized
    ? ' <a href="#/settings">Go to Settings</a>'
    : '';
  return `<p class="msg err" role="alert">${escapeHtml(message)}${settingsLink}</p>`;
}

export function successMessage(message) {
  return `<p class="msg ok" role="status">${escapeHtml(message)}</p>`;
}

export function statusBadge(status) {
  return `<span class="b ${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

export function timeTag(isoString) {
  return `<time title="${escapeHtml(isoString)}">${escapeHtml(formatDateTime(isoString))}</time>`;
}
