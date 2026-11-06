#!/usr/bin/env bash
# Генерация .htpasswd для basic-auth на /metrics (Sprint 5).
#
# Креды берутся ТОЛЬКО из env: $METRICS_USER и $METRICS_PASSWORD.
# Файл кладётся в infrastructure/nginx/htpasswd/metrics (каталог в .gitignore)
# и монтируется в nginx как /etc/nginx/htpasswd/metrics.
#
# Использование:
#   METRICS_USER=prometheus METRICS_PASSWORD='...' ./scripts/gen-htpasswd.sh
#
# Опционально: HTPASSWD_FILE — путь к файлу (по умолчанию infra-путь выше).
set -euo pipefail

if [[ -z "${METRICS_USER:-}" || -z "${METRICS_PASSWORD:-}" ]]; then
  echo "error: METRICS_USER и METRICS_PASSWORD должны быть заданы через env" >&2
  exit 1
fi

# Перевод строки в пароле породил бы несколько строк в .htpasswd (файл битый).
if [[ "$METRICS_PASSWORD" == *$'\n'* ]]; then
  echo "error: METRICS_PASSWORD не должен содержать перевод строки" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
target="${HTPASSWD_FILE:-$repo_root/infrastructure/nginx/htpasswd/metrics}"

mkdir -p "$(dirname "$target")"

if command -v htpasswd >/dev/null 2>&1; then
  # -i: читать пароль из stdin, -B: bcrypt
  printf '%s\n' "$METRICS_PASSWORD" | htpasswd -i -B -c "$target" "$METRICS_USER"
elif command -v openssl >/dev/null 2>&1; then
  # apr1-md5: поддерживается nginx без доп. модулей.
  # -stdin: пароль читается из stdin, а не из argv (не светится в ps).
  hash="$(printf '%s\n' "$METRICS_PASSWORD" | openssl passwd -apr1 -stdin)"
  printf '%s:%s\n' "$METRICS_USER" "$hash" >"$target"
else
  echo "error: нужен htpasswd (apache2-utils) или openssl" >&2
  exit 1
fi

chmod 640 "$target"
echo "written: $target (user: $METRICS_USER)"
