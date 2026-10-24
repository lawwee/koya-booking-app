import { getApiKey, saveApiKey } from '../api/api-key.js';
import { errorMessage, escapeHtml, successMessage } from '../utils/html.js';
import { $, render } from '../utils/view.js';

export function renderSettingsPage() {
  render(`
    <h1>Settings</h1>
    <form id="settings-form" class="col">
      <label>API key (x-api-key)
        <input name="apiKey" type="password" value="${escapeHtml(getApiKey())}" autocomplete="off">
      </label>
      <div class="row">
        <button>Save key</button>
        <button type="button" id="remove-key" class="alt">Remove key</button>
      </div>
      <div id="settings-message"></div>
    </form>
    <p class="hint">The key is stored in this browser and sent with every request as x-api-key.</p>
  `);

  const form = $('#settings-form');
  const message = $('#settings-message');

  const updateKey = (value) => {
    try {
      saveApiKey(value);
      message.innerHTML = successMessage(value ? 'Key saved.' : 'Key removed.');
    } catch {
      message.innerHTML = errorMessage('Could not save the key in this browser');
    }
  };

  form.onsubmit = (event) => {
    event.preventDefault();
    updateKey(form.apiKey.value.trim());
  };

  $('#remove-key').onclick = () => {
    form.apiKey.value = '';
    updateKey('');
  };
}
