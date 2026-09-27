import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'hh-vacancy-collector',
  description: 'Vacancy collector for hh.ru',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
