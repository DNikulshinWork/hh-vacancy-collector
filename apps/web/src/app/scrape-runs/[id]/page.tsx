'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api, type ScrapeRun } from '@/lib/api';
import { ScrapeRunStatus } from '@/components/scrape-run-status';
import { ExportButtons } from '@/components/export-buttons';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ScrapeRunDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [run, setRun] = useState<ScrapeRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRun() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getScrapeRun(id);
        setRun(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные запуска');
      } finally {
        setLoading(false);
      }
    }
    fetchRun();
  }, [id]);

  const formatDateTime = (dateVal: string | Date | null) => {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/scrape-runs" className="hover:text-blue-600 transition">← Назад к списку запусков</Link>
        <span>/</span>
        <span className="font-mono text-gray-700">#{id.slice(0, 8)}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Детали запуска
            {run && <ScrapeRunStatus status={run.status} />}
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">ID: {id}</p>
        </div>

        {run && <ExportButtons scrapeRunId={id} />}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-xs text-gray-400 animate-pulse">
          Загрузка деталей задачи...
        </div>
      ) : !run ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-xs text-gray-500">
          Запуск не найден
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100 text-xs">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Статус выполнения:</span>
              <div className="sm:col-span-2">
                <ScrapeRunStatus status={run.status} />
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Количество собранных вакансий:</span>
              <span className="sm:col-span-2 font-bold text-gray-900 text-sm">{run.resultCount} шт.</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Время создания:</span>
              <span className="sm:col-span-2 text-gray-800">{formatDateTime(run.createdAt)}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Время старта скрейпера:</span>
              <span className="sm:col-span-2 text-gray-800">{formatDateTime(run.startedAt)}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Время завершения:</span>
              <span className="sm:col-span-2 text-gray-800">{formatDateTime(run.finishedAt)}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Filter Config ID:</span>
              <span className="sm:col-span-2 font-mono text-gray-700">{run.filterConfigId}</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="font-semibold text-gray-500">Scraper Config ID:</span>
              <span className="sm:col-span-2 font-mono text-gray-700">{run.scraperConfigId}</span>
            </div>

            {run.error && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-rose-50/50">
                <span className="font-semibold text-rose-700">Текст ошибки:</span>
                <span className="sm:col-span-2 font-mono text-rose-800 break-words">{run.error}</span>
              </div>
            )}
          </div>

          {/* Action Callouts */}
          <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-blue-950">Экспорт результатов сбора</h4>
              <p className="text-xs text-blue-800/80 mt-0.5">
                Выгрузите найденные вакансии в структурированном виде в формате таблицы CSV или документе PDF
              </p>
            </div>
            <ExportButtons scrapeRunId={run.id} />
          </div>
        </div>
      )}
    </div>
  );
}
