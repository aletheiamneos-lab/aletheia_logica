FROM mcr.microsoft.com/playwright/python:v1.55.0-noble

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN python -m pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend

EXPOSE 10000

CMD ["bash", "-lc", "python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-10000}"]
