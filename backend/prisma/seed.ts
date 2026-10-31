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

const SLOT_LENGTH_MS = 60 * 60 * 1000;

function firstSlotStart(): Date {
  const today = new Date();
  return new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    9,
    0,
    0,
    0,
  ));
}

async function main() {
  const existingSlots = await db.slot.count();
  if (existingSlots > 0) {
    console.log("Database already has slots; leaving existing data in place");
    return;
  }

  const firstStart = firstSlotStart();
  await db.slot.createMany({
    data: DOCTORS.map((provider, index) => {
      const start = new Date(firstStart.getTime() + index * SLOT_LENGTH_MS);
      return {
        id: `s${index + 1}`,
        provider,
        start,
        end: new Date(start.getTime() + SLOT_LENGTH_MS),
        available: true,
      };
    }),
  });

  console.log(`Seeded ${DOCTORS.length} slots from ${firstStart.toISOString()}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
