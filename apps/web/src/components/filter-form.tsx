'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, type FilterConfig, type ScraperConfig } from '@/lib/api';

export function FilterForm() {
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>([]);
  const [scraperConfigs, setScraperConfigs] = useState<ScraperConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [active, setActive] = useState(true);

  // Trigger scrape modal state
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);
  const [selectedScraperId, setSelectedScraperId] = useState<string>('');
  const [triggering, setTriggering] = useState(false);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fRes, sRes] = await Promise.all([
        api.getFilterConfigs(),
        api.getScraperConfigs().catch(() => ({ scraperConfigs: [] })),
      ]);
      setFilterConfigs(fRes.filterConfigs || []);
      setScraperConfigs(sRes.scraperConfigs || []);
      if (sRes.scraperConfigs && sRes.scraperConfigs.length > 0 && sRes.scraperConfigs[0] && !selectedScraperId) {
        setSelectedScraperId(sRes.scraperConfigs[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке фильтров');
    } finally {
      setLoading(false);
    }
  }, [selectedScraperId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setQuery('');
    setLocation('');
    setExperience('');
    setSalaryMin('');
    setSalaryMax('');
    setActive(true);
  };

  const handleEdit = (item: FilterConfig) => {
    setEditingId(item.id);
    setName(item.name);
    setQuery(item.query);
    setLocation(item.location || '');
    setExperience(item.experience || '');
    setSalaryMin(item.salaryMin ? String(item.salaryMin) : '');
    setSalaryMax(item.salaryMax ? String(item.salaryMax) : '');
    setActive(item.active);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        name,
        query,
        location: location.trim() || null,
        experience: experience.trim() || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        active,
      };

      if (editingId) {
        await api.updateFilterConfig(editingId, payload);
      } else {
        await api.createFilterConfig(payload);
      }
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить фильтр');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот фильтр?')) return;
    try {
      setError(null);
      await api.deleteFilterConfig(id);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить фильтр');
    }
  };

  const openTriggerModal = (filterId: string) => {
    setSelectedFilterId(filterId);
    setTriggerSuccess(null);
    setTriggerModalOpen(true);
  };

  const handleStartScrape = async () => {
    if (!selectedFilterId) return;
    try {
      setTriggering(true);
      const scraperId = selectedScraperId || (scraperConfigs[0]?.id ?? '');
      if (!scraperId) throw new Error('Нет доступных ScraperConfig');

      const res = await api.createScrapeRun(selectedFilterId, scraperId);
      setTriggerSuccess(`Запуск создан (ID: ${res.id.slice(0, 8)})`);
      setTimeout(() => {
        setTriggerModalOpen(false);
        setTriggerSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка запуска сбора');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Filter Form Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          {editingId ? 'Редактировать фильтр' : 'Добавить новый поисковый фильтр'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Название фильтра *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Senior Frontend React"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Поисковый запрос (HH.ru query) *
              </label>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="React TypeScript Next.js"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Локация (город)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Москва / Санкт-Петербург"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Опыт работы
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не имеет значения</option>
                <option value="Нет опыта">Нет опыта</option>
                <option value="От 1 года до 3 лет">От 1 года до 3 лет</option>
                <option value="От 3 до 6 лет">От 3 до 6 лет</option>
                <option value="Более 6 лет">Более 6 лет</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Мин. зарплата (руб)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Макс. зарплата (руб)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="300000"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="activeCheckbox" className="text-xs font-medium text-gray-700">
              Активный фильтр (доступен для регулярного запуска)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              {editingId ? 'Сохранить изменения' : 'Создать фильтр'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Список сохраненных фильтров</h3>
          <span className="text-xs text-gray-500">{filterConfigs.length} фильтров</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Загрузка...</div>
        ) : filterConfigs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Нет сохраненных фильтров. Создайте первый выше.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filterConfigs.map((item) => (
              <div key={item.id} className="p-5 hover:bg-gray-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.active ? 'Активен' : 'Отключен'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-mono">
                    Запрос: &quot;{item.query}&quot;
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {item.location && <span>Локация: {item.location}</span>}
                    {item.experience && <span>Опыт: {item.experience}</span>}
                    {(item.salaryMin || item.salaryMax) && (
                      <span>
                        Зарплата: {item.salaryMin ? `от ${item.salaryMin}` : ''} {item.salaryMax ? `до ${item.salaryMax}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openTriggerModal(item.id)}
                    className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0114 0z" />
                    </svg>
                    Запустить сбор
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Scrape Run Modal */}
      {triggerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <h4 className="text-base font-bold text-gray-900">Запуск задачи сбора вакансий</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Задача будет поставлена в очередь BullMQ. Playwright запустит браузер и соберет вакансии с hh.ru согласно заданному фильтру.
            </p>

            {scraperConfigs.length > 0 ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Конфигурация скрейпера
                </label>
                <select
                  value={selectedScraperId}
                  onChange={(e) => setSelectedScraperId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white"
                >
                  {scraperConfigs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (лимит: {s.paginationLimits?.maxPages ?? 5} стр.)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Будет использована конфигурация по умолчанию.</p>
            )}

            {triggerSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold">
                ✓ {triggerSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTriggerModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleStartScrape}
                disabled={triggering}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {triggering ? 'Создание...' : 'Подтвердить запуск'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
