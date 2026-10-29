'use client';

import { FilterForm } from '@/components/filter-form';

export default function FiltersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Поисковые фильтры</h1>
        <p className="text-xs text-gray-500 mt-1">
          Создание, редактирование и запуск автоматического сбора вакансий по сохраненным критериям
        </p>
      </div>

      <FilterForm />
    </div>
  );
}
