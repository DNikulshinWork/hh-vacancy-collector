'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface ExportButtonsProps {
  scrapeRunId: string;
}

export function ExportButtons({ scrapeRunId }: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);

  const handleDownload = async (format: 'csv' | 'pdf') => {
    try {
      setDownloading(format);
      const url = api.getExportUrl(scrapeRunId, format);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Export failed with status: ${res.status}`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `scrape-run-${scrapeRunId.slice(0, 8)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDownload('csv')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {downloading === 'csv' ? 'Скачивание...' : 'CSV'}
      </button>

      <button
        onClick={() => handleDownload('pdf')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
      >
        <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {downloading === 'pdf' ? 'Скачивание...' : 'PDF'}
      </button>
    </div>
  );
}
