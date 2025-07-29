-- AlterTable
ALTER TABLE "TrainingResource" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "TrainingResource" ADD COLUMN "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "UserTrainingProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "UserTrainingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTrainingProgress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TrainingResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingCertificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "certificateUrl" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "TrainingCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingCertificate_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "TrainingResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingProgress_userId_resourceId_key" ON "UserTrainingProgress"("userId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_userId_resourceId_key" ON "TrainingCertificate"("userId", "resourceId");
