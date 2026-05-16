# JUSTutor

JUSTutor is an AI-based educational system for IT students. It supports RAG-backed chat, quiz generation, and explanation workflows through a Django backend and React frontend.

## Local MVP demo

This repository is now set up for a simple local demonstration using:

- Django backend on `http://localhost:8000`
- React frontend on `http://localhost:5173`
- OpenAI for generation and embeddings
- Qdrant as the vector database used by the RAG pipeline

## Before you run

1. Make sure `Backend/django_api/.env` exists.
2. Fill in at least these variables:
   - `OPENAI_API_KEY`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `QDRANT_COLLECTION`
3. Make sure the target Qdrant collection already contains your ingested course material.
4. The active frontend lives in `ai-teaching-frontend/` and is the one used by Docker and CI.

## Run locally with Docker

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/health/`

## MVP scope

This local deployment is intentionally minimal and focused on a live demonstration:

- Chat uses the real RAG backend
- Quiz generation uses OpenAI through the backend service
- Text explain uses the real backend service
- File explain is kept as a simple text-based upload flow for the demo

For now, this setup assumes limited active RAG collections and local demo usage. It can later be extended to multiple collections and richer ingestion flows.
