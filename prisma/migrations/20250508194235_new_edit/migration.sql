/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,userId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Vote_sessionId_userId_key" ON "Vote"("sessionId", "userId");
