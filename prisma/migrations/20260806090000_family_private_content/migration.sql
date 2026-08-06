CREATE TYPE "AssetUploadState" AS ENUM ('METADATA_ONLY', 'UPLOADED');
CREATE TYPE "PublicationState" AS ENUM ('PUBLISHED', 'WITHDRAWN');

CREATE TABLE "FamilyAsset" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "targetLanguage" TEXT,
  "courseRefs" TEXT[],
  "stimulusFeatures" TEXT[],
  "copyrightNotice" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FamilyAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetVersion" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "uploadState" "AssetUploadState" NOT NULL DEFAULT 'METADATA_ONLY',
  "storageKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContentSlot" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "acceptedMimeTypes" TEXT[],
  "maxFileSize" INTEGER NOT NULL,
  "learnerEligible" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ContentSlot_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AssetBinding" (
  "id" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "previewSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetBinding_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Publication" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "bindingId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "state" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
  "snapshot" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawnAt" TIMESTAMP(3),
  CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FamilyAsset_parentId_createdAt_idx" ON "FamilyAsset"("parentId", "createdAt");
CREATE INDEX "AssetVersion_assetId_idx" ON "AssetVersion"("assetId");
CREATE UNIQUE INDEX "AssetVersion_assetId_version_key" ON "AssetVersion"("assetId", "version");
CREATE INDEX "AssetBinding_slotId_idx" ON "AssetBinding"("slotId");
CREATE UNIQUE INDEX "AssetBinding_versionId_slotId_key" ON "AssetBinding"("versionId", "slotId");
CREATE INDEX "Publication_parentId_state_idx" ON "Publication"("parentId", "state");
CREATE INDEX "Publication_bindingId_idx" ON "Publication"("bindingId");
ALTER TABLE "FamilyAsset" ADD CONSTRAINT "FamilyAsset_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetVersion" ADD CONSTRAINT "AssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FamilyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetBinding" ADD CONSTRAINT "AssetBinding_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetBinding" ADD CONSTRAINT "AssetBinding_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ContentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_bindingId_fkey" FOREIGN KEY ("bindingId") REFERENCES "AssetBinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
