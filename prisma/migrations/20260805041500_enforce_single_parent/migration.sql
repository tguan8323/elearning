ALTER TABLE "ParentAccount"
ADD COLUMN "familySlot" TEXT NOT NULL DEFAULT 'primary-family';

CREATE UNIQUE INDEX "ParentAccount_familySlot_key"
ON "ParentAccount"("familySlot");
