/*
  Warnings:

  - The primary key for the `Video` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cid` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbCid` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `thumbUrl` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Video` table. All the data in the column will be lost.
  - The `id` column on the `Video` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Video_filename_key";

-- AlterTable
ALTER TABLE "Video" DROP CONSTRAINT "Video_pkey",
DROP COLUMN "cid",
DROP COLUMN "thumbCid",
DROP COLUMN "thumbUrl",
DROP COLUMN "url",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Video_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "User";
