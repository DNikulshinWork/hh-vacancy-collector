'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, type ScrapeRun, type FilterConfig, type Vacancy } from '@/lib/api';
import { ScrapeRunStatus } from '@/components/scrape-run-status';
import { ExportButtons } from '@/components/export-buttons';

export default function DashboardPage() {
  const [vacanciesTotal, setVacanciesTotal] = useState(0);
  const [recentVacancies, setRecentVacancies] = useState<Vacancy[]>([]);
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>([]);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [vacRes, filtRes, runsRes] = await Promise.all([
          api.getVacancies({ page: 1, limit: 5 }),
          api.getFilterConfigs(),
          api.getScrapeRuns(1, 5),
        ]);
        setVacanciesTotal(vacRes.pagination.total);
        setRecentVacancies(vacRes.vacancies);
        setFilterConfigs(filtRes.filterConfigs);
        setRecentRuns(runsRes.runs);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки дашборда');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const completedRuns = recentRuns.filter((r) => r.status === 'completed').length;
  const activeFilters = filterConfigs.filter((f) => f.active).length;

  return (
    <div className="space-y-8">
      {/* Title & description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Дашборд сбора вакансий</h1>
          <p className="text-xs text-gray-500 mt-1">
            Мониторинг парсинга hh.ru, управление активными фильтрами и экспорт отчетов
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/filters"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            + Новый фильтр
          </Link>
          <Link
            href="/vacancies"
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
          >
            К вакансиям →
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Всего вакансий в БД</span>
          <div className="text-3xl font-extrabold text-gray-900">
            {loading ? '—' : vacanciesTotal.toLocaleString('ru-RU')}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">С дедупликацией по hhId</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Активных фильтров</span>
          <div className="text-3xl font-extrabold text-blue-600">
            {loading ? '—' : activeFilters}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">из {filterConfigs.length} сохраненных</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Запусков скрейпера</span>
          <div className="text-3xl font-extrabold text-purple-600">
            {loading ? '—' : recentRuns.length}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">{completedRuns} успешно завершено</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Экспорт данных</span>
          <div className="text-sm font-bold text-gray-800 pt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono">CSV</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-mono">PDF</span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Доступен по каждому запуску</span>
        </div>
      </div>

      {/* Grid: Recent Runs & Recent Vacancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Runs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Последние запуски сбора</h3>
            <Link href="/scrape-runs" className="text-xs font-semibold text-blue-600 hover:underline">
              Все запуски →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {loading ? (
              <div className="p-6 text-xs text-gray-400 text-center animate-pulse">Загрузка...</div>
            ) : recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">Запусков сбора еще не производилось</div>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/scrape-runs/${run.id}`} className="font-mono font-bold text-gray-900 hover:text-blue-600">
                        #{run.id.slice(0, 8)}
                      </Link>
                      <ScrapeRunStatus status={run.status} />
                    </div>
                    <div className="text-gray-500 text-[11px]">
                      Собрано: <span className="font-semibold text-gray-800">{run.resultCount} вакансий</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ExportButtons scrapeRunId={run.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Vacancies */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Свежие вакансии</h3>
            <Link href="/vacancies" className="text-xs font-semibold text-blue-600 hover:underline">
              Все вакансии →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {loading ? (
              <div className="p-6 text-xs text-gray-400 text-center animate-pulse">Загрузка...</div>
            ) : recentVacancies.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">Вакансий еще нет в базе</div>
            ) : (
              recentVacancies.map((v) => (
                <div key={v.id} className="p-4 hover:bg-gray-50 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-gray-900 hover:text-blue-600 truncate max-w-[280px]"
                    >
                      {v.title}
                    </a>
                    <span className="font-semibold text-emerald-600 shrink-0">
                      {v.salaryMin || v.salaryMax
                        ? `${v.salaryMin ?? ''} – ${v.salaryMax ?? ''} ${v.currency ?? 'RUB'}`
                        : 'З/п не указана'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                    <span className="font-medium text-gray-700">{v.company}</span>
                    <span>•</span>
                    <span>{v.location || 'Город не указан'}</span>
                    <span>•</span>
                    <span>{v.experience || 'Опыт не указан'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
