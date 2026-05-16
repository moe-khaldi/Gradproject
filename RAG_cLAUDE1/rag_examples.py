"""
rag_examples.py — Ready-to-run usage examples for rag.py
=========================================================
Uncomment the example that fits your use case.
"""

import os
from rag import RAGPipeline, RAGConfig, PDFDataSource, DirectoryDataSource, RawTextDataSource, QdrantDataSource
from qdrant_client import QdrantClient

os.environ["OPENAI_API_KEY"] = "sk-..."


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 1 — Single PDF, in-memory Qdrant (no server needed)
# ─────────────────────────────────────────────────────────────────────────────

def example_single_pdf():
    source = PDFDataSource("OOPPDF.pdf")
    rag = RAGPipeline(source, config=RAGConfig(top_k=2)).build()

    question = "What is encapsulation in object oriented programming?"
    rag.show_context(question)       # raw chunks only
    print(rag.query(question))       # LLM-generated answer


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 2 — Persist the Qdrant index to disk between runs
# ─────────────────────────────────────────────────────────────────────────────

def example_persist_to_disk():
    cfg = RAGConfig(
        qdrant_location="./qdrant_data",   # survives restarts
        qdrant_collection="oop_docs",
    )
    rag = RAGPipeline(PDFDataSource("OOPPDF.pdf"), config=cfg).build()
    print(rag.query("Explain polymorphism."))


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 3 — Remote Qdrant cluster (cloud / self-hosted)
# ─────────────────────────────────────────────────────────────────────────────

def example_remote_qdrant_ingest():
    cfg = RAGConfig(
        qdrant_url="https://your-cluster-id.qdrant.io",
        qdrant_api_key=os.environ["QDRANT_API_KEY"],
        qdrant_collection="oop_docs",
    )
    rag = RAGPipeline(PDFDataSource("OOPPDF.pdf"), config=cfg).build()
    print(rag.query("What is inheritance?"))


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 4 — Query an EXISTING remote collection (skip ingestion entirely)
# ─────────────────────────────────────────────────────────────────────────────

def example_use_existing_collection():
    cfg = RAGConfig(
        qdrant_url="https://your-cluster-id.qdrant.io",
        qdrant_api_key=os.environ["QDRANT_API_KEY"],
        qdrant_collection="my_existing_collection",
        top_k=5,
    )
    rag = RAGPipeline(config=cfg).use_existing()   # no DataSource needed
    print(rag.query("What are the refund terms?"))


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 5 — Pull documents OUT of Qdrant and re-index (QdrantDataSource)
# ─────────────────────────────────────────────────────────────────────────────

def example_qdrant_as_source():
    # Read from one collection, write into another with different chunk settings
    source_client = QdrantClient(url="https://your-cluster-id.qdrant.io",
                                  api_key=os.environ["QDRANT_API_KEY"])
    source = QdrantDataSource(source_client, collection="raw_documents")

    cfg = RAGConfig(
        qdrant_url="https://your-cluster-id.qdrant.io",
        qdrant_api_key=os.environ["QDRANT_API_KEY"],
        qdrant_collection="reindexed_documents",
        chunk_size=500,
    )
    rag = RAGPipeline(source, config=cfg).build()
    print(rag.query("Summarise the key themes."))


# ─────────────────────────────────────────────────────────────────────────────
# EXAMPLE 6 — Feed rows from any external system via RawTextDataSource
# ─────────────────────────────────────────────────────────────────────────────

def example_external_data():
    # Swap the lines below for your actual data fetch (SQL, REST API, etc.)
    texts = ["Payment processing takes 3-5 business days.", "Refunds are issued within 14 days."]
    metadatas = [{"id": 1, "category": "payments"}, {"id": 2, "category": "refunds"}]

    cfg = RAGConfig(qdrant_collection="support_docs")
    rag = RAGPipeline(RawTextDataSource(texts, metadatas), config=cfg).build()
    print(rag.query("How long do refunds take?"))


# ─────────────────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    example_single_pdf()
