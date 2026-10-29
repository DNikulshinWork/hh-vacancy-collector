'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, type Vacancy } from '@/lib/api';

export function VacancyList() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'publishedAt' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getVacancies({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        location: location || undefined,
        experience: experience || undefined,
      });
      setVacancies(res.vacancies || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить вакансии');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, location, experience]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatSalary = (v: Vacancy) => {
    if (!v.salaryMin && !v.salaryMax) return 'З/п не указана';
    const curr = v.currency ?? 'RUB';
    if (v.salaryMin && v.salaryMax) return `${v.salaryMin.toLocaleString('ru-RU')} – ${v.salaryMax.toLocaleString('ru-RU')} ${curr}`;
    if (v.salaryMin) return `от ${v.salaryMin.toLocaleString('ru-RU')} ${curr}`;
    return `до ${v.salaryMax?.toLocaleString('ru-RU')} ${curr}`;
  };

  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Поиск по должности
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Например: Frontend, Python, QA..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Локация
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                placeholder="Москва, Санкт-Петербург, Удаленно..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Опыт работы
            </label>
            <select
              value={experience}
              onChange={(e) => {
                setExperience(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Любой опыт</option>
              <option value="Нет опыта">Нет опыта</option>
              <option value="От 1 года до 3 лет">От 1 года до 3 лет</option>
              <option value="От 3 до 6 лет">От 3 до 6 лет</option>
              <option value="Более 6 лет">Более 6 лет</option>
            </select>
          </div>
        </div>

        {/* Sort and controls */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span className="font-medium">Сортировка:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "createdAt" | "publishedAt" | "title")}
              className="px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="createdAt">Дате добавления</option>
              <option value="publishedAt">Дате публикации на HH</option>
              <option value="title">Названию</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-1"
            >
              {sortOrder === 'asc' ? 'По возрастанию (↑)' : 'По убыванию (↓)'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Показывать:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-md border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>из {total} найдено</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0114 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-white rounded-xl border border-gray-200 animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Вакансий не найдено</h3>
          <p className="text-xs text-gray-500 mt-1">Попробуйте изменить поисковый запрос или фильтры</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="group p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={vacancy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition"
                    >
                      {vacancy.title}
                    </a>
                    <span className="text-xs text-gray-400 font-mono">hh.ru #{vacancy.hhId}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="font-semibold text-gray-800">{vacancy.company}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {vacancy.location || 'Город не указан'}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {vacancy.experience || 'Опыт не указан'}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="text-base font-bold text-emerald-600">
                    {formatSalary(vacancy)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Опубликована: {formatDate(vacancy.publishedAt)}
                  </div>
                </div>
              </div>

              {vacancy.description && (
                <div className="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  {vacancy.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Страница <span className="font-semibold text-gray-800">{page}</span> из{' '}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Назад
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
