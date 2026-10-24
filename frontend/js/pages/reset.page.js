import { api } from '../api/koya-api.js';
import { fromLocalInputValue, toLocalInputValue } from '../utils/format.js';
import { errorMessage, escapeHtml } from '../utils/html.js';
import { $, navigate, render, setFlash } from '../utils/view.js';

function editableSlotRow(slot = {}) {
  return `
    <tr>
      <td><input data-field="id" value="${escapeHtml(slot.id || '')}" size="6"></td>
      <td><input data-field="provider" value="${escapeHtml(slot.provider || '')}"></td>
      <td><input data-field="start" type="datetime-local" value="${toLocalInputValue(slot.start)}"></td>
      <td><input data-field="end" type="datetime-local" value="${toLocalInputValue(slot.end)}"></td>
      <td><button type="button" class="alt remove-row" aria-label="Remove slot">Remove</button></td>
    </tr>`;
}

function readSlotRow(row) {
  const field = (name) => row.querySelector(`[data-field="${name}"]`).value;
  return {
    id: field('id').trim(),
    provider: field('provider').trim(),
    start: fromLocalInputValue(field('start')),
    end: fromLocalInputValue(field('end')),
  };
}

export async function renderResetPage() {
  let currentSlots;
  try {
    currentSlots = await api.listSlots();
  } catch (error) {
    render(`<h1 class="dgt">Reset</h1>${errorMessage(error)}`);
    return;
  }

  render(`
    <h1 class="dgt">Reset</h1>
    <p class="msg err">
      This replaces every slot and deletes every booking. It also clears rate-limit counts
      and saved idempotency keys. It cannot be undone.
    </p>
    <form id="reset-form">
      <div class="scroll">
        <table>
          <thead>
            <tr><th>ID</th><th>Provider</th><th>Start</th><th>End</th><th></th></tr>
          </thead>
          <tbody id="slot-rows">${currentSlots.map((slot) => editableSlotRow(slot)).join('')}</tbody>
        </table>
      </div>
      <p><button type="button" id="add-row" class="alt">Add slot</button></p>
      <p class="hint">Start times can be in the past. Leave the list empty to remove all slots.</p>
      <div id="reset-error"></div>
      <button type="button" id="start-reset" class="danger">Replace everything</button>
      <div id="confirm-reset" hidden>
        <p class="msg err">Replace all slots and delete all bookings?</p>
        <button type="button" id="confirm-yes" class="danger">Yes, reset</button>
        <button type="button" id="confirm-no" class="alt">Keep my data</button>
      </div>
    </form>
  `);

  const rows = $('#slot-rows');
  const startButton = $('#start-reset');
  const confirmBox = $('#confirm-reset');

  const showConfirm = (visible) => {
    confirmBox.hidden = !visible;
    startButton.hidden = visible;
  };

  $('#reset-form').onsubmit = (event) => event.preventDefault();

  $('#add-row').onclick = () => rows.insertAdjacentHTML('beforeend', editableSlotRow());

  rows.onclick = (event) => {
    const removeButton = event.target.closest('.remove-row');
    if (removeButton) removeButton.closest('tr').remove();
  };

  startButton.onclick = () => showConfirm(true);
  $('#confirm-no').onclick = () => showConfirm(false);

  $('#confirm-yes').onclick = async () => {
    const slots = [...rows.rows].map(readSlotRow);
    try {
      const result = await api.reset(slots);
      setFlash(result.message);
      navigate('#/slots');
    } catch (error) {
      $('#reset-error').innerHTML = errorMessage(error);
      showConfirm(false);
    }
  };
}
