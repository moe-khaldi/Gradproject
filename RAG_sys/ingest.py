import os
import argparse
from pathlib import Path

from dotenv import load_dotenv

from rag import RAGPipeline, RAGConfig, PDFDataSource


load_dotenv(Path(__file__).resolve().parents[1] / "Backend" / "django_api" / ".env")


def parse_args() -> tuple[list[str], str | None]:
    parser = argparse.ArgumentParser(
        description="Ingest one or more PDFs into a Qdrant collection."
    )
    parser.add_argument(
        "paths",
        nargs="*",
        help="PDF files to ingest. You can also pass a directory path.",
    )
    parser.add_argument(
        "-c",
        "--collection",
        dest="collection",
        help="Override the Qdrant collection name.",
    )
    args = parser.parse_args()

    paths = list(args.paths)
    collection_name = args.collection

    if not paths:
        pdf_path = os.getenv("PDF_PATH")
        if pdf_path:
            paths = [part.strip() for part in pdf_path.split(",") if part.strip()]

    if not paths:
        raise SystemExit(
            "Provide one or more PDF paths, or set PDF_PATH."
        )

    # Backward compatibility:
    # if the last positional argument does not look like a PDF path and is not an existing file,
    # treat it as the collection name.
    if collection_name is None and len(paths) > 1:
        last = Path(paths[-1]).expanduser()
        last_text = str(paths[-1]).lower()
        if not last.is_file() and not last_text.endswith(".pdf"):
            collection_name = paths.pop()

    return paths, collection_name

cfg = RAGConfig(
    qdrant_url=os.getenv("QDRANT_URL"),
    qdrant_api_key=os.getenv("QDRANT_API_KEY"),
    qdrant_collection=os.getenv("QDRANT_COLLECTION", "OOP_COURSE_MATERIAL"),
    chunk_size=1000,
    chunk_overlap=200,
)

pdf_paths, collection_name = parse_args()

def resolve_pdf_path(raw_path: str) -> str:
    """Resolve relative PDF paths against common project locations."""
    candidate = Path(raw_path).expanduser()
    if candidate.is_file():
        return str(candidate.resolve())

    script_dir = Path(__file__).resolve().parent
    fallback_paths = [
        script_dir / candidate,
        script_dir / "pdfs" / candidate.name,
    ]

    for fallback in fallback_paths:
        if fallback.is_file():
            return str(fallback.resolve())

    raise SystemExit(
        f"PDF file not found: {raw_path}\n"
        f"Tried: {candidate}, {fallback_paths[0]}, {fallback_paths[1]}"
    )

resolved_paths = [resolve_pdf_path(path) for path in pdf_paths]

if not collection_name:
    collection_name = Path(resolved_paths[0]).stem

if collection_name:
    cfg.qdrant_collection = collection_name

source = PDFDataSource(resolved_paths)

RAGPipeline(source, config=cfg).build_incremental()

print("Ingestion complete. Your vectors are stored in Qdrant.")
