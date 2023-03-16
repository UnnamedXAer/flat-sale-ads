-- CreateTable
CREATE TABLE "TmpOffersInfo" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmpOffersInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TmpOffer" (
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

    CONSTRAINT "TmpOffer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TmpOffer" ADD CONSTRAINT "TmpOffer_offersInfoId_fkey" FOREIGN KEY ("offersInfoId") REFERENCES "TmpOffersInfo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
