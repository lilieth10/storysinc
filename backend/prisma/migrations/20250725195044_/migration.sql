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
    "collaborators" TEXT NOT NULL,
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
INSERT INTO "new_Project" ("collaborators", "components", "createdAt", "description", "iaInsights", "id", "lastSync", "name", "ownerId", "pattern", "status", "tags", "updatedAt") SELECT "collaborators", "components", "createdAt", "description", "iaInsights", "id", "lastSync", "name", "ownerId", "pattern", "status", "tags", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
