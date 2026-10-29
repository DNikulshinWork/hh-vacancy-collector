import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'hh-vacancy-collector — Панель управления',
  description: 'Сбор вакансий с hh.ru, управление фильтрами и экспорт данных',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans antialiased">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                  HH
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-gray-900 leading-none">
                    Vacancy Collector
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">Playwright & BullMQ</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  Дашборд
                </Link>
                <Link
                  href="/vacancies"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  Вакансии
                </Link>
                <Link
                  href="/filters"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  Фильтры поиска
                </Link>
                <Link
                  href="/scrape-runs"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition"
                >
                  Запуски сбора
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                API v1 Active
              </span>
            </div>
          </div>

          {/* Mobile subnav */}
          <div className="md:hidden flex items-center justify-around border-t border-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-600">
            <Link href="/dashboard" className="px-2 py-1 hover:text-blue-600">Дашборд</Link>
            <Link href="/vacancies" className="px-2 py-1 hover:text-blue-600">Вакансии</Link>
            <Link href="/filters" className="px-2 py-1 hover:text-blue-600">Фильтры</Link>
            <Link href="/scrape-runs" className="px-2 py-1 hover:text-blue-600">Запуски</Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <div>© 2026 hh-vacancy-collector — Sprint 3 Web UI</div>
            <div className="font-mono text-gray-400">Fastify + Next.js + Playwright</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
