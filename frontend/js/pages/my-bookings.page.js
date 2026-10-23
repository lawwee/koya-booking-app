import { api } from '../api/mock-api.js';
import { errorMessage, escapeHtml, statusBadge, timeTag } from '../utils/html.js';
import { $, navigate, render } from '../utils/view.js';

function bookingRow(booking) {
  return `
    <tr>
      <td><a href="#/bookings/${escapeHtml(encodeURIComponent(booking.id))}">${escapeHtml(booking.id)}</a></td>
      <td>${escapeHtml(booking.slot_id)}</td>
      <td>${escapeHtml(booking.name)}</td>
      <td>${escapeHtml(booking.email)}</td>
      <td>${statusBadge(booking.status)}</td>
      <td>${timeTag(booking.created_at)}</td>
    </tr>`;
}

function bookingsTable(bookings) {
  return `
    <div class="scroll">
      <table>
        <thead>
          <tr><th>ID</th><th>Slot ID</th><th>Name</th><th>Email</th><th>Status</th><th>Created</th></tr>
        </thead>
        <tbody>${bookings.map(bookingRow).join('')}</tbody>
      </table>
    </div>`;
}

function pagination({ email, limit, isFirstPage, nextCursor }) {
  const baseHref = `#/my?email=${encodeURIComponent(email)}&limit=${encodeURIComponent(limit)}`;

  const firstPageLink = isFirstPage
    ? ''
    : `<a class="btn alt" href="${escapeHtml(baseHref)}">First page</a>`;

  const nextPageLink = nextCursor
    ? `<a class="btn" href="${escapeHtml(`${baseHref}&cursor=${encodeURIComponent(nextCursor)}`)}">Next page</a>`
    : '<span class="hint">No more pages.</span>';

  return `<div class="pg">${firstPageLink}${nextPageLink}</div>`;
}

export async function renderMyBookingsPage(query) {
  const hasEmail = query.has('email');
  const email = query.get('email') || '';
  const limit = query.get('limit') || '';
  const cursor = query.get('cursor') || undefined;

  const placeholder = hasEmail
    ? 'Loading…'
    : '<p class="empty">Enter your email to see your bookings, oldest first.</p>';

  render(`
    <h1>My bookings</h1>
    <form id="bookings-filter" class="row">
      <label>Email
        <input name="email" value="${escapeHtml(email)}" autocomplete="email">
      </label>
      <label>Per page
        <input name="limit" value="${escapeHtml(limit)}" placeholder="10" inputmode="numeric" size="4">
      </label>
      <button>Show bookings</button>
    </form>
    <div id="bookings-output">${placeholder}</div>
  `);

  $('#bookings-filter').onsubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    navigate(`#/my?email=${encodeURIComponent(form.email.value)}&limit=${encodeURIComponent(form.limit.value)}`);
  };

  if (!hasEmail) return;

  const output = $('#bookings-output');
  try {
    const page = await api.listBookings({
      email,
      limit: query.has('limit') ? query.get('limit') : undefined,
      cursor,
    });

    if (!page.items.length) {
      output.innerHTML = `<p class="empty">No bookings found for ${escapeHtml(email.trim().toLowerCase())}.</p>`;
      return;
    }

    output.innerHTML = bookingsTable(page.items) + pagination({
      email,
      limit,
      isFirstPage: !cursor,
      nextCursor: page.has_next ? page.next_cursor : null,
    });
  } catch (error) {
    output.innerHTML = errorMessage(error.message);
  }
}
