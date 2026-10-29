import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma, type Prisma, type Vacancy } from '@repo/db';
import { getScrapeRun } from '../../services/scrape-runs.js';

interface ExportParams {
  id: string;
}

interface ExportQuery {
  format?: 'csv' | 'pdf';
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportScrapeRunHandler(
  request: FastifyRequest<{ Params: ExportParams; Querystring: ExportQuery }>,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const { id } = request.params;
  const run = await getScrapeRun(id);

  if (!run) {
    return reply.code(404).send({ message: 'scrape run not found' });
  }

  const format = request.query.format === 'pdf' ? 'pdf' : 'csv';

  const filter = await prisma.filterConfig.findUnique({
    where: { id: run.filterConfigId },
  });

  const where: Prisma.VacancyWhereInput = {};
  if (filter?.query) {
    where.OR = [
      { title: { contains: filter.query, mode: 'insensitive' } },
      { description: { contains: filter.query, mode: 'insensitive' } },
    ];
  }
  if (filter?.location) {
    where.location = { contains: filter.location, mode: 'insensitive' };
  }

  const vacancies: Vacancy[] = await prisma.vacancy.findMany({
    where,
    take: 500,
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'csv') {
    const headers = [
      'ID',
      'HH_ID',
      'Title',
      'Company',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Location',
      'Experience',
      'URL',
      'Published At',
      'Created At',
    ];

    const rows = vacancies.map((v: Vacancy) => [
      escapeCsvField(v.id),
      escapeCsvField(v.hhId),
      escapeCsvField(v.title),
      escapeCsvField(v.company),
      escapeCsvField(v.salaryMin),
      escapeCsvField(v.salaryMax),
      escapeCsvField(v.currency),
      escapeCsvField(v.location),
      escapeCsvField(v.experience),
      escapeCsvField(v.url),
      escapeCsvField(v.publishedAt ? v.publishedAt.toISOString() : ''),
      escapeCsvField(v.createdAt ? v.createdAt.toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="scrape-run-${id}.csv"`)
      .send(csvContent);
  }

  const sanitizeText = (txt: string) => txt.replace(/[()\\]/g, ' ');
  const titleText = `HH Scrape Run Report: ${id.slice(0, 8)}`;
  const statusText = `Status: ${run.status} | Total Vacancies: ${vacancies.length}`;
  const dateText = `Generated: ${new Date().toISOString()}`;

  const vacancyLines = vacancies.slice(0, 25).map((v: Vacancy, i: number) => {
    const salary =
      v.salaryMin || v.salaryMax
        ? `${v.salaryMin ?? ''} - ${v.salaryMax ?? ''} ${v.currency ?? 'RUB'}`
        : 'Salary not specified';
    return `${i + 1}. ${sanitizeText(v.title.slice(0, 50))} - ${sanitizeText(v.company.slice(0, 30))} (${sanitizeText(salary)})`;
  });

  let streamContent = `BT /F1 14 Tf 50 780 Td (${sanitizeText(titleText)}) Tj ET\n`;
  streamContent += `BT /F1 10 Tf 50 760 Td (${sanitizeText(statusText)}) Tj ET\n`;
  streamContent += `BT /F1 10 Tf 50 745 Td (${sanitizeText(dateText)}) Tj ET\n`;

  let y = 720;
  for (const line of vacancyLines) {
    streamContent += `BT /F1 9 Tf 50 ${y} Td (${sanitizeText(line)}) Tj ET\n`;
    y -= 18;
  }

  const objects: string[] = [];
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj';
  objects[2] = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj';
  objects[3] =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj';
  objects[4] = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj';
  objects[5] = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`;

  let pdf = '%PDF-1.4\n';
  const xrefOffsets: number[] = [0];

  for (let i = 1; i <= 5; i++) {
    xrefOffsets[i] = pdf.length;
    pdf += `${objects[i]}\n`;
  }

  const startxref = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(xrefOffsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `attachment; filename="scrape-run-${id}.pdf"`)
    .send(Buffer.from(pdf, 'utf-8'));
}
