-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "ParentAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ParentSession_tokenHash_key" ON "ParentSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ParentSession_parentId_idx" ON "ParentSession"("parentId");

-- CreateIndex
CREATE INDEX "ParentSession_expiresAt_idx" ON "ParentSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "ParentSession" ADD CONSTRAINT "ParentSession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
