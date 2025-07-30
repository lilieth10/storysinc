-- CreateTable
CREATE TABLE "AIConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisInterval" INTEGER NOT NULL DEFAULT 30,
    "confidenceThreshold" INTEGER NOT NULL DEFAULT 75,
    "maxRecommendations" INTEGER NOT NULL DEFAULT 10,
    "autoAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "performanceAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "securityAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "codeQualityAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "accessibilityAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "patternDetection" BOOLEAN NOT NULL DEFAULT true,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "maxTokens" INTEGER NOT NULL DEFAULT 4000,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER,
    "userId" INTEGER,
    "analysisType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "recommendations" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIModel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_name_key" ON "AIModel"("name");
