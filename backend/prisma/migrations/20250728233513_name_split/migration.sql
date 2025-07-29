/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL;
