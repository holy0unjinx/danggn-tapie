# 당근 테이피 과제 제출

## 사용법

```bash
docker run --rm -it --name danggn-dev -p 8434:8434 -v "$PWD:/app" -w /app --user "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/npm-cache node:24-bookworm-slim sh -c 'npm ci || exit; node backend/server.mjs & api=$!; trap "kill $api 2>/dev/null" EXIT; BACKEND_URL=http://127.0.0.1:3001 ./node_modules/.bin/next dev --hostname 0.0.0.0 --port 8434'
```
