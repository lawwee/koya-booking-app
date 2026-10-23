-- DropIndex
DROP INDEX "Booking_active_slot_id_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "active_slot_id";
