'use client';

import { useEffect } from 'react';
import { p } from '@/lib/base-path';

export default function RootPage() {
  useEffect(() => {
    // Полный переход через прокси (не router.replace: без basePath роутер
    // не знает про префикс и отдал бы 404 при client-side навигации).
    window.location.assign(p('/dashboard'));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-xs text-gray-500 animate-pulse font-medium">
        Загрузка приложения...
      </div>
    </div>
  );
}
