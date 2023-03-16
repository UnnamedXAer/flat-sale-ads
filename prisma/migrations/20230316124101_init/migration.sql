-- CreateEnum
CREATE TYPE "Site" AS ENUM ('rzeszowiakAgencje', 'rzeszowiak', 'olx', 'otodom', 'gethome');

-- CreateTable
CREATE TABLE "OffersInfo" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffersInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" SERIAL NOT NULL,
    "offerId" TEXT NOT NULL,
    "site" "Site" NOT NULL,
    "dt" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "dt_" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "offersInfoId" INTEGER NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_offersInfoId_fkey" FOREIGN KEY ("offersInfoId") REFERENCES "OffersInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
