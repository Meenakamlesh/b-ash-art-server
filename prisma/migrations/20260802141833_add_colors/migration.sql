-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[];
