-- Add retryable upload lifecycle and media duration metadata
ALTER TYPE "AssetUploadState" ADD VALUE IF NOT EXISTS 'UPLOADING';
ALTER TYPE "AssetUploadState" ADD VALUE IF NOT EXISTS 'UPLOAD_FAILED';
ALTER TABLE "AssetVersion" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "AssetVersion" ADD COLUMN "uploadError" TEXT;
