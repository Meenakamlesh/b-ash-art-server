-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
