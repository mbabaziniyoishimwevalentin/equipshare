/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `CommunityEvent` table. All the data in the column will be lost.
  - Added the required column `communityId` to the `CommunityEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityId` to the `Meetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityId` to the `SharingTip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `communityId` to the `Suggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Community" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "CommunityEvent" DROP COLUMN "imageUrl",
ADD COLUMN     "communityId" INTEGER NOT NULL,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Meetup" ADD COLUMN     "communityId" INTEGER NOT NULL,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "SharingTip" ADD COLUMN     "communityId" INTEGER NOT NULL,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "communityId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "TipLike" (
    "id" SERIAL NOT NULL,
    "tipId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "TipLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipComment" (
    "id" SERIAL NOT NULL,
    "tipId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipLike_tipId_userId_key" ON "TipLike"("tipId", "userId");

-- AddForeignKey
ALTER TABLE "Meetup" ADD CONSTRAINT "Meetup_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityEvent" ADD CONSTRAINT "CommunityEvent_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharingTip" ADD CONSTRAINT "SharingTip_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipLike" ADD CONSTRAINT "TipLike_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "SharingTip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipLike" ADD CONSTRAINT "TipLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipComment" ADD CONSTRAINT "TipComment_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "SharingTip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipComment" ADD CONSTRAINT "TipComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
