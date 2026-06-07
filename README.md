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
3. Make sure the target Qdrant collection already contains your ingested course material, or ingest it first using the steps below.
4. The active frontend lives in `JUSTutor_frontend/` and is the one used by Docker and CI.

## Ingest course files

The ingestion script lives in `RAG_sys/` and can now ingest one file or many files in a single command.

### 1. Add the PDF files

Place the files you want to ingest inside:

`RAG_sys/pdfs/`

You can either:

- copy the PDFs directly into that folder, or
- keep them elsewhere and pass the full path when running the script

Example folder layout:

```text
RAG_sys/
  ingest.py
  rag.py
  pdfs/
    OOPsyllabus.pdf
    OOPpointers.pdf
    DataStruct Final.pdf
```

### 2. Run ingestion

From `RAG_sys/`, ingest one PDF:

```bash
python ingest.py ""yourfile.pdf".pdf" -c "yourQdrantCollection"
```

Ingest multiple PDFs at once:

```bash
python ingest.py "yourfile1.pdf" "yourfile2.pdf" "yourfile3.pdf" -c "yourQdrantCollection"
```

You can also point to files outside the `pdfs/` folder by using their full path.

### 3. Avoid duplicate ingestion

After a file has been ingested successfully, it is a good idea to remove that file from `RAG_sys/pdfs/` before running the script again. This helps prevent accidentally ingesting the same document twice and creating duplicate chunks in Qdrant.

If you want to keep an archive, move already-ingested PDFs to another folder instead of leaving them in `RAG_sys/pdfs/`.

## Run locally with Docker

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/health/`

## Features

JUSTutor is an AI-powered study platform built for university students. The current project includes:

- RAG-backed chat that answers questions from ingested course material
- Quiz generation with structured JSON output and saved quiz sessions
- Flashcard generation for quick revision
- Text explanation for user-provided content
- File explain support for uploaded text files
- Academic dashboard views for progress-oriented study workflows
- Materials browsing for course resources and links
- Chat history and saved sessions
- GPA planning and study planning pages
- Exam practice and debugging support
- Authentication flows for register, login, and protected app pages
- Prompt routing that sends different user requests to the right assistant behavior
- Persistent local data for chat sessions, quizzes, and submissions in the Django database

## Architecture

The project is split into three main parts:

### 1. React frontend

The frontend lives in `JUSTutor_frontend/` and provides the student-facing UI. It includes:

- a public landing page
- login and registration pages
- an authenticated app shell with sidebar navigation
- dedicated pages for chat, quiz, exam, flashcards, planner, GPA, materials, history, dashboard, and debug

### 2. Django backend

The backend lives in `Backend/django_api/` and exposes the API used by the frontend. It handles:

- user registration and JWT authentication
- chat session storage
- quiz generation and submission scoring
- flashcard generation
- file and text explanation
- materials listing and retrieval
- RAG orchestration through the shared service layer

### 3. RAG ingestion and retrieval

The RAG tooling lives in `RAG_sys/` and is responsible for:

- ingesting one or more PDFs into Qdrant
- splitting documents into chunks
- embedding chunks with OpenAI embeddings
- retrieving relevant context for chat, quiz, and explanation routes
- reading from existing Qdrant collections without recreating them

## Technology Stack

### Frontend

- React 19
- Vite
- React Router
- Lucide React icons
- Recharts
- CSS-based app styling with a custom layout system

### Backend

- Django 6
- Django REST Framework
- Django CORS Headers
- JWT auth with `djangorestframework-simplejwt`
- SQLite or the configured Django database for local state

### AI and RAG

- OpenAI for chat and embeddings
- LangChain
- LangChain Community loaders
- LangChain OpenAI
- LangChain Qdrant integration
- Qdrant as the vector database
- PyPDF for PDF ingestion
- FastEmbed for prompt routing classification

### Developer and runtime tools

- Docker and Docker Compose
- Python dotenv for environment loading
- Node.js and npm for frontend development

## Project Structure

```text
JUSTutor/
  Backend/
    django_api/
      api/
      gp1_backend/
  JUSTutor_frontend/
    src/
      pages/
      layouts/
      context/
      services/
  RAG_sys/
    ingest.py
    rag.py
    query.py
    pdfs/
  docker-compose.yml
  README.md
```

## Core Workflow

1. Add course PDFs to `RAG_sys/pdfs/` or pass their full paths to the ingest script.
2. Run `python ingest.py ...` to build or extend the Qdrant collection.
3. Start the backend and frontend with Docker.
4. Use the frontend to chat, generate quizzes, create flashcards, explain content, and review study history.

## Notes

- The backend expects `OPENAI_API_KEY` and Qdrant settings in `Backend/django_api/.env`.
- The active collection name should match the collection you ingest into and query from.
- If you ingest a file successfully, remove it from `RAG_sys/pdfs/` afterward or move it to an archive folder to avoid duplicate indexing on the next run.
- The ingestion script supports multiple PDFs in one command.
