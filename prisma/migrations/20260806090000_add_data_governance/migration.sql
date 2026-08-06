-- CreateTable
CREATE TABLE "LearnerDeletionIntent" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerDeletionIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearnerDeletionTombstone" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "deletedLearnerId" TEXT NOT NULL,
    "teachingSessionCount" INTEGER NOT NULL,
    "observationCount" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnerDeletionTombstone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearnerDeletionIntent_tokenHash_key" ON "LearnerDeletionIntent"("tokenHash");
CREATE INDEX "LearnerDeletionIntent_parentId_learnerId_idx" ON "LearnerDeletionIntent"("parentId", "learnerId");
CREATE INDEX "LearnerDeletionTombstone_parentId_deletedAt_idx" ON "LearnerDeletionTombstone"("parentId", "deletedAt");
ALTER TABLE "LearnerDeletionIntent" ADD CONSTRAINT "LearnerDeletionIntent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearnerDeletionTombstone" ADD CONSTRAINT "LearnerDeletionTombstone_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
