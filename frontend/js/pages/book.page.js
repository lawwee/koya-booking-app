import { api } from '../api/koya-api.js';
import { errorMessage, escapeHtml } from '../utils/html.js';
import { $, navigate, render, setFlash } from '../utils/view.js';

export function renderBookPage(query) {
  render(`
    <h1>Book a slot</h1>
    <form id="booking-form" class="col" novalidate>
      <label>Slot ID
        <input name="slotId" value="${escapeHtml(query.get('slot_id') || '')}">
      </label>
      <label>Name
        <input name="customerName" autocomplete="name">
      </label>
      <label>Email
        <input name="email" autocomplete="email" inputmode="email">
      </label>
      <label>Idempotency-Key (optional)
        <input name="idempotencyKey" autocomplete="off">
      </label>
      <div id="booking-error"></div>
      <div><button>Book slot</button></div>
    </form>
    <p class="hint">Starts must be in the future. The same email can try 5 times a minute.</p>
  `);

  $('#booking-form').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button');
    submitButton.disabled = true;

    try {
      const booking = await api.createBooking({
        slot_id: form.slotId.value,
        name: form.customerName.value,
        email: form.email.value,
        key: form.idempotencyKey.value === '' ? undefined : form.idempotencyKey.value,
      });
      setFlash(`Booking created. Your booking id is ${booking.id}.`);
      navigate(`#/bookings/${encodeURIComponent(booking.id)}`);
    } catch (error) {
      $('#booking-error').innerHTML = errorMessage(error);
    }

    submitButton.disabled = false;
  };
}
