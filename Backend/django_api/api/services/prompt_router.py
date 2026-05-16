from __future__ import annotations

from functools import lru_cache
from typing import Optional

import numpy as np

try:
    from fastembed import TextEmbedding
except ImportError as exc:  # pragma: no cover - dependency installation issue
    TextEmbedding = None  # type: ignore[assignment]
    _FASTEMBED_IMPORT_ERROR = exc
else:
    _FASTEMBED_IMPORT_ERROR = None


ROUTE_EXAMPLES = {
    "greeting": [
        "The user is greeting the assistant.",
        "The user says hello or starts a casual conversation.",
        "The user is not asking a course question yet.",
        "hi",
        "hello",
        "hey",
    ],
    "slide_explanation": [
        "The user wants lecture slides explained.",
        "The user wants a simple explanation of course material.",
        "The user asks what a slide means.",
        "explain this slide",
        "simplify this lecture",
    ],
    "quiz_generation": [
        "The user wants a quiz.",
        "The user wants practice questions.",
        "The user wants to test their understanding.",
        "make me questions",
        "test me on this topic",
    ],
    "coding_help": [
        "The user wants help with code.",
        "The user has a programming error or bug.",
        "The user wants help solving a lab exercise.",
        "fix my code",
        "explain this error",
    ],
    "rag_question_answering": [
        "The user asks a question that should be answered from uploaded files.",
        "The user asks about course material, slides, exams, or documents.",
        "The user wants an answer based on retrieved educational content.",
        "what does the lecture say",
        "answer based on the uploaded file",
    ],
    "summarization": [
        "The user wants a summary.",
        "The user asks to summarize a document, slide, lecture, or topic.",
        "summarize this",
        "give me the main points",
    ],
    "out_of_scope": [
        "The user asks something unrelated to the educational platform.",
        "The user asks something outside computer science, OOP, data structures, or uploaded materials.",
    ],
}


class PromptRouter:
    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
        threshold: float = 0.45,
        routes: Optional[dict[str, list[str]]] = None,
        embedding_model: Optional[object] = None,
    ) -> None:
        self.model_name = model_name
        self.threshold = threshold
        self.routes = routes or ROUTE_EXAMPLES
        if embedding_model is not None:
            self._embedding_model = embedding_model
        else:
            if TextEmbedding is None:  # pragma: no cover - dependency installation issue
                raise ImportError(
                    "fastembed is required for PromptRouter classification."
                ) from _FASTEMBED_IMPORT_ERROR
            self._embedding_model = TextEmbedding(model_name=self.model_name)
        self._route_vectors = self._build_route_vectors()

    def _embed(self, texts: list[str]) -> np.ndarray:
        vectors = list(self._embedding_model.embed(texts))
        if not vectors:
            return np.empty((0, 0), dtype=np.float32)
        return np.asarray(vectors, dtype=np.float32)

    @staticmethod
    def _normalize(vector: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector
        return vector / norm

    def _build_route_vectors(self) -> dict[str, np.ndarray]:
        route_vectors: dict[str, np.ndarray] = {}
        for route, examples in self.routes.items():
            embeddings = self._embed(examples)
            if embeddings.size == 0:
                route_vectors[route] = np.zeros(1, dtype=np.float32)
                continue
            centroid = embeddings.mean(axis=0)
            route_vectors[route] = self._normalize(centroid)
        return route_vectors

    def _similarity(self, query_vector: np.ndarray, route_vector: np.ndarray) -> float:
        if query_vector.size == 0 or route_vector.size == 0:
            return 0.0
        denom = np.linalg.norm(query_vector) * np.linalg.norm(route_vector)
        if denom == 0:
            return 0.0
        return float(np.dot(query_vector, route_vector) / denom)

    def classify(self, user_prompt: str) -> dict[str, float | str]:
        try:
            if not user_prompt or not user_prompt.strip():
                return {"route": "out_of_scope", "score": 0.0}

            query_vector = self._embed([user_prompt])[0]
            query_vector = self._normalize(query_vector)

            best_route = "rag_question_answering"
            best_score = float("-inf")
            for route, route_vector in self._route_vectors.items():
                score = self._similarity(query_vector, route_vector)
                if score > best_score:
                    best_route = route
                    best_score = score

            if best_score < self.threshold:
                return {"route": "out_of_scope", "score": float(best_score)}

            return {"route": best_route, "score": float(best_score)}
        except Exception:
            return {"route": "rag_question_answering", "score": 0.0}


@lru_cache(maxsize=1)
def get_prompt_router() -> PromptRouter:
    return PromptRouter()
