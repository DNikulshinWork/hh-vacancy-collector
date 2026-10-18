# Domain model — источник истины

> Все поля, enum'ы и правила ниже — часть контракта. Изменения только через новую версию этого файла.

## 1. Область

Домен описывает:
- Vacancy — собранная вакансия.
- FilterConfig — набор фильтров поиска (данные, не константы).
- ScraperConfig — параметры Playwright-скрейпера (селекторы, лимиты, обогащение).

Enum'ы и правила маппинга hh → домен — часть контракта.

## 2. Enum'ы

### 2.1. Employment
full | part | project | volunteer | probation

text
Полный набор hh.ru. В MVP фильтруется через FilterConfig.employment.

### 2.2. Schedule
fullDay | shift | flexible | remote | flyInFlyOut

text
Полный набор hh.ru.

### 2.3. Experience
noExperience | between1And3 | between3And6 | moreThan6

text
Источник — data-qa^="vacancy-serp__vacancy-work-experience-" в SERP.

### 2.4. VacancyStatus
new | viewed | exported | archived | skipped

text
Жизненный цикл: new (после сбора) → viewed / exported / archived / skipped (вручную или через PATCH).

### 2.5. OrderBy (в FilterConfig)
publication_time | relevance | salary_desc | salary_asc

text

## 3. Vacancy

| Поле | Тип | Nullable | Примечание |
|---|---|---|---|
| id | uuid | — | PK, внутренний |
| hhId | string | — | unique, дедуп-ключ (из URL /vacancy/<hhId>) |
| title | string | — | из SERP [data-qa="serp-item__title-text"] |
| company | string | — | из SERP [data-qa="vacancy-serp__vacancy-employer-text"] |
| url | string | — | канонический https://hh.ru/vacancy/<hhId> |
| salaryFrom | int | ✓ | парсится из [data-qa="vacancy-serp__vacancy-compensation"] |
| salaryTo | int | ✓ | там же |
| currency | string | ✓ | ISO 4217 (RUB, USD, EUR, …) |
| salaryTax | enum | ✓ | net | gross (на руки / до вычета) |
| employment | Employment | ✓ | в SERP не отдаётся; только из detail |
| schedule | Schedule | ✓ | из SERP remote-label + detail |
| experience | Experience | ✓ | из SERP |
| publishedAt | datetime | — | из SERP [data-qa="vacancy-serp__vacancy-date"] |
| descriptionMd | string | ✓ | Markdown, из detail [data-qa="vacancy-description"] |
| rawPayload | jsonb | — | { serpHtml: string, detailHtml?: string } |
| status | VacancyStatus | — | default new |
| createdAt | datetime | — | auto |
| updatedAt | datetime | — | auto |

Индексы:
- @@unique([hhId])
- @@index([status])
- @@index([publishedAt])
- @@index([createdAt])

Правила дедупа:
- primary — UNIQUE(hhId) в Postgres;
- fast-path — Redis SETNX hh:<hhId> (Sprint 2, не в Sprint 1);
- при конфликте по hhId — UPSERT с обновлением updatedAt, rawPayload, descriptionMd.

Правило обогащения (Sprint 2, фиксируется здесь):
- detail-запрос выполняется только если hhId отсутствует в БД ИЛИ descriptionMd IS NULL;
- уже сохранённые с descriptionMd не перезапрашиваются.

## 4. FilterConfig

Хранит наборы фильтров как данные. Несколько записей; ровно одна активна.

| Поле | Тип | Nullable | Примечание |
|---|---|---|---|
| id | uuid | — | PK |
| name | string | — | человекочитаемое имя |
| isActive | boolean | — | default false; ровно одна true |
| titleKeywordsInclude | string[] | — | default [] |
| descriptionKeywordsInclude | string[] | — | default [] |
| titleKeywordsExclude | string[] | — | default [] |
| descriptionKeywordsExclude | string[] | — | default [] |
| employment | Employment[] | — | default [] |
| schedule | Schedule[] | — | default [] |
| experience | Experience[] | — | default [] |
| area | int[] | — | hh area-id; [] = без ограничения |
| searchPeriodDays | int | — | 1..30 |
| orderBy | OrderBy | — | default publication_time |
| createdAt | datetime | — | auto |
| updatedAt | datetime | — | auto |

Индексы:
- @@index([isActive])

Инвариант: isActive=true — ровно одна запись. Обеспечивается use-case'ом в apps/api, не БД (partial unique index — отклонено для MVP, см. §8).

Baseline (сеется вручную через PUT /filters или seed-скрипт):
name = "default"
titleKeywordsInclude = ["fullstack", "full stack", "full-stack", "разработчик"]
descriptionKeywordsInclude = ["TypeScript", "React", "Node.js", "Next.js", "NestJS"]
titleKeywordsExclude = ["1С", "Битрикс", "WordPress", "Тильда", "тестировщик", "QA"]
descriptionKeywordsExclude = []
employment = ["full", "part", "project"]
schedule = ["remote"]
area = [1] # Москва
searchPeriodDays = 7
orderBy = "publication_time"
isActive = true

text

## 5. ScraperConfig

Singleton. Одна строка. При PUT /scraper-config — перезапись.

### 5.1. Поля конфигурации

| Поле | Тип | Nullable | Default | Примечание |
|---|---|---|---|---|
| id | uuid | — | — | PK |
| userAgent | string | — | фикс. UA | без ротации в MVP |
| headless | boolean | — | true | |
| userDataDir | string | — | ./.scraper-profile | persistent context |
| viewportWidth | int | — | 1920 | |
| viewportHeight | int | — | 1080 | |
| locale | string | — | ru-RU | |
| maxConcurrency | int | — | 1 | строго 1 в MVP |
| pageTimeoutMs | int | — | 30000 | |
| onCaptcha | enum | — | retryLater | pause | abort | retryLater |
| captchaRetryDelayMs | int | — | 900000 | 15 мин |
| proxyUrl | string | ✓ | null | в MVP null |
| proxyRotation | enum | ✓ | null | perRequest | perSession |
| createdAt | datetime | — | — | auto |
| updatedAt | datetime | — | — | auto |

### 5.2. rateLimit (jsonb)

```json
{
  "serpMaxRequests": 1,
  "serpWindowMs": 8000,
  "detailMaxRequests": 1,
  "detailWindowMs": 8000,
  "interPageDelayMsMin": 500,
  "interPageDelayMsMax": 1500
}
```
interPageDelayMsMin/Max — диапазон для рандомизации (фиксированное значение детектируется легче).

### 5.3. enrichment (jsonb)
```json
{
  "fetchDetail": true,
  "onlyForNewHhIds": true,
  "detailWaitTimeoutMs": 15000,
  "convertToMarkdown": true,
  "lazyScrollBeforeCollect": true
}
```

### 5.4. navigationRetry (jsonb)
```json
{
  "attempts": 3,
  "backoffMs": 5000
}
```

### 5.5. selectors (jsonb)
Формат: `{ "primary": string, "fallback"?: string }`.

SERP:

```json
{
  "resultsRoot":  { "primary": "[data-qa=\"vacancy-serp__results\"]",  "fallback": "ol[class*=\"vacancies-list\"]" },
  "cardRoot":     { "primary": "[data-qa=\"vacancy-serp__vacancy\"]",  "fallback": "article[class*=\"magritte-card\"]" },
  "titleLink":    { "primary": "a[data-qa=\"serp-item__title\"]",     "fallback": "a[class*=\"magritte-link\"]" },
  "titleText":    { "primary": "[data-qa=\"serp-item__title-text\"]", "fallback": "span[class*=\"magritte-text\"]" },
  "employerLink": { "primary": "[data-qa=\"vacancy-serp__vacancy-employer\"]" },
  "employerName": { "primary": "[data-qa=\"vacancy-serp__vacancy-employer-text\"]" },
  "address":      { "primary": "[data-qa=\"vacancy-serp__vacancy-address\"]", "fallback": "address[class*=\"address\"]" },
  "metro":        { "primary": "[data-qa=\"address-metro-station-name\"]",    "fallback": ".metro-station" },
  "experience":   { "primary": "[data-qa^=\"vacancy-serp__vacancy-work-experience-\"]", "fallback": "[data-qa*=\"work-experience\"]" },
  "remoteLabel":  { "primary": "[data-qa=\"vacancy-label-work-schedule-remote\"]" },
  "snippetResponsibility": { "primary": "[data-qa=\"vacancy-serp__vacancy_snippet_responsibility\"]" },
  "snippetRequirement":    { "primary": "[data-qa=\"vacancy-serp__vacancy_snippet_requirement\"]" },
  "ratingValue":  { "primary": "[data-qa=\"company-review-rating-value\"]" },
  "ratingReviewsCount": { "primary": "[data-qa=\"company-review-rating-reviews-count\"]" },
  "salary":       { "primary": "[data-qa=\"vacancy-serp__vacancy-compensation\"]", "fallback": "[class*=\"compensation-labels\"]" },
  "publishedAt":  { "primary": "[data-qa=\"vacancy-serp__vacancy-date\"]" }
}
```

Detail:

```json
{
  "detailTitle":       { "primary": "[data-qa=\"vacancy-title\"]" },
  "detailCompany":     { "primary": "[data-qa=\"vacancy-company-name\"]" },
  "detailDescription": { "primary": "[data-qa=\"vacancy-description\"]" }
}
```

Правило: классы — только как fallback ([class*="..."]), потому что hh использует CSS Modules с хешами. data-qa — primary, стабильнее.

## 6. Правила маппинга hh → домен
### 6.1. hhId
Regex по href карточки: `/vacancy/(\d+)` — группа 1.

### 6.2. url
Канонический: `https://hh.ru/vacancy/<hhId>`. Query-параметры отбрасываются (`split('?')[0]`).

### 6.3. salaryFrom / salaryTo / currency / salaryTax
Источник — строка из `[data-qa="vacancy-serp__vacancy-compensation"]`:

"170 000 ₽ за месяц, на руки" → `{ salaryFrom: 170000, salaryTo: 170000, currency: "RUB", salaryTax: "net" }`

"100 000 – 200 000 ₽ за месяц, на руки" → `{ salaryFrom: 100000, salaryTo: 200000, currency: "RUB", salaryTax: "net" }`

"от 100 000 ₽ за услугу, до вычета налогов" → `{ salaryFrom: 100000, salaryTo: null, currency: "RUB", salaryTax: "gross" }`

"до 480 000 ₽ за месяц, на руки" → `{ salaryFrom: null, salaryTo: 480000, currency: "RUB", salaryTax: "net" }`

"Зарплата не указана" → все поля null.

Регулярки — часть домена; реализуются в `apps/worker/src/features/collect-run/` (Sprint 2). Схема полей — часть контракта.

### 6.4. experience
Текст из `[data-qa^="vacancy-serp__vacancy-work-experience-"]`:

"Опыт: 1-3 года" → between1And3

"Опыт: 3-6 лет" → between3And6

"Опыт: более 6 лет" → moreThan6

"Опыт: не имеет значения" → noExperience

### 6.5. schedule
remoteLabel присутствует → remote — гарантированно.

Полный набор Schedule — только из detail (Sprint 2).

### 6.6. employment
В SERP hh не отдаёт. Только из detail (Sprint 2).

### 6.7. publishedAt
Из `[data-qa="vacancy-serp__vacancy-date"]`; парсинг относительных («сегодня», «вчера», «3 дня назад») и абсолютных дат. Точные правила — в Sprint 2, поля контракта фиксированы здесь.

### 6.8. data-grade (middle/senior)
Не добавляется. hh.ru такого поля не отдаёт. Если в будущем понадобится — отдельная фича с новой спекой.

## 7. Правила фильтрации (будущая логика, не в Sprint 1)
Фильтр применяется к вакансии, если:

title матчит любой из titleKeywordsInclude (case-insensitive, подстрокой) или descriptionMd матчит любой из descriptionKeywordsInclude;

title/descriptionMd не матчит ни один из titleKeywordsExclude / descriptionKeywordsExclude;

employment ∈ FilterConfig.employment (если массив непуст);

schedule ∈ FilterConfig.schedule (если массив непуст);

experience ∈ FilterConfig.experience (если массив непуст);

area ∈ FilterConfig.area (если массив непуст);

publishedAt >= now() - searchPeriodDays * 24h.

Реализация — Sprint 2. Схема полей — контракт этого спринта.

## 8. Отклонённые решения
Partial unique index на isActive. Возможен в Postgres (CREATE UNIQUE INDEX ... WHERE is_active), но не выражается в Prisma schema без raw-миграции. Для MVP — инвариант через use-case в приложении. Отложено.

Cursor-based пагинация. Для MVP — offset/limit. Cursor — при росте объёма.

data-grade. Не добавляем (см. §6.8).
