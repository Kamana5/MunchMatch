/*
  Warnings:

  - A unique constraint covering the columns `[id,sessionId]` on the table `Place` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Place_id_sessionId_key" ON "Place"("id", "sessionId");
