import json
import os
import sys
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from langchain_openai import ChatOpenAI

from .services.prompt_router import get_prompt_router
from .services.prompt_templates import PROMPT_TEMPLATES


def _resolve_rag_directory() -> Path:
    current_file = Path(__file__).resolve()

    candidates = []
    for parent in current_file.parents:
        candidates.append(parent / "RAG_sys")

    for candidate in candidates:
        if (candidate / "rag.py").exists():
            return candidate

    raise ImproperlyConfigured(
        "RAG_sys directory could not be found. "
        "Mount or copy it into the backend runtime before starting Django."
    )


RAG_DIR = _resolve_rag_directory()
if str(RAG_DIR) not in sys.path:
    sys.path.append(str(RAG_DIR))

from rag import RAGConfig, RAGPipeline  # noqa: E402


ROUTES_THAT_NEED_RAG = {
    "slide_explanation",
    "quiz_generation",
    "rag_question_answering",
    "summarization",
}


def _format_history(history: list[dict] | None) -> str:
    if not history:
        return ""

    lines: list[str] = []
    for item in history:
        content = (item or {}).get("content", "")
        role = (item or {}).get("role", "user")
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _format_additional_context(context: dict | str | None) -> str:
    if context is None:
        return ""
    if isinstance(context, str):
        return context.strip()
    if not isinstance(context, dict):
        return str(context).strip()

    parts: list[str] = []
    for key, value in context.items():
        if key in {"actionType", "language"}:
            continue
        if value in (None, "", [], {}, ()):
            continue
        parts.append(f"{key}: {value}")
    return "\n".join(parts)


class RAGService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ImproperlyConfigured("OPENAI_API_KEY is not configured.")

        os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        self._pipeline = None
        self._prompt_router = get_prompt_router()

    def _get_pipeline(self) -> RAGPipeline:
        if self._pipeline is None:
            cfg = RAGConfig(
                qdrant_url=settings.QDRANT_URL or None,
                qdrant_api_key=settings.QDRANT_API_KEY or None,
                qdrant_location=settings.QDRANT_LOCATION,
                qdrant_collection=settings.QDRANT_COLLECTION,
                top_k=settings.RAG_TOP_K,
                embedding_model=settings.RAG_EMBEDDING_MODEL,
                embedding_dim=settings.RAG_EMBEDDING_DIM,
                llm_model=settings.RAG_LLM_MODEL,
                llm_temperature=settings.RAG_LLM_TEMPERATURE,
            )
            self._pipeline = RAGPipeline(config=cfg).use_existing()
        return self._pipeline

    def _retrieve_context(self, question: str) -> tuple[str, list[dict]]:
        try:
            docs = self._get_pipeline().retrieve(question)
        except Exception:
            return "", []

        if not docs:
            return "", []

        formatted_chunks: list[str] = []
        references: list[dict] = []
        for idx, doc in enumerate(docs, start=1):
            metadata = doc.metadata or {}
            source = metadata.get("source") or metadata.get("file") or "unknown"
            page = metadata.get("page", metadata.get("page_number", "?"))
            snippet = " ".join((doc.page_content or "").split())
            if len(snippet) > 1200:
                snippet = snippet[:1200].rstrip() + "..."

            formatted_chunks.append(
                f"[Chunk {idx}] source={source} page={page}\n{snippet}"
            )
            references.append(
                {
                    "source": source,
                    "page": page,
                    "chunk_id": idx,
                    "snippet": snippet,
                }
            )

        return "\n\n".join(formatted_chunks), references

    def _build_question_payload(
        self,
        user_question: str,
        subject: str = "",
        context: dict | str | None = None,
        history: list[dict] | None = None,
    ) -> str:
        sections: list[str] = []
        if subject:
            sections.append(f"Subject: {subject}")

        history_text = _format_history(history)
        if history_text:
            sections.append(f"Conversation history:\n{history_text}")

        extra_context = _format_additional_context(context)
        if extra_context:
            sections.append(f"Additional context:\n{extra_context}")

        sections.append(f"Student message:\n{user_question}")
        return "\n\n".join(sections)

    def _select_template(self, route: str) -> tuple[str, str]:
        template = PROMPT_TEMPLATES.get(route)
        if template is None:
            route = "rag_question_answering"
            template = PROMPT_TEMPLATES[route]
        return route, template

    def handle_user_message(
        self,
        user_question: str,
        subject: str = "",
        context: dict | str | None = None,
        history: list[dict] | None = None,
    ) -> dict:
        classification = self._prompt_router.classify(user_question)
        route = str(classification.get("route") or "rag_question_answering")
        confidence = float(classification.get("score") or 0.0)

        retrieved_context = ""
        references: list[dict] = []
        if route in ROUTES_THAT_NEED_RAG:
            retrieved_context, references = self._retrieve_context(user_question)

        question_payload = self._build_question_payload(
            user_question=user_question,
            subject=subject,
            context=context,
            history=history,
        )
        route, template = self._select_template(route)
        final_prompt = template.format(context=retrieved_context, question=question_payload)
        answer = self._get_llm().invoke(final_prompt).content

        return {
            "route": route,
            "confidence": confidence,
            "answer": answer,
            "references": references,
        }

    def chat(self, message: str, subject: str, context: dict | None, history: list[dict]) -> dict:
        return self.handle_user_message(
            user_question=message,
            subject=subject,
            context=context,
            history=history,
        )

    def explain_text(self, content: str, subject: str, topic: str) -> dict:
        prompt = (
            "You are an AI teaching assistant for university students.\n"
            f"Subject: {subject}\n"
            f"Topic: {topic or 'General'}\n\n"
            "Analyze the provided content and explain it in a clear educational style.\n"
            "Include:\n"
            "1. Main idea\n"
            "2. Key points\n"
            "3. Important terms\n"
            "4. Short examples when useful\n"
            "5. Suggested next study steps\n\n"
            f"Content:\n{content}"
        )
        answer = self._get_llm().invoke(prompt).content
        return {"answer": answer, "references": []}

    def generate_flashcards(self, subject: str, topic: str, num_cards: int) -> list[dict]:
        retrieved_context, references = self._retrieve_context(f"{subject} {topic} flashcards")
        prompt = f"""You are an AI flashcard generator for university students.

Create {num_cards} high-quality flashcards for the following subject and topic.

Subject: {subject}
Topic: {topic}

Use the retrieved course material when it is available. If the context is sparse, still create accurate study cards from the topic.

Retrieved context:
{retrieved_context}

Return valid JSON only in this exact structure:
[
  {{
    "front": "Question or concept prompt",
    "back": "Clear answer or explanation",
    "hint": "Optional short hint"
  }}
]

Rules:
- Generate exactly {num_cards} cards.
- Keep fronts short and focused.
- Keep backs concise but educational.
- Do not include markdown fences.
- Do not include any text before or after the JSON."""

        response_text = self._get_llm().invoke(prompt).content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```", 2)[1]
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()

        cards = json.loads(response_text)
        return cards

    def generate_quiz(
        self,
        subject: str,
        topic: str,
        num_questions: int,
        difficulty: str,
        question_types: list[str],
    ) -> list[dict]:
        prompt_types = ", ".join(question_types)
        prompt = f"""Generate a quiz as a JSON array for this course topic.

Subject: {subject}
Topic: {topic}
Number of questions: {num_questions}
Difficulty: {difficulty}
Question types: {prompt_types}

Return valid JSON only using this structure:
[
  {{
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A",
    "explanation": "Brief explanation"
  }}
]

Rules:
- For multiple_choice include exactly 4 options.
- For true_false, the correct_answer must be "True" or "False".
- For short_answer, omit options and provide a concise expected answer.
- Do not wrap the JSON in markdown fences.
- Do not include any text before or after the JSON."""

        response_text = self._get_llm().invoke(prompt).content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```", 2)[1]
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()

        return json.loads(response_text)

    def generate_study_plan(
        self,
        subject: str,
        topics: list[str],
        exam_date: str,
        daily_hours: int,
    ) -> dict:
        """
        Generate a study plan for the given subject and list of topics.
        Returns a JSON-serializable dict containing plan metadata and day-level schedule entries.
        """
        topics_text = "\n".join(f"- {t}" for t in (topics or []))
        retrieved_context, references = self._retrieve_context(f"{subject} {' '.join(topics or [])} study plan")

        prompt = f"""You are an AI study planner for university students.

Create a personalized study plan given the information below.

Subject: {subject}
Topics:
{topics_text or 'General'}
Exam date: {exam_date or 'Not provided'}
Daily study hours: {daily_hours}

Use the retrieved course material when it is available. If the context is sparse, still produce a reasonable study schedule.

Retrieved context:
{retrieved_context}

Return valid JSON only in this exact structure:
{{
  "subject": "...",
  "exam_date": "YYYY-MM-DD or empty",
  "daily_hours": number,
  "total_days": number,
  "summary": "Short study plan overview",
  "days": [
    {{
      "day": number,
      "date": "YYYY-MM-DD",
      "type": "learn|review|practice|rest",
      "focus_topic": "Main focus for the day",
      "hours": number,
      "tasks": ["task 1", "task 2"],
      "tip": "Optional study tip"
    }}
  ],
  "notes": "Optional plain-text notes for the student"
}}

Rules:
- Create a realistic day-by-day schedule that covers all listed topics before the exam.
- Use exactly the JSON structure shown above.
- If exam date is not provided, create a default 2-week plan.
- Do not include any text before or after the JSON. Do not wrap the JSON in markdown fences.
"""

        response_text = self._get_llm().invoke(prompt).content.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```", 2)[1]
            if response_text.startswith("json"):
                response_text = response_text[4:].strip()

        try:
            plan = json.loads(response_text)
        except Exception:
            # If parsing fails, return a fallback structure with the raw text for debugging
            return {
                "subject": subject,
                "exam_date": exam_date,
                "daily_hours": daily_hours,
                "total_days": 0,
                "summary": '',
                "days": [],
                "notes": 'Failed to parse LLM response as JSON.',
                "raw": response_text,
                "references": references,
            }

        if isinstance(plan, dict):
            if 'days' not in plan and 'schedule' in plan:
                plan['days'] = plan['schedule']
            if 'total_days' not in plan:
                plan['total_days'] = len(plan.get('days', []))
            plan.setdefault('summary', plan.get('notes', ''))
            plan.setdefault('notes', '')
            plan.setdefault('references', references)

        return plan

    def _get_llm(self) -> ChatOpenAI:
        return ChatOpenAI(
            model=settings.RAG_LLM_MODEL,
            temperature=settings.RAG_LLM_TEMPERATURE,
        )


@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:
    return RAGService()
