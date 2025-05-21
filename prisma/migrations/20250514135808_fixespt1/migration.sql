/*
  Warnings:

  - The primary key for the `Place` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    PRIMARY KEY ("id", "sessionId"),
    CONSTRAINT "Place_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Place" ("id", "name", "sessionId") SELECT "id", "name", "sessionId" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_id_key" ON "Place"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
