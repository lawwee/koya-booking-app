/*
  Warnings:

  - You are about to drop the column `date` on the `Slot` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Slot" ("available", "createdAt", "end", "id", "provider", "start", "updatedAt") SELECT "available", "createdAt", "end", "id", "provider", "start", "updatedAt" FROM "Slot";
DROP TABLE "Slot";
ALTER TABLE "new_Slot" RENAME TO "Slot";
CREATE UNIQUE INDEX "Slot_id_key" ON "Slot"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
