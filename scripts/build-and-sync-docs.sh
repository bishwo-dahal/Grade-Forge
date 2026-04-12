#!/usr/bin/env bash
# Build VitePress (docs-site) and copy output into the Spring Boot static tree so
# `mvn spring-boot:run` or a repackaged JAR serves /docs/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCS_SITE="${REPO_ROOT}/docs-site"
DIST="${DOCS_SITE}/.vitepress/dist"
TARGET="${REPO_ROOT}/Server/src/main/resources/static/docs"

if [[ ! -d "${DOCS_SITE}" ]]; then
  echo "error: docs-site not found at ${DOCS_SITE}" >&2
  exit 1
fi

cd "${DOCS_SITE}"

if [[ ! -d node_modules ]]; then
  echo "Installing docs dependencies (first run)…"
  npm install
fi

echo "Building VitePress…"
npm run docs:build

if [[ ! -d "${DIST}" ]] || [[ ! -f "${DIST}/index.html" ]]; then
  echo "error: build output missing or incomplete at ${DIST}" >&2
  exit 1
fi

echo "Syncing to ${TARGET}…"
rm -rf "${TARGET}"
mkdir -p "${TARGET}"
cp -a "${DIST}/." "${TARGET}/"

echo "Done. Restart or run the Spring app; open http://localhost:8080/docs/"
