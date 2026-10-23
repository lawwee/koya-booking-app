const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, number[]>();

export function bookingAttemptRetryAfter(email: string): number | undefined {
    const now = Date.now();
    const recent = (attempts.get(email) ?? []).filter((at) => now - at < WINDOW_MS);

    if (recent.length >= MAX_ATTEMPTS) {
        attempts.set(email, recent);
        const oldest = recent[0];
        if (oldest === undefined) {
            return undefined;
        }
        return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    }

    recent.push(now);
    attempts.set(email, recent);
    return undefined;
}
