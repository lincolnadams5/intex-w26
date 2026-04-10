FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy pipeline source and pre-trained artifacts
COPY src/ ./src/
COPY api/ ./api/
COPY artifacts/ ./artifacts/

EXPOSE 8001

CMD uvicorn api.score_post:app --host 0.0.0.0 --port ${PORT:-8001}
