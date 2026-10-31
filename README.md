# Koya Booking

A small clinic booking app. One Express process serves the static frontend and the JSON API. Appointments are stored in PostgreSQL through Prisma.

A slot can be booked only while it is still in the future and still marked available. Booking it claims the slot. Cancelling the booking releases the slot. Repeating a create with the same `Idempotency-Key` and the same body returns the original result.

## Requirements

- Node.js 22 or newer (Node 20.19 or newer also works)
- A PostgreSQL database and its connection string

## Configure

Create `backend/.env`. This file is gitignored.

```env
PORT=3000
API_KEY=choose-a-long-random-key
DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/postgres?sslmode=verify-full"
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `API_KEY` | yes | Shared secret. Every `/api` request must send it as `x-api-key`. |
| `DATABASE_URL` | yes | PostgreSQL connection string used by Prisma and the app. |
| `PORT` | no | Local listen port. Defaults to `5000`. On Render, leave it unset so the platform can assign it. |

`sslmode=verify-full` matches what the `pg` driver enforces. `sslmode=require` still encrypts the connection, and current `pg` prints a warning that it treats `require` as `verify-full`.

## Run locally

From `backend`:

```bash
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On **Settings**, save the same value as `API_KEY`. The browser stores it and sends it as `x-api-key`.

`npm start` generates the Prisma client, applies migrations, runs the seed, then starts the server. The seed inserts ten one-hour slots only when the database has no slots. Later runs leave existing slots and bookings in place.

The seeded doctors are Dr Ada through Dr Jones. The first slot starts at 09:00 UTC on the day the database is first seeded, and each following slot starts one hour later. A slot whose start time has passed can be listed, and it cannot be booked.

## Scripts

Run these from `backend`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Restarts the server when source files change. Does not migrate or seed. |
| `npm start` | Generates the client, applies migrations, seeds an empty database, then serves the app. |
| `npm run build` | Runs `prisma generate`. |

## Pages

The frontend is a hash router served from `/`.

| Page | What it does |
| --- | --- |
| Slots | Lists slots. Filter with an exact doctor name, for example `Dr Ada`. |
| Book | Creates a booking. `Idempotency-Key` is optional. |
| My bookings | Lists one email's bookings, oldest first, with cursor pages. |
| Find booking | Loads one booking by id and can cancel it. |
| Settings | Saves or removes the API key in `localStorage`. |
| Reset | Replaces every slot and deletes every booking. This cannot be undone. |

## API

All routes are under `/api` and require the header `x-api-key`. A missing or wrong key returns `401`:

```json
{ "error": "Unauthorized" }
```

Validation errors return `400` with `{ "error": "..." }`. Other failures use the same shape and the status codes below.

### `GET /api/slots`

Optional query: `provider` (exact doctor name).

```json
[
  {
    "id": "s1",
    "provider": "Dr Ada",
    "start": "2026-10-31T09:00:00.000Z",
    "end": "2026-10-31T10:00:00.000Z",
    "available": true,
    "created_at": "2026-10-31T10:09:44.678Z"
  }
]
```

### `POST /api/bookings`

```json
{ "slot_id": "s8", "name": "Ada Lovelace", "email": "ada@example.com" }
```

`name` and `email` are required. `email` must be a valid address and is stored in lowercase.

Success is `201` and a booking object. New bookings are stored as `confirmed`.

| Status | When |
| --- | --- |
| `404` | No slot with that id. |
| `400` | The slot has already started, or the body is invalid. |
| `409` | The slot is no longer available. |
| `429` | That email has already made 5 booking attempts in the last 60 seconds. `Retry-After` is set in seconds. |
| `422` | This `Idempotency-Key` was already used with a different body. |

An optional `Idempotency-Key` header ties the result to that key and the exact JSON body. Sending the same key and the same body again returns the stored status and body, including a stored `400`, `404`, or `409`. An empty key is `400`.

### `GET /api/bookings/:id`

Returns one booking, or `404` when the id does not exist.

```json
{
  "id": "5c0f0c3e-3c3a-4d4e-9c1a-0b6e5a2f1d11",
  "slot_id": "s8",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "status": "confirmed",
  "created_at": "2026-10-31T16:00:00.000Z"
}
```

### `DELETE /api/bookings/:id`

Sets the booking to `cancelled` and marks its slot available again. Returns the updated booking. Cancelling an already cancelled booking returns `400`. An unknown id returns `404`.

### `GET /api/bookings`

Query parameters:

| Name | Required | Meaning |
| --- | --- | --- |
| `email` | yes | Bookings for this address. |
| `limit` | no | Page size from 1 to 50. Default `10`. |
| `cursor` | no | `next_cursor` from the previous page. |

Results are ordered by `created_at`, then `id`, oldest first.

```json
{
  "bookings": [],
  "next_cursor": null
}
```

`next_cursor` is `null` on the last page.

### `POST /api/reset`

Deletes every booking and idempotency record, then replaces the slots with the array you send. An empty `slots` array leaves the database with no slots.

```json
{
  "slots": [
    {
      "id": "s1",
      "provider": "Dr Ada",
      "start": "2026-11-01T09:00:00.000Z",
      "end": "2026-11-01T10:00:00.000Z"
    }
  ]
}
```

Each slot needs a unique `id`, a `provider`, and an `end` after `start`. Success is `200` and `{ "message": "Done" }`.

## Deploy on Render

Use one web service for the whole repository. The database stays on PostgreSQL, so a free Render instance can sleep without deleting bookings.

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `API_KEY` and `DATABASE_URL`
- Do not set `PORT`

The deployed commit must contain this app. Render builds from git, and `backend/.env` is not in git. After the first boot, the seed finds the existing slots and does not insert another set.

The first request after the web service or the database has been idle can take longer while the connection is retried.
