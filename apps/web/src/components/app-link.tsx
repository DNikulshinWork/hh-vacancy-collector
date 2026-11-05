'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { p } from '@/lib/base-path';

/**
 * Ссылка на внутреннюю страницу приложения с учётом публичного префикса прокси.
 * Используется обычный <a>: Next <Link> делает client-side навигацию по пути,
 * который без basePath не существует, поэтому для прокси надёжнее полная
 * навигация через префикс (прокси срезает его и отдаёт маршрут на корне бэкенда).
 */
export function AppLink({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={p(href)} {...rest}>
      {children}
    </a>
  );
}