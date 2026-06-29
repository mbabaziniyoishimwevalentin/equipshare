-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "preferredCommunication" TEXT;
