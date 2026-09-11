# Host Badminton

Trợ lý tính tiền và quản lý sân cầu lông dành cho chủ sân (Host).

## Kiến trúc dự án (Monorepo)

- **`backend/`**: FastAPI (Python 3.12+), Pydantic v2, SQLAlchemy 2.0 (Async), Alembic, PostgreSQL.
- **`frontend/`**: React (TypeScript), Vite, Tailwind CSS v4, Lucide Icons, Mobile-first UI.
- **`docs/`**: Kế hoạch phát triển (`docs/scope/`) và tài liệu kiến trúc (`docs/specs/`).

---

## Hướng dẫn chạy dự án

### 1. Backend (FastAPI)
```bash
# Kích hoạt môi trường ảo
source backend/.venv/bin/activate

# Chạy server development
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
```
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Healthcheck Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)