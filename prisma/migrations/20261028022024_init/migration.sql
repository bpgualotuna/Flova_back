/*
  Warnings:

  - You are about to drop the column `precio` on the `terapias` table. All the data in the column will be lost.
  - Added the required column `price` to the `terapias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "terapias" DROP COLUMN "precio",
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;
