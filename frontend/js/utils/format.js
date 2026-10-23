export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

// Converts an ISO string to the "YYYY-MM-DDTHH:mm" local value a datetime-local input expects.
export function toLocalInputValue(isoString) {
  const date = new Date(isoString);
  if (isNaN(date)) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date - offsetMs).toISOString().slice(0, 16);
}

export function fromLocalInputValue(value) {
  return value ? new Date(value).toISOString() : '';
}
