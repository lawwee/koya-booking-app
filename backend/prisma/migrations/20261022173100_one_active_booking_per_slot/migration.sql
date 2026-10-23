-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "active_slot_id" TEXT;

UPDATE "Booking" SET "active_slot_id" = "slot_id" WHERE "status" != 'cancelled';

-- CreateIndex
CREATE UNIQUE INDEX "Booking_active_slot_id_key" ON "Booking"("active_slot_id");
