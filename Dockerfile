FROM oven/bun:1 AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    FRONTEND_DIST=/app/frontend/dist
COPY backend/pyproject.toml /app/pyproject.toml
COPY backend/app /app/app
COPY --from=frontend /frontend/dist /app/frontend/dist
RUN pip install --no-cache-dir . \
    && useradd --uid 65532 --create-home --home-dir /nonexistent --shell /usr/sbin/nologin appuser
USER 65532
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
