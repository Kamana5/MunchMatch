/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,userId,placeID]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vote_sessionId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vote_sessionId_userId_placeID_key" ON "Vote"("sessionId", "userId", "placeID");
