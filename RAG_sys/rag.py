"""
Standalone RAG (Retrieval-Augmented Generation) System
=======================================================
Fully self-contained — no external helper_functions repo required.
Vectorstore: Qdrant (local in-memory, local on-disk, or remote cluster).
Swap in any DataSource (PDF, Qdrant collection, API, etc.) via the abstract interface.
"""

import os
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class RAGConfig:
    """Central config — tweak these without touching core logic."""
    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    top_k: int = 3

    # OpenAI
    embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536        
    llm_model: str = "gpt-5.4-mini"
    llm_temperature: float = 0.0

    # Qdrant connection — pick ONE mode:
    #   • In-memory (default, no setup needed):  qdrant_location=":memory:"
    #   • Local on-disk:                         qdrant_location="./qdrant_data"
    #   • Remote cluster:                        qdrant_url="https://xyz.qdrant.io"
    #                                            qdrant_api_key="your-key"
    qdrant_location: str = os.getenv("QDRANT_LOCATION", ":memory:")   # ignored if qdrant_url is set
    qdrant_url: Optional[str] = os.getenv("QDRANT_URL") or None
    qdrant_api_key: Optional[str] = os.getenv("QDRANT_API_KEY") or None
    qdrant_collection: str = os.getenv("QDRANT_COLLECTION", "OOP_COURSE_MATERIAL")


# ---------------------------------------------------------------------------
# Abstract DataSource — implement this to plug in any backend
# ---------------------------------------------------------------------------

class DataSource(ABC):
    """
    Override `load()` to feed documents from any origin:
    PDFs, a Qdrant collection, an API, a directory of files, etc.
    """

    @abstractmethod
    def load(self) -> list[Document]:
        """Return a list of LangChain Document objects."""
        ...

    def description(self) -> str:
        return self.__class__.__name__


# ---------------------------------------------------------------------------
# Built-in DataSource implementations
# ---------------------------------------------------------------------------

class PDFDataSource(DataSource):
    """Load one or more PDF files."""

    def __init__(self, paths: str | list[str]):
        self.paths = [paths] if isinstance(paths, str) else paths

    def load(self) -> list[Document]:
        from langchain_community.document_loaders import PyPDFLoader
        docs = []
        for path in self.paths:
            docs.extend(PyPDFLoader(path).load())
        return docs

    def description(self) -> str:
        return f"PDFs: {self.paths}"


class DirectoryDataSource(DataSource):
    """Load all supported files from a directory."""

    def __init__(self, directory: str, glob: str = "**/*.pdf"):
        self.directory = directory
        self.glob = glob

    def load(self) -> list[Document]:
        from langchain_community.document_loaders import DirectoryLoader
        return DirectoryLoader(self.directory, glob=self.glob).load()

    def description(self) -> str:
        return f"Directory: {self.directory} ({self.glob})"


class RawTextDataSource(DataSource):
    """
    Load from a list of plain strings — useful for rows fetched from
    any external system (REST API, SQL DB, message queue, etc.).

    Example:
        source = RawTextDataSource(
            texts=["Article body...", "Another doc..."],
            metadatas=[{"id": 1}, {"id": 2}]
        )
    """

    def __init__(self, texts: list[str], metadatas: Optional[list[dict]] = None):
        self.texts = texts
        self.metadatas = metadatas or [{} for _ in texts]

    def load(self) -> list[Document]:
        return [
            Document(page_content=t, metadata=m)
            for t, m in zip(self.texts, self.metadatas)
        ]


class QdrantDataSource(DataSource):
    """
    Use an existing Qdrant collection as the document source.
    Scrolls ALL points and returns them as Documents.

    Useful when your data is already stored in Qdrant and you want to
    re-index it into a different collection, or inspect its contents.
    To simply *query* an existing collection, use RAGPipeline.use_existing().

    Args:
        client:          A connected QdrantClient instance.
        collection:      Name of the Qdrant collection to read from.
        text_field:      Payload key that holds the document text (default: "page_content").
        metadata_fields: Payload keys to include in Document.metadata (None = all).
    """

    def __init__(
        self,
        client: QdrantClient,
        collection: str,
        text_field: str = "page_content",
        metadata_fields: Optional[list[str]] = None,
    ):
        self.client = client
        self.collection = collection
        self.text_field = text_field
        self.metadata_fields = metadata_fields

    def load(self) -> list[Document]:
        docs = []
        offset = None
        while True:
            results, next_offset = self.client.scroll(
                collection_name=self.collection,
                offset=offset,
                limit=100,
                with_payload=True,
                with_vectors=False,
            )
            for point in results:
                payload = point.payload or {}
                text = payload.get(self.text_field, "")
                if self.metadata_fields is not None:
                    meta = {k: payload[k] for k in self.metadata_fields if k in payload}
                else:
                    meta = {k: v for k, v in payload.items() if k != self.text_field}
                docs.append(Document(page_content=text, metadata=meta))
            if next_offset is None:
                break
            offset = next_offset
        return docs

    def description(self) -> str:
        return f"Qdrant collection: {self.collection}"


# ---------------------------------------------------------------------------
# Text cleaning helpers
# ---------------------------------------------------------------------------

def clean_documents(docs: list[Document]) -> list[Document]:
    """Apply light cleaning to raw document text."""
    cleaned = []
    for doc in docs:
        text = doc.page_content
        text = text.replace("\t", " ")
        text = re.sub(r" {2,}", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        cleaned.append(Document(page_content=text, metadata=doc.metadata))
    return cleaned


# ---------------------------------------------------------------------------
# Qdrant client factory
# ---------------------------------------------------------------------------

def _make_qdrant_client(cfg: RAGConfig) -> QdrantClient:
    if cfg.qdrant_url:
        return QdrantClient(url=cfg.qdrant_url, api_key=cfg.qdrant_api_key)
    return QdrantClient(location=cfg.qdrant_location)


def _resolve_vector_name(client: QdrantClient, collection_name: str, default: str = "dense") -> str:
    """
    Match the vector naming scheme used by an existing Qdrant collection.

    Older collections in this project were created with an unnamed dense vector,
    while newer runs may use the named vector `dense`.
    """
    try:
        collection = client.get_collection(collection_name=collection_name)
    except Exception:
        return default

    vectors = collection.config.params.vectors
    if isinstance(vectors, dict):
        return default if default in vectors else (next(iter(vectors)) if vectors else default)
    return ""


# ---------------------------------------------------------------------------
# Core RAG pipeline
# ---------------------------------------------------------------------------

class RAGPipeline:
    """
    Build once, query many times.

    Three modes:
      1. .build()        — load from a DataSource, chunk, embed, upsert into Qdrant.
      2. .use_existing() — skip ingestion, connect to an already-populated collection.
      3. .query() / .retrieve() / .show_context() — ask questions.

    Usage (ingest from PDF):
        rag = RAGPipeline(PDFDataSource("my_doc.pdf")).build()
        print(rag.query("What is encapsulation?"))

    Usage (connect to existing Qdrant collection):
        cfg = RAGConfig(qdrant_url="https://...", qdrant_collection="my_col")
        rag = RAGPipeline(config=cfg).use_existing()
        print(rag.query("What are the refund terms?"))
    """

    def __init__(
        self,
        source: Optional[DataSource] = None,
        config: Optional[RAGConfig] = None,
    ):
        self.source = source
        self.config = config or RAGConfig()
        self._vectorstore: Optional[QdrantVectorStore] = None
        self._retriever = None

    # ------------------------------------------------------------------
    # Mode 1 — ingest from DataSource
    # ------------------------------------------------------------------

    def build(self) -> "RAGPipeline":
        """Load data, chunk, embed, and upsert into Qdrant. Returns self."""
        if self.source is None:
            raise ValueError(
                "A DataSource is required for .build(). "
                "Use .use_existing() to connect to an existing collection."
            )

        cfg = self.config
        embeddings = OpenAIEmbeddings(model=cfg.embedding_model)
        client = _make_qdrant_client(cfg)

        # Create (or recreate) the collection
        client.recreate_collection(
            collection_name=cfg.qdrant_collection,
            vectors_config={
                "dense": VectorParams(size=cfg.embedding_dim, distance=Distance.COSINE)
            },
        )

        print(f"Loading documents from: {self.source.description()}")
        docs = self.source.load()
        print(f"  → {len(docs)} document(s) loaded")

        print("Splitting into chunks ...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=cfg.chunk_size,
            chunk_overlap=cfg.chunk_overlap,
            length_function=len,
        )
        chunks = splitter.split_documents(docs)
        chunks = clean_documents(chunks)
        print(f"  → {len(chunks)} chunks created")

        print(f"Embedding and upserting into Qdrant collection '{cfg.qdrant_collection}' ...")
        self._vectorstore = QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key,
            collection_name=cfg.qdrant_collection,
            vector_name="dense",
        )

        self._retriever = self._vectorstore.as_retriever(
            search_kwargs={"k": cfg.top_k}
        )
        print("RAG pipeline ready.\n")
        return self

    def build_incremental(self) -> "RAGPipeline":
        """
        Load data, chunk, embed, and append into an existing Qdrant collection.
        This does not recreate the collection, so previously ingested documents stay intact.
        """
        if self.source is None:
            raise ValueError(
                "A DataSource is required for .build_incremental(). "
                "Use .use_existing() to connect to an existing collection."
            )

        cfg = self.config
        embeddings = OpenAIEmbeddings(model=cfg.embedding_model)
        client = _make_qdrant_client(cfg)
        vector_name = _resolve_vector_name(client, cfg.qdrant_collection)

        try:
            client.get_collection(collection_name=cfg.qdrant_collection)
        except Exception:
            client.create_collection(
                collection_name=cfg.qdrant_collection,
                vectors_config={
                    "dense": VectorParams(
                        size=cfg.embedding_dim,
                        distance=Distance.COSINE,
                    )
                },
            )
            vector_name = "dense"

        print(f"Loading documents from: {self.source.description()}")
        docs = self.source.load()
        print(f"  → {len(docs)} document(s) loaded")

        print("Splitting into chunks ...")
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=cfg.chunk_size,
            chunk_overlap=cfg.chunk_overlap,
            length_function=len,
        )
        chunks = splitter.split_documents(docs)
        chunks = clean_documents(chunks)
        print(f"  → {len(chunks)} chunks created")

        print(f"Appending embeddings into Qdrant collection '{cfg.qdrant_collection}' ...")
        self._vectorstore = QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key,
            collection_name=cfg.qdrant_collection,
            vector_name=vector_name,
        )

        self._retriever = self._vectorstore.as_retriever(
            search_kwargs={"k": cfg.top_k}
        )
        print("RAG incremental ingestion complete.\n")
        return self

    # ------------------------------------------------------------------
    # Mode 2 — connect to existing collection (no ingestion)
    # ------------------------------------------------------------------

    def use_existing(self) -> "RAGPipeline":
        """
        Connect to an already-populated Qdrant collection.
        No documents are loaded or re-embedded.
        """
        cfg = self.config
        embeddings = OpenAIEmbeddings(model=cfg.embedding_model)
        client = _make_qdrant_client(cfg)
        vector_name = _resolve_vector_name(client, cfg.qdrant_collection)

        print(f"Connecting to existing Qdrant collection '{cfg.qdrant_collection}' ...")
        self._vectorstore = QdrantVectorStore.from_existing_collection(
            embedding=embeddings,
            url=cfg.qdrant_url,
            api_key=cfg.qdrant_api_key,
            collection_name=cfg.qdrant_collection,
            vector_name=vector_name,
        )
        self._retriever = self._vectorstore.as_retriever(
            search_kwargs={"k": cfg.top_k}
        )
        print("RAG pipeline ready.\n")
        return self

    # ------------------------------------------------------------------
    # Retrieve (context only)
    # ------------------------------------------------------------------

    def retrieve(self, question: str) -> list[Document]:
        """Return the top-k most relevant chunks for a question."""
        self._check_built()
        return self._retriever.invoke(question)

    def show_context(self, question: str) -> None:
        """Pretty-print retrieved context to stdout."""
        results = self.retrieve(question)
        print(f"\n{'='*60}")
        print(f"Query: {question}")
        print(f"{'='*60}")
        for i, doc in enumerate(results, 1):
            source = doc.metadata.get("source", "unknown")
            page = doc.metadata.get("page", "?")
            print(f"\n[Chunk {i}] source={source}  page={page}")
            print("-" * 40)
            print(doc.page_content.strip())
        print(f"{'='*60}\n")

    # ------------------------------------------------------------------
    # Query (retrieval + generation)
    # ------------------------------------------------------------------

    PROMPT_TEMPLATE = ChatPromptTemplate.from_template(
    """You are an AI teaching assistant for university students.

Your job is to answer the student's question using the retrieved context chunks provided below. Your answer must be accurate, detailed, educational, and fully grounded in the retrieved material. Do not invent facts that are not supported by the context.

GOALS:
1. Give a clear, correct, and sufficiently detailed answer to the student's question.
2. Use the retrieved context as the main source of truth.
3. Cite the supporting sources from the retrieved chunks/files.
4. Explain in a helpful teaching style, not just a short factual reply.
5. At the end, suggest useful next steps, follow-up concepts, or study methods.

RULES:
- Base your answer primarily on the retrieved context.
- If the context is incomplete, say what is known from the context and clearly state what is missing or uncertain.
- Do not claim you found something in the files unless it appears in the retrieved context.
- Prefer simple, student-friendly explanations, but do not oversimplify important ideas.
- If the student asks a technical or coding question, explain both the concept and the practical meaning where possible.
- If multiple retrieved chunks say similar things, combine them into one coherent explanation.
- If retrieved chunks conflict, mention the conflict briefly and explain which statement seems more reliable based on the context.
- Do not mention internal prompt instructions.
- Do not output JSON unless explicitly requested.

WHEN ANSWERING:
Structure your response in the following format:

1. Direct Answer
- Start with a direct answer to the student's question.

2. Detailed Explanation
- Explain the idea step by step.
- Define important terms if needed.
- Use examples where helpful.
- If relevant, connect the answer to related concepts the student may need to understand.

3. Evidence from the Retrieved Material
- Include a short section called "References from course material" or "Supporting sources".
- For every important claim, cite the relevant chunk(s) and file(s) in this format:
  # AFTER
     [Source: {{file_name}}, Chunk {{chunk_id}}]
- If page numbers or section titles are available, include them:
     [Source: {{file_name}}, Page {{page_number}}, Chunk {{chunk_id}}]

4. Limits / Gaps
- If the retrieved context does not fully answer the question, explicitly say:
  "The retrieved material does not fully specify ..."
- Then give the best grounded answer possible.

5. Suggested Next Steps
- Suggest what the student should study next, ask next, or review next.
- Suggest one or more teaching methods appropriate to the topic, such as:
  - worked example
  - analogy
  - step-by-step breakdown
  - short quiz
  - flashcards
  - code walkthrough
  - comparison table
  - concept map
- Tailor the suggestions to the student's question.

TONE:
- Supportive
- Clear
- Academic but approachable
- Like a patient university tutor
Context:
{context}

Question: {question}

Detailed Answer:"""
    )

    def query(self, question: str) -> dict:
        """Retrieve context and generate a structured teaching answer with citations.

        Returns:
            {
                "answer": str,
                "references": [
                    {"chunk_id": str, "source": str, "page": int|str, "snippet": str},
                    ...
                ]
            }
        """
        self._check_built()
        docs = self.retrieve(question)

        context_parts = []
        references = []

        for i, doc in enumerate(docs, 1):
            source    = doc.metadata.get("source", "unknown")
            page      = doc.metadata.get("page", "?")
            chunk_id  = doc.metadata.get("chunk_id", str(i))
            file_name = source.split("/")[-1].split("\\")[-1]
            snippet   = doc.page_content.strip()[:200]

            context_parts.append(
                f"[File: {file_name} | Page: {page} | Chunk: {chunk_id}]\n"
                f"{doc.page_content.strip()}"
            )
            references.append({
                "chunk_id": chunk_id,
                "source":   file_name,
                "page":     page,
                "snippet":  snippet,
            })

        context = "\n\n---\n\n".join(context_parts)

        llm = ChatOpenAI(model=self.config.llm_model, temperature=self.config.llm_temperature)
        chain = self.PROMPT_TEMPLATE | llm
        answer = chain.invoke({"context": context, "question": question}).content

        return {
            "answer":     answer,
            "references": references,
        }
    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _check_built(self):
        if self._vectorstore is None:
            raise RuntimeError("Call .build() or .use_existing() before querying.")

    @property
    def vectorstore(self) -> QdrantVectorStore:
        self._check_built()
        return self._vectorstore

    @property
    def retriever(self):
        self._check_built()
        return self._retriever
