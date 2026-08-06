CREATE TABLE IF NOT EXISTS "AudioReview" (
  "id" TEXT NOT NULL,
  "assetVersionId" TEXT NOT NULL,
  "accent" TEXT NOT NULL,
  "reviewState" TEXT NOT NULL,
  "reviewerNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "AudioReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AudioReview_assetVersionId_key" UNIQUE ("assetVersionId"),
  CONSTRAINT "AudioReview_assetVersionId_fkey" FOREIGN KEY ("assetVersionId") REFERENCES "AssetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
