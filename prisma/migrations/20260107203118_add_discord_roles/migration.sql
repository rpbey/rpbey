-- CreateTable
CREATE TABLE "discord_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "icon" TEXT,
    "permissions" TEXT NOT NULL,
    "managed" BOOLEAN NOT NULL DEFAULT false,
    "hoist" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_roles_pkey" PRIMARY KEY ("id")
);
