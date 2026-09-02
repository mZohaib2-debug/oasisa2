-- DropIndex
DROP INDEX "Cart_anonymousId_key";

-- CreateIndex
CREATE INDEX "Cart_anonymousId_idx" ON "Cart"("anonymousId");
