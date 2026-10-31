#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker network inspect danggn-app >/dev/null 2>&1 || docker network create danggn-app >/dev/null

if docker container inspect danggn-api >/dev/null 2>&1; then
  docker rm -f danggn-api >/dev/null
fi
docker run -d --name danggn-api --network danggn-app --restart unless-stopped \
  --user "$(id -u):$(id -g)" \
  -v "$project_dir:/app" -w /app node:24-alpine node backend/server.mjs >/dev/null

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if docker exec danggn-api node -e "fetch('http://127.0.0.1:3001/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = 10 ]; then
    docker logs danggn-api --tail 30
    exit 1
  fi
  sleep 1
done

if docker container inspect danggn-next >/dev/null 2>&1; then
  docker rm -f danggn-next >/dev/null
fi
docker run -d --name danggn-next --network danggn-app --restart unless-stopped \
  --user "$(id -u):$(id -g)" \
  -p 0.0.0.0:8432:3000 -v "$project_dir:/app" -w /app \
  -e BACKEND_URL=http://danggn-api:3001 \
  node:20-trixie-slim npm run start -- -H 0.0.0.0 -p 3000 >/dev/null

for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if docker exec danggn-next node -e "fetch('http://127.0.0.1:3000/').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))" >/dev/null 2>&1; then
    break
  fi
  if [ "$attempt" = 10 ]; then
    docker logs danggn-next --tail 30
    exit 1
  fi
  sleep 1
done
echo '당근 웹·SQLite 백엔드가 8432 포트에서 실행 중입니다.'
