import { db } from "../src/config/database.config";

const DOCTORS = [
  "Dr Ada",
  "Dr Brown",
  "Dr Chris",
  "Dr Doom",
  "Dr Ellis",
  "Dr Frank",
  "Dr Grace",
  "Dr Hale",
  "Dr Idris",
  "Dr Jones",
] as const;

const FIRST_START = new Date("2026-10-23T09:00:00.000Z");
const SLOT_LENGTH_MS = 60 * 60 * 1000;

async function main() {
  for (const [index, provider] of DOCTORS.entries()) {
    const id = `s${index + 1}`;
    const start = new Date(FIRST_START.getTime() + index * SLOT_LENGTH_MS);
    const end = new Date(start.getTime() + SLOT_LENGTH_MS);

    await db.slot.upsert({
      where: { id },
      update: {
        provider,
        start,
        end,
        available: true,
      },
      create: {
        id,
        provider,
        start,
        end,
        available: true,
      },
    });
  }
}

main()
  .then(async () => {
    console.log(`Seeded ${DOCTORS.length} slots`);
    await db.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
