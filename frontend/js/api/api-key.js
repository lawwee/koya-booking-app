const API_KEY_STORAGE_KEY = 'koya_api_key';

export function getApiKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

// Throws if the browser blocks storage (for example, some private modes).
export function saveApiKey(value) {
  if (value) {
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}
