/*
  Warnings:

  - You are about to drop the `_ProjectCollaborator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `collaborators` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_ProjectCollaborator_B_index";

-- DropIndex
DROP INDEX "_ProjectCollaborator_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ProjectCollaborator";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ProjectCollaborator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Usuario',
    CONSTRAINT "ProjectCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pattern" TEXT NOT NULL DEFAULT 'monolith',
    "status" TEXT NOT NULL DEFAULT 'active',
    "ownerId" INTEGER NOT NULL,
    "components" TEXT NOT NULL,
    "lastSync" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iaInsights" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "license" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "addReadme" BOOLEAN NOT NULL DEFAULT true,
    "addGitignore" BOOLEAN NOT NULL DEFAULT true,
    "chooseLicense" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("addGitignore", "addReadme", "chooseLicense", "components", "createdAt", "description", "iaInsights", "id", "lastSync", "license", "name", "ownerId", "pattern", "status", "tags", "updatedAt", "visibility") SELECT "addGitignore", "addReadme", "chooseLicense", "components", "createdAt", "description", "iaInsights", "id", "lastSync", "license", "name", "ownerId", "pattern", "status", "tags", "updatedAt", "visibility" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCollaborator_projectId_userId_key" ON "ProjectCollaborator"("projectId", "userId");
