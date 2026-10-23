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

export function errorMessage(message) {
  return `<p class="msg err" role="alert">${escapeHtml(message)}</p>`;
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
