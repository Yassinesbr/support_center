-- CreateEnum
CREATE TYPE "ClassPricingMode" AS ENUM ('PER_STUDENT', 'FIXED_TOTAL');

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "fixedMonthlyPriceCents" INTEGER,
ADD COLUMN     "pricingMode" "ClassPricingMode" NOT NULL DEFAULT 'PER_STUDENT',
ADD COLUMN     "teacherFixedMonthlyPayCents" INTEGER,
ALTER COLUMN "monthlyPriceCents" DROP NOT NULL,
ALTER COLUMN "monthlyPriceCents" DROP DEFAULT;

-- CreateTable
CREATE TABLE "StudentClassPriceOverride" (
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "priceOverrideCents" INTEGER NOT NULL,

    CONSTRAINT "StudentClassPriceOverride_pkey" PRIMARY KEY ("studentId","classId")
);

-- AddForeignKey
ALTER TABLE "StudentClassPriceOverride" ADD CONSTRAINT "StudentClassPriceOverride_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentClassPriceOverride" ADD CONSTRAINT "StudentClassPriceOverride_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
