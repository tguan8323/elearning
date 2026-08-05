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

CREATE UNIQUE INDEX "FamilyAdaptation_parentId_key" ON "FamilyAdaptation"("parentId");
CREATE UNIQUE INDEX "TeachingSession_clientId_key" ON "TeachingSession"("clientId");
CREATE INDEX "TeachingSession_learnerId_createdAt_idx" ON "TeachingSession"("learnerId", "createdAt");
CREATE UNIQUE INDEX "LearningObservation_clientId_key" ON "LearningObservation"("clientId");
CREATE INDEX "LearningObservation_learnerId_targetId_observedAt_idx" ON "LearningObservation"("learnerId", "targetId", "observedAt");

ALTER TABLE "FamilyAdaptation" ADD CONSTRAINT "FamilyAdaptation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningObservation" ADD CONSTRAINT "LearningObservation_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningObservation" ADD CONSTRAINT "LearningObservation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
