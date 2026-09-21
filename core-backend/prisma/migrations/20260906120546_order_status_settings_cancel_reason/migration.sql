-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'packed';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancel_reason" TEXT;

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroImageUrl" TEXT,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "heroCtaText" TEXT,
    "heroCtaHref" TEXT,
    "storeAddress" TEXT,
    "storePhone" TEXT,
    "storeEmail" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "bankAccountHolder" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
