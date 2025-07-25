/*
  Warnings:

  - You are about to drop the `_ProjectCollaborators` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `collaborators` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Made the column `components` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `iaInsights` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dateRange` on table `Report` required. This step will fail if there are existing NULL values in that column.
  - Made the column `iaResults` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "_ProjectCollaborators_B_index";

-- DropIndex
DROP INDEX "_ProjectCollaborators_AB_unique";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "gender" TEXT;
ALTER TABLE "User" ADD COLUMN "identityNumber" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ProjectCollaborators";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ProjectCollaborator" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ProjectCollaborator_A_fkey" FOREIGN KEY ("A") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectCollaborator_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "message", "read", "title", "type", "userId") SELECT "createdAt", "id", "message", "read", "title", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pattern" TEXT NOT NULL DEFAULT 'monolith',
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownerId" INTEGER NOT NULL,
    "collaborators" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "lastSync" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iaInsights" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("components", "createdAt", "description", "iaInsights", "id", "lastSync", "name", "ownerId", "pattern", "status", "tags", "updatedAt") SELECT "components", "createdAt", "description", "iaInsights", "id", coalesce("lastSync", CURRENT_TIMESTAMP) AS "lastSync", "name", "ownerId", "pattern", "status", "tags", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metrics" TEXT NOT NULL,
    "iaResults" TEXT NOT NULL,
    "dateRange" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Report" ("createdAt", "dateRange", "description", "fileUrl", "iaResults", "id", "metrics", "title", "type", "userId") SELECT "createdAt", "dateRange", "description", "fileUrl", "iaResults", "id", "metrics", "title", "type", "userId" FROM "Report";
DROP TABLE "Report";
ALTER TABLE "new_Report" RENAME TO "Report";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectCollaborator_AB_unique" ON "_ProjectCollaborator"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectCollaborator_B_index" ON "_ProjectCollaborator"("B");
