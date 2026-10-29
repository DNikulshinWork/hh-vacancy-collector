# Sprint 3 — Web UI (список, фильтры, статусы, экспорт)

## Цель спринта
Разработать Web UI для просмотра вакансий, управления фильтрами и экспорта данных.

## 1. Функционал

### Список вакансий
- Пагинация (page, limit)
- Сортировка (createdAt, publishedAt, title)
- Фильтры: search, location, experience
- Статусы сбора (pending, running, completed, failed)

### Фильтры поиска
- Создание/редактирование/удаление FilterConfig
- Предустановленные фильтры по умолчанию

### Статусы сбора
- Список ScrapeRun с датами, результатами
- Отдельная страница деталей для каждого запуска

### Экспорт данных
- Экспорт в CSV
- Экспорт в PDF

## 2. Структура UI

```
apps/web/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── vacancies/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── filters/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── scrape-runs/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── vacancy-list.tsx
│   │   ├── filter-form.tsx
│   │   ├── scrape-run-status.tsx
│   │   └── export-buttons.tsx
│   └── lib/
│       └── api.ts
```

## 3. API интеграция
- `/vacancies` — список вакансий с пагинацией и фильтрами
- `/filter-configs` — CRUD фильтров
- `/scrape-runs` — список и детали запусков
- `/scrape-runs/:id/export` — экспорт данных

## 4. Требования
- Responsive дизайн
- Пагинация и сортировка
- Фильтрация по тексту, локации, опыту
- Кнопки экспорта (CSV, PDF)
- Отображение статусов сбора
- Адаптивный UI для мобильных устройств