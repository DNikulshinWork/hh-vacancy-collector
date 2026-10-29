import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <h2 className="text-3xl font-black text-gray-900">404 — Страница не найдена</h2>
      <p className="text-sm text-gray-600">Запрашиваемый раздел или ресурс не существует</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
      >
        Вернуться на дашборд
      </Link>
    </div>
  );
}
