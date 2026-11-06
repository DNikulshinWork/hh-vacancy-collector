import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Признак корня монорепо — pnpm-workspace.yaml. */
const ROOT_MARKER = 'pnpm-workspace.yaml';

/**
 * Корень монорепо: поднимаемся от каталога модуля вверх до pnpm-workspace.yaml.
 * Так не зависит от глубины (src/ или dist/), где оказался скомпилированный файл.
 */
function findRepoRoot(startDir: string): string {
  let dir = startDir;

  for (;;) {
    if (existsSync(path.join(dir, ROOT_MARKER))) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Не найден корень монорепо (${ROOT_MARKER}) выше ${startDir}`);
    }
    dir = parent;
  }
}

export const repoRoot = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
