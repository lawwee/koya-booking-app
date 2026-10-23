// Local stand-in for the backend API. Swap this module for fetch calls later,
// keeping the same method names and return shapes.

const DOCTORS = [
  'Dr Ada', 'Dr Brown', 'Dr Chris', 'Dr Doom', 'Dr Ellis',
  'Dr Frank', 'Dr Grace', 'Dr Hale', 'Dr Idris', 'Dr Jones',
];

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let slots;
let bookings;
let rateLimitAttempts;
let idempotencyRecords;
let bookingSequence;

function seedSlotTime(hour) {
  return `2026-10-23T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function resetState(slotList) {
  const createdAt = new Date().toISOString();
  slots = slotList.map((slot) => ({
    id: slot.id,
    provider: slot.provider,
    start: slot.start,
    end: slot.end,
    available: true,
    created_at: createdAt,
  }));
  bookings = [];
  rateLimitAttempts = {};
  idempotencyRecords = {};
  bookingSequence = 0;
}

resetState(DOCTORS.map((provider, index) => ({
  id: `s${index + 1}`,
  provider,
  start: seedSlotTime(9 + index),
  end: seedSlotTime(10 + index),
})));

const fail = (message) => Promise.reject(new Error(message));
const succeed = (value) => Promise.resolve(structuredClone(value));

const findBooking = (id) => bookings.find((booking) => booking.id === id);
const findSlot = (id) => slots.find((slot) => slot.id === id);

// Records an attempt and returns an error message if the email is over the limit.
function checkRateLimit(email, now) {
  const recent = (rateLimitAttempts[email] || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  rateLimitAttempts[email] = recent;

  if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    const waitSeconds = Math.max(1, Math.ceil((recent[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return `Too many booking attempts. Try again in ${waitSeconds} seconds`;
  }

  recent.push(now);
  return null;
}

// Cursors are base64 of "o:<offset>".
function encodeCursor(offset) {
  return btoa(`o:${offset}`);
}

function decodeCursor(cursor) {
  try {
    const match = atob(cursor).match(/^o:(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

export const api = {
  listSlots(provider) {
    if (provider !== undefined && !String(provider).trim()) {
      return fail('provider is invalid');
    }

    const result = slots
      .filter((slot) => provider === undefined || slot.provider === provider)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

    return succeed(result);
  },

  createBooking({ slot_id, name, email, key }) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName) return fail('Name is required');
    if (!EMAIL_PATTERN.test(cleanEmail)) return fail('Enter a valid email address');

    const now = Date.now();
    const rateLimitError = checkRateLimit(cleanEmail, now);
    if (rateLimitError) return fail(rateLimitError);

    const slotId = String(slot_id || '').trim();

    let idempotencyKey;
    if (key !== undefined) {
      idempotencyKey = String(key).trim();
      if (!idempotencyKey) return fail('Idempotency-Key is empty');
    }

    const requestBody = JSON.stringify([slotId, cleanName, cleanEmail]);
    const previous = idempotencyKey !== undefined ? idempotencyRecords[idempotencyKey] : undefined;
    if (previous) {
      if (previous.body !== requestBody) {
        return fail('Idempotency key was used with a different request body');
      }
      return succeed(findBooking(previous.bookingId));
    }

    const slot = findSlot(slotId);
    if (!slot) return fail('Slot not found');
    if (Date.parse(slot.start) <= now) return fail('Slot has already started');
    if (!slot.available) return fail('Slot is no longer available');

    bookingSequence += 1;
    const booking = {
      id: `b${String(bookingSequence).padStart(4, '0')}`,
      slot_id: slotId,
      name: cleanName,
      email: cleanEmail,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    bookings.push(booking);
    slot.available = false;

    if (idempotencyKey !== undefined) {
      idempotencyRecords[idempotencyKey] = { body: requestBody, bookingId: booking.id };
    }

    return succeed(booking);
  },

  getBooking(id) {
    const booking = findBooking(id);
    return booking ? succeed(booking) : fail('Booking not found');
  },

  cancelBooking(id) {
    const booking = findBooking(id);
    if (!booking) return fail('Booking not found');
    if (booking.status === 'cancelled') return fail('Booking is already cancelled');

    booking.status = 'cancelled';
    const slot = findSlot(booking.slot_id);
    if (slot) slot.available = true;

    return succeed(booking);
  },

  listBookings({ email, limit, cursor }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) return fail('email is required');

    let pageSize = DEFAULT_PAGE_SIZE;
    const rawLimit = limit === undefined ? '' : String(limit).trim();
    if (rawLimit !== '') {
      const parsed = Number(rawLimit);
      if (!/^\d+$/.test(rawLimit) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
        return fail(`limit must be an integer from 1 to ${MAX_PAGE_SIZE}`);
      }
      pageSize = parsed;
    }

    let offset = 0;
    if (cursor) {
      offset = decodeCursor(cursor);
      if (offset === null) return fail('cursor is invalid');
    }

    const matching = bookings.filter((booking) => booking.email === cleanEmail);
    if (offset > matching.length) return fail('cursor is invalid');

    const hasNext = offset + pageSize < matching.length;
    return succeed({
      items: matching.slice(offset, offset + pageSize),
      has_next: hasNext,
      next_cursor: hasNext ? encodeCursor(offset + pageSize) : null,
    });
  },

  reset(slotList) {
    if (!Array.isArray(slotList)) return fail('slots must be a list');

    const seenIds = new Set();
    for (const slot of slotList) {
      const start = Date.parse(slot.start);
      const end = Date.parse(slot.end);

      if (!slot.id || !slot.provider || !slot.start || !slot.end || isNaN(start) || isNaN(end)) {
        return fail('Every slot needs an id, provider, start and end');
      }
      if (end <= start) return fail('End must be after start');
      if (seenIds.has(slot.id)) return fail('Slot ids must be unique');

      seenIds.add(slot.id);
    }

    resetState(slotList);
    return succeed({ message: 'Done' });
  },
};
