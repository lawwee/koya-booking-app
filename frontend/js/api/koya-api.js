import { getApiKey } from './api-key.js';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }

  get unauthorized() {
    return this.status === 401;
  }
}

function buildUrl(path, query = {}) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(name, value);
  }
  const queryString = params.toString();
  return `${API_BASE}${path}${queryString ? `?${queryString}` : ''}`;
}

function errorFromResponse(response, body) {
  if (response.status === 401) {
    return new ApiError('Unauthorized. Enter the API key on the Settings page.', 401);
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const suffix = retryAfter ? `. Try again in ${retryAfter} seconds` : '';
    return new ApiError(`Too many booking attempts${suffix}`, 429);
  }
  const message = body && typeof body.error === 'string' ? body.error : `Request failed (${response.status})`;
  return new ApiError(message, response.status);
}

async function request(method, path, { query, body, headers = {} } = {}) {
  const requestHeaders = { ...headers };
  const apiKey = getApiKey();
  if (apiKey) requestHeaders['x-api-key'] = apiKey;
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server', 0);
  }

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) throw errorFromResponse(response, responseBody);
  return responseBody;
}

export const api = {
  listSlots(provider) {
    return request('GET', '/slots', { query: { provider } });
  },

  createBooking({ slot_id, name, email, key }) {
    const headers = key === undefined ? {} : { 'Idempotency-Key': key };
    return request('POST', '/bookings', { body: { slot_id, name, email }, headers });
  },

  getBooking(id) {
    return request('GET', `/bookings/${encodeURIComponent(id)}`);
  },

  cancelBooking(id) {
    return request('DELETE', `/bookings/${encodeURIComponent(id)}`);
  },

  listBookings({ email, limit, cursor }) {
    return request('GET', '/bookings', { query: { email, limit, cursor } });
  },

  reset(slots) {
    return request('POST', '/reset', { body: { slots } });
  },
};
