# FINFLOW — Fintech Platform

Three microservices on a single deployable platform with local storage.

## Services

| Service | Port | Description |
|---------|------|-------------|
| KYC Service | 8001 | Document upload, OCR (Tesseract), face verification (DeepFace) |
| Credit Score | 8002 | Financial data intake, CIBIL-style scoring (300-900) |
| UPI Mandate | 8003 | Mandate creation, retry engine, pre-debit notifications |

## Stack

- **Backend:** Python + FastAPI
- **Database:** PostgreSQL via Supabase
- **File Storage:** Local filesystem (no AWS S3)
- **Queue/Cache:** Redis (local Docker, no AWS ElastiCache)
- **OCR:** Tesseract + pytesseract
- **Face Match:** DeepFace
- **Frontend:** HTML + Tailwind CSS (ORYZO AI dark studio design)
- **Containerization:** Docker + Docker Compose
- **CI/CD:** Jenkins (local registry, no AWS ECR)

## Quick Start

```bash
# 1. Set environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Start everything
docker-compose up -d

# 3. Initialize database tables
cd database/migrations
pip install sqlalchemy psycopg2-binary
python init_supabase.py

# 4. Verify
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# 5. Open dashboard
open http://localhost
```

## Design System

ORYZO AI dark studio aesthetic:
- Canvas: `#100904`
- Text: `#ffedd7`
- Accent: `#dc5000` (hairlines only)
- Typography: DM Sans
- Zero shadows, full-bleed layout
