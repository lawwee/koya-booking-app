import { api } from '../api/mock-api.js';
import { errorMessage, escapeHtml, timeTag } from '../utils/html.js';
import { $, navigate, render } from '../utils/view.js';

function slotRow(slot) {
  const isBookable = slot.available && Date.parse(slot.start) > Date.now();
  const unavailableReason = slot.available ? 'Already started' : 'Booked';

  const action = isBookable
    ? `<a class="btn" href="#/book?slot_id=${escapeHtml(encodeURIComponent(slot.id))}">Book</a>`
    : `<span class="hint">${unavailableReason}</span>`;

  return `
    <tr>
      <td>${escapeHtml(slot.id)}</td>
      <td>${escapeHtml(slot.provider)}</td>
      <td>${timeTag(slot.start)}</td>
      <td>${timeTag(slot.end)}</td>
      <td>
        <span class="b ${slot.available ? 'g' : 'x'}">${slot.available ? 'Available' : 'Unavailable'}</span>
      </td>
      <td>${timeTag(slot.created_at)}</td>
      <td>${action}</td>
    </tr>`;
}

function slotsTable(slots) {
  return `
    <div class="scroll">
      <table>
        <thead>
          <tr><th>ID</th><th>Doctor</th><th>Start</th><th>End</th><th>Status</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>${slots.map(slotRow).join('')}</tbody>
      </table>
    </div>`;
}

export async function renderSlotsPage(query) {
  const hasProvider = query.has('provider');

  render(`
    <h1>Slots</h1>
    <form id="slot-filter" class="row">
      <label>Doctor
        <input name="provider" value="${escapeHtml(query.get('provider') || '')}" placeholder="Dr Ada">
      </label>
      <button>Filter</button>
      <a class="btn alt" href="#/slots">Clear</a>
    </form>
    <p class="hint">Doctor names must match exactly, for example Dr Ada.</p>
    <div id="slots-output">Loading…</div>
  `);

  $('#slot-filter').onsubmit = (event) => {
    event.preventDefault();
    navigate(`#/slots?provider=${encodeURIComponent(event.target.provider.value)}`);
  };

  const output = $('#slots-output');
  try {
    const slots = await api.listSlots(hasProvider ? query.get('provider') : undefined);
    if (slots.length) {
      output.innerHTML = slotsTable(slots);
    } else {
      const suffix = hasProvider ? ' for that doctor.' : '. Add slots on the Reset page.';
      output.innerHTML = `<p class="empty">No slots found${suffix}</p>`;
    }
  } catch (error) {
    output.innerHTML = errorMessage(error.message);
  }
}
