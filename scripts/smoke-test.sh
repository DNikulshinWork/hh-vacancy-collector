#!/usr/bin/env bash
set -euo pipefail

# Smoke Test Suite for hh-vacancy-collector deployment
# Usage: ./scripts/smoke-test.sh [API_URL] [WEB_URL] [WORKER_URL]
# Example: ./scripts/smoke-test.sh http://localhost:3001 http://localhost:3000 http://localhost:3002

API_URL="${1:-http://localhost:3001}"
WEB_URL="${2:-http://localhost:3000}"
WORKER_URL="${3:-http://localhost:3002}"

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FAILED=0

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  FAILED=1
}

echo "=========================================="
echo " Starting Smoke Tests"
echo " API:    $API_URL"
echo " WEB:    $WEB_URL"
echo " WORKER: $WORKER_URL"
echo "=========================================="

# Test 1: API Health check (database + redis)
log_info "Testing API health endpoint: $API_URL/health"
HTTP_CODE=$(curl -s -o /tmp/api_health.json -w "%{http_code}" "$API_URL/health" || echo "000")
if [ "$HTTP_CODE" -eq 200 ]; then
  log_pass "API Health HTTP 200 OK"
  cat /tmp/api_health.json | grep -q '"status":"ok"' && log_pass "API reported status: ok" || log_fail "API status is not ok"
else
  log_fail "API Health returned HTTP $HTTP_CODE"
fi

# Test 2: API Vacancies list endpoint (Database query)
log_info "Testing API vacancies endpoint: $API_URL/vacancies"
HTTP_CODE=$(curl -s -o /tmp/api_vacancies.json -w "%{http_code}" "$API_URL/vacancies?limit=5" || echo "000")
if [ "$HTTP_CODE" -eq 200 ]; then
  cat /tmp/api_vacancies.json | grep -q '"vacancies"' && log_pass "API Vacancies query passed" || log_fail "Response missing vacancies array"
else
  log_fail "API Vacancies returned HTTP $HTTP_CODE"
fi

# Test 3: API Scrape Runs endpoint (Queue & DB)
log_info "Testing API scrape-runs endpoint: $API_URL/scrape-runs"
HTTP_CODE=$(curl -s -o /tmp/api_scrape_runs.json -w "%{http_code}" "$API_URL/scrape-runs" || echo "000")
if [ "$HTTP_CODE" -eq 200 ]; then
  cat /tmp/api_scrape_runs.json | grep -q '"runs"' && log_pass "API Scrape-Runs query passed" || log_fail "Response missing runs array"
else
  log_fail "API Scrape-Runs returned HTTP $HTTP_CODE"
fi

# Test 4: Web UI Health check
log_info "Testing Web UI health endpoint: $WEB_URL/health"
HTTP_CODE=$(curl -s -o /tmp/web_health.json -w "%{http_code}" "$WEB_URL/health" || echo "000")
if [ "$HTTP_CODE" -eq 200 ]; then
  cat /tmp/web_health.json | grep -q '"service":"web"' && log_pass "Web UI Health HTTP 200 OK" || log_fail "Web UI health body mismatch"
else
  log_fail "Web UI Health returned HTTP $HTTP_CODE"
fi

# Test 5: Worker Health check (if available)
if curl -s -m 2 "$WORKER_URL/health" >/dev/null 2>&1; then
  log_info "Testing Worker health endpoint: $WORKER_URL/health"
  HTTP_CODE=$(curl -s -o /tmp/worker_health.json -w "%{http_code}" "$WORKER_URL/health")
  if [ "$HTTP_CODE" -eq 200 ]; then
    cat /tmp/worker_health.json | grep -q '"service":"worker"' && log_pass "Worker Health HTTP 200 OK" || log_fail "Worker health mismatch"
  else
    log_fail "Worker Health returned HTTP $HTTP_CODE"
  fi
else
  log_info "Worker HTTP health port not directly exposed outside docker network (skipped)"
fi

echo "=========================================="
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}ALL SMOKE TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}SOME SMOKE TESTS FAILED!${NC}"
  exit 1
fi
