-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Employment" AS ENUM ('full', 'part', 'project', 'volunteer', 'probation');

-- CreateEnum
CREATE TYPE "Schedule" AS ENUM ('fullDay', 'shift', 'flexible', 'remote', 'flyInFlyOut');

-- CreateEnum
CREATE TYPE "Experience" AS ENUM ('noExperience', 'between1And3', 'between3And6', 'moreThan6');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('new', 'viewed', 'exported', 'archived', 'skipped');

-- CreateEnum
CREATE TYPE "OrderBy" AS ENUM ('publication_time', 'relevance', 'salary_desc', 'salary_asc');

-- CreateEnum
CREATE TYPE "SalaryTax" AS ENUM ('net', 'gross');

-- CreateEnum
CREATE TYPE "CaptchaAction" AS ENUM ('pause', 'abort', 'retryLater');

-- CreateEnum
CREATE TYPE "ProxyRotation" AS ENUM ('perRequest', 'perSession');

-- CreateTable
CREATE TABLE "Vacancy" (
    "id" UUID NOT NULL,
    "hhId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "salaryFrom" INTEGER,
    "salaryTo" INTEGER,
    "currency" TEXT,
    "salaryTax" "SalaryTax",
    "employment" "Employment",
    "schedule" "Schedule",
    "experience" "Experience",
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "descriptionMd" TEXT,
    "rawPayload" JSONB NOT NULL,
    "status" "VacancyStatus" NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilterConfig" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "titleKeywordsInclude" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descriptionKeywordsInclude" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "titleKeywordsExclude" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descriptionKeywordsExclude" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employment" "Employment"[] DEFAULT ARRAY[]::"Employment"[],
    "schedule" "Schedule"[] DEFAULT ARRAY[]::"Schedule"[],
    "experience" "Experience"[] DEFAULT ARRAY[]::"Experience"[],
    "area" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "searchPeriodDays" INTEGER NOT NULL,
    "orderBy" "OrderBy" NOT NULL DEFAULT 'publication_time',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperConfig" (
    "id" UUID NOT NULL,
    "userAgent" TEXT NOT NULL,
    "headless" BOOLEAN NOT NULL DEFAULT true,
    "userDataDir" TEXT NOT NULL DEFAULT './.scraper-profile',
    "viewportWidth" INTEGER NOT NULL DEFAULT 1920,
    "viewportHeight" INTEGER NOT NULL DEFAULT 1080,
    "locale" TEXT NOT NULL DEFAULT 'ru-RU',
    "maxConcurrency" INTEGER NOT NULL DEFAULT 1,
    "pageTimeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "onCaptcha" "CaptchaAction" NOT NULL DEFAULT 'retryLater',
    "captchaRetryDelayMs" INTEGER NOT NULL DEFAULT 900000,
    "proxyUrl" TEXT,
    "proxyRotation" "ProxyRotation",
    "rateLimit" JSONB NOT NULL,
    "enrichment" JSONB NOT NULL,
    "navigationRetry" JSONB NOT NULL,
    "selectors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vacancy_hhId_key" ON "Vacancy"("hhId");

-- CreateIndex
CREATE INDEX "Vacancy_status_idx" ON "Vacancy"("status");

-- CreateIndex
CREATE INDEX "Vacancy_publishedAt_idx" ON "Vacancy"("publishedAt");

-- CreateIndex
CREATE INDEX "Vacancy_createdAt_idx" ON "Vacancy"("createdAt");

-- CreateIndex
CREATE INDEX "FilterConfig_isActive_idx" ON "FilterConfig"("isActive");

