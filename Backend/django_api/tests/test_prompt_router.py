import re

from django.test import SimpleTestCase

import numpy as np

from api.services.prompt_router import PromptRouter


class PromptRouterTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.router = PromptRouter(embedding_model=FakeEmbeddingModel())

    def assert_route(self, text: str, expected_route: str) -> None:
        result = self.router.classify(text)
        self.assertEqual(result["route"], expected_route)

    def test_greeting_routes_to_greeting(self):
        self.assert_route("hi", "greeting")

    def test_slide_explanation_routes_to_slide_explanation(self):
        self.assert_route("explain this slide in simple words", "slide_explanation")

    def test_quiz_generation_routes_to_quiz_generation(self):
        self.assert_route("make me 10 questions about stacks", "quiz_generation")

    def test_coding_help_routes_to_coding_help(self):
        self.assert_route("why does my Python code give an index error?", "coding_help")

    def test_rag_question_answering_routes_to_rag_question_answering(self):
        self.assert_route(
            "what does the uploaded lecture say about binary trees?",
            "rag_question_answering",
        )

    def test_summarization_routes_to_summarization(self):
        self.assert_route("summarize this topic", "summarization")


class FakeEmbeddingModel:
    def embed(self, texts):
        return [self._encode(text) for text in texts]

    def _encode(self, text):
        vector = np.zeros(7, dtype=np.float32)
        lowered = text.lower()

        def has(pattern: str) -> bool:
            return re.search(pattern, lowered) is not None

        if any(
            has(pattern)
            for pattern in (
                r"\bhi\b",
                r"\bhello\b",
                r"\bhey\b",
                r"\bgreeting\b",
                r"casual conversation",
                r"not asking a course question",
            )
        ):
            vector[0] = 1.0
        elif any(
            has(pattern)
            for pattern in (
                r"\bquiz\b",
                r"practice questions",
                r"test me",
                r"make me questions",
                r"test your understanding",
                r"\bquestions\b",
            )
        ):
            vector[2] = 1.0
        elif any(
            has(pattern)
            for pattern in (
                r"\bcode\b",
                r"\berror\b",
                r"\bbug\b",
                r"\bindex\b",
                r"\bpython\b",
                r"lab exercise",
                r"fix my code",
                r"explain this error",
            )
        ):
            vector[3] = 1.0
        elif any(
            has(pattern)
            for pattern in (
                r"\buploaded\b",
                r"retrieved educational content",
                r"uploaded file",
                r"what does the lecture say",
                r"binary trees",
                r"asks about course material",
                r"\bexams\b",
                r"\bdocuments\b",
            )
        ):
            vector[4] = 1.0
        elif any(
            has(pattern)
            for pattern in (
                r"\bsummarize\b",
                r"\bsummary\b",
                r"main points",
                r"give me the main points",
            )
        ):
            vector[5] = 1.0
        elif any(
            has(pattern)
            for pattern in (
                r"\bslide\b",
                r"simple explanation of course material",
                r"what a slide means",
                r"simplify this lecture",
                r"explain this slide",
            )
        ):
            vector[1] = 1.0
        else:
            vector[6] = 1.0

        return vector
