-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('PARENT', 'LEARNER');

-- CreateEnum
CREATE TYPE "AssetUploadState" AS ENUM ('METADATA_ONLY', 'UPLOADED');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('PUBLISHED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL,
    "familySlot" TEXT NOT NULL DEFAULT 'primary-family',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL DEFAULT 'PARENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyAdaptation" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "sessionMinutes" INTEGER NOT NULL DEFAULT 15,
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 5,
    "accent" TEXT NOT NULL DEFAULT 'en-US',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "interests" TEXT[],
    "excludedThemes" TEXT[],
    "availableMaterials" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyAdaptation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningObservation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "promptLevel" TEXT,
    "materialVariant" TEXT,
    "note" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "ContentSlot" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "acceptedMimeTypes" TEXT[],
    "maxFileSize" INTEGER NOT NULL,
    "learnerEligible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetBinding" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "previewSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_familySlot_key" ON "ParentAccount"("familySlot");

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "ParentAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_parentId_key" ON "LearnerProfile"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentSession_tokenHash_key" ON "ParentSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ParentSession_parentId_idx" ON "ParentSession"("parentId");

-- CreateIndex
CREATE INDEX "ParentSession_expiresAt_idx" ON "ParentSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyAdaptation_parentId_key" ON "FamilyAdaptation"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingSession_clientId_key" ON "TeachingSession"("clientId");

-- CreateIndex
CREATE INDEX "TeachingSession_learnerId_createdAt_idx" ON "TeachingSession"("learnerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningObservation_clientId_key" ON "LearningObservation"("clientId");

-- CreateIndex
CREATE INDEX "LearningObservation_learnerId_targetId_observedAt_idx" ON "LearningObservation"("learnerId", "targetId", "observedAt");

-- CreateIndex
CREATE INDEX "FamilyAsset_parentId_createdAt_idx" ON "FamilyAsset"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "AssetVersion_assetId_idx" ON "AssetVersion"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetVersion_assetId_version_key" ON "AssetVersion"("assetId", "version");

-- CreateIndex
CREATE INDEX "AssetBinding_slotId_idx" ON "AssetBinding"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetBinding_versionId_slotId_key" ON "AssetBinding"("versionId", "slotId");

-- CreateIndex
CREATE INDEX "Publication_parentId_state_idx" ON "Publication"("parentId", "state");

-- CreateIndex
CREATE INDEX "Publication_bindingId_idx" ON "Publication"("bindingId");

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSession" ADD CONSTRAINT "ParentSession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAdaptation" ADD CONSTRAINT "FamilyAdaptation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningObservation" ADD CONSTRAINT "LearningObservation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningObservation" ADD CONSTRAINT "LearningObservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyAsset" ADD CONSTRAINT "FamilyAsset_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetVersion" ADD CONSTRAINT "AssetVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FamilyAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBinding" ADD CONSTRAINT "AssetBinding_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBinding" ADD CONSTRAINT "AssetBinding_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ContentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_bindingId_fkey" FOREIGN KEY ("bindingId") REFERENCES "AssetBinding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

