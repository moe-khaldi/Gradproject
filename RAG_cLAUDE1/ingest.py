import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from rag import RAGPipeline, RAGConfig, PDFDataSource


load_dotenv(Path(__file__).resolve().parents[1] / "Backend" / "django_api" / ".env")

cfg = RAGConfig(
    qdrant_url=os.getenv("QDRANT_URL"),
    qdrant_api_key=os.getenv("QDRANT_API_KEY"),
    qdrant_collection=os.getenv("QDRANT_COLLECTION", "OOP_COURSE_MATERIAL"),
    chunk_size=1000,
    chunk_overlap=200,
)

pdf_path = os.getenv("PDF_PATH")
if not pdf_path and len(sys.argv) > 1:
    pdf_path = sys.argv[1]

collection_name = os.getenv("QDRANT_COLLECTION_OVERRIDE")
if not collection_name and len(sys.argv) > 2:
    collection_name = sys.argv[2]

if not pdf_path:
    raise SystemExit("Set PDF_PATH or pass the PDF path as the first argument.")

if not collection_name:
    collection_name = Path(pdf_path).stem

if collection_name:
    cfg.qdrant_collection = collection_name

source = PDFDataSource([pdf_path])

RAGPipeline(source, config=cfg).build_incremental()

print("Ingestion complete. Your vectors are stored in Qdrant.")
