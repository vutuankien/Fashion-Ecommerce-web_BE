-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "address" TEXT,
    "password" TEXT NOT NULL,
    "refresh_token" TEXT,
    "phone" TEXT,
    "salary" INTEGER,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'employer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employer_email_key" ON "Employer"("email");
