from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import Material, ChatSession, ChatMessage, Quiz, QuizSubmission
from .serializers import (
    MaterialSerializer, UserSerializer, RegisterSerializer,
    ChatSessionSerializer, ChatMessageSerializer, QuizSerializer, QuizSubmissionSerializer
)
import google.generativeai as genai
import json

User = get_user_model()

class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

class MaterialRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# Initialize Gemini AI
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # Use the latest flash model - gemini-flash-latest is an alias that always points to the newest
    gemini_model = genai.GenerativeModel('gemini-flash-latest')
else:
    gemini_model = None

# Chat Views
class ChatView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            message = request.data.get('message', '')
            subject = request.data.get('subject', 'General')
            context = request.data.get('context', {})
            session_id = request.data.get('session_id', None)

            if not message:
                return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or create chat session
            if session_id:
                try:
                    session = ChatSession.objects.get(id=session_id, user=request.user)
                except ChatSession.DoesNotExist:
                    session = ChatSession.objects.create(user=request.user, subject=subject)
            else:
                session = ChatSession.objects.create(user=request.user, subject=subject)

            # Save user message
            ChatMessage.objects.create(
                session=session,
                role='user',
                content=message,
                context=context
            )

            # Generate AI response
            if not gemini_model:
                return Response({'error': 'Gemini API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Build prompt based on context
            action_type = context.get('actionType', 'chat')
            language = context.get('language', 'en')

            # Create system prompt
            system_prompts = {
                'explain': f"You are a helpful teaching assistant. Explain the concept clearly and simply in {'Arabic' if language == 'ar' else 'English'}. Focus on clarity and use examples.",
                'example': f"You are a helpful teaching assistant. Provide a clear code example with explanation in {'Arabic' if language == 'ar' else 'English'}. Make sure the code is well-commented.",
                'practice': f"You are a helpful teaching assistant. Create practice problems related to the topic in {'Arabic' if language == 'ar' else 'English'}. Include hints and solutions.",
                'summarize': f"You are a helpful teaching assistant. Provide a concise summary of the key points in {'Arabic' if language == 'ar' else 'English'}.",
                'chat': f"You are a helpful teaching assistant for {subject}. Answer questions clearly in {'Arabic' if language == 'ar' else 'English'}."
            }

            system_prompt = system_prompts.get(action_type, system_prompts['chat'])

            # Get recent conversation history for context
            recent_messages = ChatMessage.objects.filter(session=session).order_by('-created_at')[:5]
            conversation_history = "\n".join([f"{msg.role}: {msg.content}" for msg in reversed(recent_messages)])

            # Generate response
            full_prompt = f"{system_prompt}\n\nSubject: {subject}\n\nConversation History:\n{conversation_history}\n\nUser: {message}\n\nAssistant:"

            response = gemini_model.generate_content(full_prompt)
            ai_response = response.text

            # Save AI response
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response,
                context=context
            )

            return Response({
                'response': ai_response,
                'session_id': session.id,
                'references': [],
                'quiz': None,
                'example': None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Quiz Generation View
class QuizGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            subject = request.data.get('subject', 'General')
            topic = request.data.get('topic', '')
            num_questions = request.data.get('num_questions', 5)
            difficulty = request.data.get('difficulty', 'medium')
            question_types = request.data.get('types', ['multiple_choice'])

            if not topic:
                return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

            if not gemini_model:
                return Response({'error': 'Gemini API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            type_mapping = {
                'multiple': 'multiple_choice',
                'boolean': 'true_false',
                'short': 'short_answer'
            }
            prompt_types = [type_mapping.get(t, t) for t in question_types]

            prompt = f"""Generate a quiz about {topic} in {subject} with the following requirements:
- Number of questions: {num_questions}
- Difficulty: {difficulty}
- Question types: {', '.join(prompt_types)}

Format the response as a JSON array with this structure:
[
  {{
    "question": "Question text",
    "type": "multiple_choice",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of the correct answer"
  }},
  {{
    "question": "True or false: Statement here",
    "type": "true_false",
    "correct_answer": "True",
    "explanation": "Brief explanation"
  }},
  {{
    "question": "Short answer question here?",
    "type": "short_answer",
    "correct_answer": "Expected answer",
    "explanation": "Brief explanation"
  }}
]

Important:
- For multiple_choice: include exactly 4 options labeled A), B), C), D)
- For true_false: correct_answer must be "True" or "False"
- For short_answer: provide expected answer
- Return valid JSON only, no additional text or markdown."""

            response = gemini_model.generate_content(prompt)
            response_text = response.text

            # Extract JSON from response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()

            questions = json.loads(response_text)

            # Save quiz to database
            quiz = Quiz.objects.create(
                user=request.user,
                subject=subject,
                topic=topic,
                difficulty=difficulty,
                questions=questions
            )

            return Response({
                'quiz_id': quiz.id,
                'questions': questions
            }, status=status.HTTP_200_OK)

        except json.JSONDecodeError as e:
            return Response({'error': f'Failed to parse quiz JSON: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Quiz Submission View
class QuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            quiz_id = request.data.get('quiz_id')
            answers = request.data.get('answers', {})

            if not quiz_id:
                return Response({'error': 'Quiz ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Get quiz
            try:
                quiz = Quiz.objects.get(id=quiz_id)
            except Quiz.DoesNotExist:
                return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)

            # Calculate score
            questions = quiz.questions
            total_questions = len(questions)
            correct_answers = 0
            feedback = []

            for idx, question in enumerate(questions):
                user_answer = answers.get(str(idx), '')
                correct_answer = question.get('correct_answer', '')

                is_correct = user_answer.upper() == correct_answer.upper()
                if is_correct:
                    correct_answers += 1

                feedback.append({
                    'question_index': idx,
                    'correct': is_correct,
                    'user_answer': user_answer,
                    'correct_answer': correct_answer,
                    'explanation': question.get('explanation', '')
                })

            score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

            # Save submission
            submission = QuizSubmission.objects.create(
                quiz=quiz,
                answers=answers,
                score=score,
                feedback=feedback
            )

            return Response({
                'score': score,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'feedback': feedback
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# File Upload and Explain View
class FileExplainView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            uploaded_file = request.FILES.get('file')
            subject = request.data.get('subject', 'General')
            topic = request.data.get('topic', '')

            if not uploaded_file:
                return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

            if not gemini_model:
                return Response({'error': 'Gemini API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Check file size (limit to 1MB for text files)
            if uploaded_file.size > 1024 * 1024:
                return Response({'error': 'File too large. Maximum size is 1MB'}, status=status.HTTP_400_BAD_REQUEST)

            # Read file content
            file_content = uploaded_file.read().decode('utf-8', errors='ignore')

            # Limit content length for API (max ~30k characters)
            if len(file_content) > 30000:
                file_content = file_content[:30000] + "\n\n[Content truncated due to length...]"

            # Create explanation prompt
            prompt = f"""Analyze and explain the following content from {subject} - {topic}:

{file_content}

Provide:
1. A clear explanation of the main concepts
2. Key points and takeaways
3. Examples if applicable
4. Any important notes or warnings

Format your response in a clear, educational manner."""

            response = gemini_model.generate_content(prompt)
            explanation = response.text

            return Response({
                'explanation': explanation,
                'references': [],
                'file_name': uploaded_file.name
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"File upload error: {error_details}")  # Log to console
            return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Text Explain View
class TextExplainView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            content = request.data.get('content', '')
            subject = request.data.get('subject', 'General')
            topic = request.data.get('topic', '')

            if not content:
                return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)

            if not gemini_model:
                return Response({'error': 'Gemini API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Create explanation prompt
            prompt = f"""Analyze and explain the following content from {subject} - {topic}:

{content}

Provide:
1. A clear explanation of the main concepts
2. Key points and takeaways
3. Examples if applicable
4. Any important notes or warnings

Format your response in a clear, educational manner."""

            response = gemini_model.generate_content(prompt)
            explanation = response.text

            return Response({
                'explanation': explanation,
                'references': []
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Chat Sessions Management
class ChatSessionListView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)
