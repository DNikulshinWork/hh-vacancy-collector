'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, type ScrapeRun } from '@/lib/api';
import { ScrapeRunStatus } from '@/components/scrape-run-status';
import { ExportButtons } from '@/components/export-buttons';

export default function ScrapeRunsPage() {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getScrapeRuns(page, limit);
      setRuns(res.runs || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить запуски сбора');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">История запусков сбора</h1>
          <p className="text-xs text-gray-500 mt-1">
            Мониторинг исполнения задач парсинга, статус очередей BullMQ и выгрузка результатов
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить
          </button>
          <Link
            href="/filters"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            + Запустить сбор
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Table of Runs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">ID запуска</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3">Собрано</th>
                <th className="px-5 py-3">Создан</th>
                <th className="px-5 py-3">Завершен</th>
                <th className="px-5 py-3 text-right">Экспорт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Загрузка истории...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Запусков еще нет. Перейдите в раздел &quot;Фильтры поиска&quot;, чтобы начать первый сбор.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 font-mono">
                      <Link
                        href={`/scrape-runs/${run.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {run.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <ScrapeRunStatus status={run.status} />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {run.resultCount} вакансий
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDateTime(run.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDateTime(run.finishedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex justify-end">
                        <ExportButtons scrapeRunId={run.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Всего запусков: <span className="font-semibold text-gray-800">{total}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Назад
              </button>
              <span>{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
