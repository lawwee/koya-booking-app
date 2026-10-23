import { createHash } from "node:crypto";

function sortedValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => sortedValue(item));
    }
    if (value !== null && typeof value === "object") {
        const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
        const sorted: Record<string, unknown> = {};
        for (const [key, entry] of entries) {
            sorted[key] = sortedValue(entry);
        }
        return sorted;
    }
    return value;
}

export function hashRequestBody(body: unknown): string {
    return createHash("sha256").update(JSON.stringify(sortedValue(body))).digest("hex");
}
