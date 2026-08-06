CREATE TABLE "SyncOperation" (
  "id" TEXT NOT NULL,
  "parentId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SyncOperation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SyncChange" (
  "sequence" BIGSERIAL NOT NULL,
  "parentId" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "payload" JSONB,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SyncChange_pkey" PRIMARY KEY ("sequence")
);
CREATE UNIQUE INDEX "SyncOperation_parentId_operationId_key" ON "SyncOperation"("parentId", "operationId");
CREATE INDEX "SyncOperation_parentId_appliedAt_idx" ON "SyncOperation"("parentId", "appliedAt");
CREATE INDEX "SyncChange_parentId_sequence_idx" ON "SyncChange"("parentId", "sequence");
CREATE INDEX "SyncChange_parentId_recordType_recordId_idx" ON "SyncChange"("parentId", "recordType", "recordId");
ALTER TABLE "SyncOperation" ADD CONSTRAINT "SyncOperation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncChange" ADD CONSTRAINT "SyncChange_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
