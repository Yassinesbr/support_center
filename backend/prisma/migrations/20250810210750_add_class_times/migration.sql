-- CreateTable
CREATE TABLE "ClassTime" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassTime_classId_idx" ON "ClassTime"("classId");

-- CreateIndex
CREATE INDEX "ClassTime_dayOfWeek_idx" ON "ClassTime"("dayOfWeek");

-- AddForeignKey
ALTER TABLE "ClassTime" ADD CONSTRAINT "ClassTime_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
