import { errorMessage, escapeHtml, successMessage } from '../utils/html.js';
import { $, render } from '../utils/view.js';

const API_KEY_STORAGE_KEY = 'koya_api_key';

function readStoredKey() {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function renderSettingsPage() {
  render(`
    <h1>Settings</h1>
    <form id="settings-form" class="col">
      <label>API key (x-api-key)
        <input name="apiKey" type="password" value="${escapeHtml(readStoredKey())}" autocomplete="off">
      </label>
      <div class="row">
        <button>Save key</button>
        <button type="button" id="remove-key" class="alt">Remove key</button>
      </div>
      <div id="settings-message"></div>
    </form>
    <p class="hint">The key stays in this browser. It is not sent anywhere yet.</p>
  `);

  const form = $('#settings-form');
  const message = $('#settings-message');

  const saveKey = (value) => {
    try {
      if (value) {
        localStorage.setItem(API_KEY_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
      message.innerHTML = successMessage(value ? 'Key saved.' : 'Key removed.');
    } catch {
      message.innerHTML = errorMessage('Could not save the key in this browser');
    }
  };

  form.onsubmit = (event) => {
    event.preventDefault();
    saveKey(form.apiKey.value.trim());
  };

  $('#remove-key').onclick = () => {
    form.apiKey.value = '';
    saveKey('');
  };
}
