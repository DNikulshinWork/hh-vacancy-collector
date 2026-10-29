import { parse } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { extractHhId, parseSalary, type ParsedVacancy } from './normalize.js';
import type { ScraperSelectors } from './selectors.js';

type NodeT = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

function isElement(node: NodeT | undefined): node is Element {
  return !!node && 'tagName' in node && node.tagName !== '#text' && node.tagName !== '#comment';
}

function isText(node: NodeT): boolean {
  return 'value' in node && typeof (node as { value?: unknown }).value === 'string';
}

function children(node: NodeT): NodeT[] {
  return ('childNodes' in node ? node.childNodes : []) as NodeT[];
}

function textContent(node: NodeT): string {
  let out = '';
  for (const child of children(node)) {
    if (isText(child)) {
      out += (child as { value?: string }).value ?? '';
    } else if (isElement(child)) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') continue;
      out += textContent(child);
    }
  }
  return out;
}

function attr(node: Element, name: string): string | null {
  const a = (node.attrs ?? []).find((x) => x.name === name);
  return a ? a.value : null;
}

/** Селектор вида tag[attr='value'] или [attr='value'] с частичным совпадением значения. */
function matches(node: Element, selector: string): boolean {
  const m = selector.match(/^([a-zA-Z][\w-]*)?(?:\[([\w-]+)(?:='([^']+)'|="([^"]+)")?\])?$/);
  if (!m) return node.tagName.toLowerCase() === selector.toLowerCase();
  const [, tag, attrName, v1, v2] = m;
  if (tag && node.tagName.toLowerCase() !== tag) return false;
  if (!attrName) return true;
  const value = attr(node, attrName);
  if (value === null) return false;
  const expected = v1 ?? v2;
  // точное совпадение значения атрибута (как CSS [attr='value']),
  // чтобы селектор карточки не задевал вложенные data-qa-суффиксы
  return expected === undefined ? true : value === expected;
}

export function querySelector(node: NodeT, selector: string): Element | null {
  for (const child of children(node)) {
    if (isElement(child) && matches(child, selector)) return child;
    const found = querySelector(child, selector);
    if (found) return found;
  }
  return null;
}

export function querySelectorAll(node: NodeT, selector: string): Element[] {
  const out: Element[] = [];
  const walk = (n: NodeT): void => {
    for (const child of children(n)) {
      if (isElement(child)) {
        if (matches(child, selector)) out.push(child);
        walk(child);
      }
    }
  };
  walk(node);
  return out;
}

export function parseVacanciesHtml(html: string, selectors: ScraperSelectors): ParsedVacancy[] {
  const document = parse(html);
  const cards = querySelectorAll(document as NodeT, selectors.vacancyCard);

  const vacancies: ParsedVacancy[] = [];

  for (const card of cards) {
    const linkEl = querySelector(card, selectors.link);
    const url = linkEl ? (attr(linkEl, 'href') ?? '') : '';
    const hhId = extractHhId(url);
    if (!hhId) continue;

    const title = querySelector(card, selectors.title);
    const company = querySelector(card, selectors.company);
    const salaryEl = selectors.salary ? querySelector(card, selectors.salary) : null;
    const locationEl = selectors.location ? querySelector(card, selectors.location) : null;
    const experienceEl = selectors.experience ? querySelector(card, selectors.experience) : null;

    const salaryText = salaryEl ? textContent(salaryEl).trim() : null;
    const salary = parseSalary(salaryText);

    const companyName = company ? textContent(company).trim() : '';
    const titleText = title ? textContent(title).trim() : '';
    const location = locationEl ? textContent(locationEl).trim() : '';

    vacancies.push({
      hhId,
      title: titleText || 'untitled',
      company: companyName,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      currency: salary.currency,
      location,
      experience: experienceEl ? textContent(experienceEl).trim() : '',
      description: '',
      url,
      publishedAt: new Date().toISOString(),
      rawPayload: {
        title: titleText || 'untitled',
        company: companyName,
        salary: salaryText,
        location,
        experience: experienceEl ? textContent(experienceEl).trim() : '',
        url,
      },
    });
  }

  return vacancies;
}