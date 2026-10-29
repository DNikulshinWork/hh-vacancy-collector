'use client';

import { VacancyList } from '@/components/vacancy-list';

export default function VacanciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Каталог вакансий</h1>
        <p className="text-xs text-gray-500 mt-1">
          Просмотр собранных вакансий с платформы hh.ru с поддержкой поиска, фильтрации и пагинации
        </p>
      </div>

      <VacancyList />
    </div>
  );
}
