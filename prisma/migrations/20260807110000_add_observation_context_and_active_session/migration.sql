-- Extend post-lesson observations with parent-entered context.
ALTER TABLE "LearningObservation" ADD COLUMN "effectivePrompt" TEXT;
ALTER TABLE "LearningObservation" ADD COLUMN "interestLevel" TEXT;
ALTER TABLE "LearningObservation" ADD COLUMN "fatigueLevel" TEXT;
ALTER TABLE "LearningObservation" ADD COLUMN "discomfort" BOOLEAN NOT NULL DEFAULT false;

-- Enforce one active teaching session per learner at database level.
CREATE UNIQUE INDEX "TeachingSession_one_active_per_learner_idx"
  ON "TeachingSession"("learnerId")
  WHERE "status" = 'IN_PROGRESS';
