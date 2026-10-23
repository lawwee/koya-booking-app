import { api } from '../api/mock-api.js';
import { errorMessage, escapeHtml, statusBadge, timeTag } from '../utils/html.js';
import { $, navigate, refresh, render, setFlash } from '../utils/view.js';

function bookingDetails(booking) {
  return `
    <dl>
      <dt>ID</dt><dd>${escapeHtml(booking.id)}</dd>
      <dt>Slot ID</dt><dd>${escapeHtml(booking.slot_id)}</dd>
      <dt>Name</dt><dd>${escapeHtml(booking.name)}</dd>
      <dt>Email</dt><dd>${escapeHtml(booking.email)}</dd>
      <dt>Status</dt><dd>${statusBadge(booking.status)}</dd>
      <dt>Created</dt><dd>${timeTag(booking.created_at)}</dd>
    </dl>`;
}

const cancelControls = `
  <div id="cancel-error"></div>
  <button id="cancel-booking" class="danger">Cancel booking</button>`;

export async function renderBookingDetailPage(bookingId) {
  const placeholder = bookingId
    ? 'Loading…'
    : '<p class="empty">Enter a booking id to see its details.</p>';

  render(`
    <h1>Booking</h1>
    <form id="booking-lookup" class="row">
      <label>Booking ID
        <input name="bookingId" value="${escapeHtml(bookingId)}">
      </label>
      <button>Look up</button>
    </form>
    <div id="booking-output">${placeholder}</div>
  `);

  $('#booking-lookup').onsubmit = (event) => {
    event.preventDefault();
    navigate(`#/bookings/${encodeURIComponent(event.target.bookingId.value.trim())}`);
  };

  if (!bookingId) return;

  const output = $('#booking-output');
  try {
    const booking = await api.getBooking(bookingId);
    const isCancelled = booking.status === 'cancelled';
    output.innerHTML = bookingDetails(booking) + (isCancelled ? '' : cancelControls);

    if (isCancelled) return;

    $('#cancel-booking').onclick = async () => {
      try {
        await api.cancelBooking(bookingId);
        setFlash('Booking cancelled. The slot is available again.');
        refresh();
      } catch (error) {
        $('#cancel-error').innerHTML = errorMessage(error.message);
      }
    };
  } catch (error) {
    output.innerHTML = errorMessage(error.message);
  }
}
