from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.db.models import Avg, Q, Sum
from django.utils import timezone


def health(request):
    return JsonResponse({"status": "ok"})


from .models import Material, ChatSession, ChatMessage, Quiz, QuizSubmission
from .serializers import (
    MaterialSerializer, UserSerializer, RegisterSerializer,
    ChatSessionSerializer, ChatMessageSerializer, QuizSerializer, QuizSubmissionSerializer
)
from .rag_service import get_rag_service
import json

User = get_user_model()

class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        base_qs = Material.objects.filter(owner__isnull=True)
        if self.request.user.is_authenticated:
            base_qs = Material.objects.filter(
                Q(owner=self.request.user) | Q(owner__isnull=True)
            )
        return base_qs.order_by('-uploaded_at', '-id')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

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

            # Get recent conversation history for context
            recent_messages = ChatMessage.objects.filter(session=session).order_by('-created_at')[:5]
            conversation_history = [
                {'role': msg.role, 'content': msg.content}
                for msg in reversed(recent_messages)
            ]

            rag_result = get_rag_service().chat(
                message=message,
                subject=subject,
                context=context,
                history=conversation_history,
            )
            ai_response = rag_result['answer']

            # Save AI response
            ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response,
                context=context
            )

            return Response({
                'response': ai_response,
                'answer': ai_response,
                'route': rag_result.get('route'),
                'confidence': rag_result.get('confidence'),
                'session_id': session.id,
                'references': rag_result.get('references', []),
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

            type_mapping = {
                'multiple': 'multiple_choice',
                'boolean': 'true_false',
                'short': 'short_answer'
            }
            prompt_types = [type_mapping.get(t, t) for t in question_types]
            questions = get_rag_service().generate_quiz(
                subject=subject,
                topic=topic,
                num_questions=num_questions,
                difficulty=difficulty,
                question_types=prompt_types,
            )

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
                quiz = Quiz.objects.get(id=quiz_id, user=request.user)
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

    DAILY_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024

    def post(self, request):
        try:
            uploaded_file = request.FILES.get('file')
            subject = request.data.get('subject', 'General')
            topic = request.data.get('topic', '')

            if not uploaded_file:
                return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

            if uploaded_file.size > self.DAILY_UPLOAD_LIMIT_BYTES:
                return Response({'error': 'File too large. Maximum size per file is 10 MB'}, status=status.HTTP_400_BAD_REQUEST)

            today = timezone.localdate()
            used_bytes = Material.objects.filter(
                owner=request.user,
                uploaded_at__date=today,
                file__isnull=False,
            ).aggregate(total=Sum('file_size'))['total'] or 0

            if used_bytes + uploaded_file.size > self.DAILY_UPLOAD_LIMIT_BYTES:
                remaining = max(self.DAILY_UPLOAD_LIMIT_BYTES - used_bytes, 0)
                return Response(
                    {'error': f'Daily upload limit reached. You can upload {remaining} more bytes today.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Read file content
            file_content = uploaded_file.read().decode('utf-8', errors='ignore')

            # Limit content length for API (max ~30k characters)
            if len(file_content) > 30000:
                file_content = file_content[:30000] + "\n\n[Content truncated due to length...]"

            material = Material.objects.create(
                owner=request.user,
                title=uploaded_file.name,
                courseCode=subject,
                type=topic or 'Uploaded File',
                url='',
                file=uploaded_file,
                original_name=uploaded_file.name,
                file_size=uploaded_file.size,
            )

            explanation_result = get_rag_service().explain_text(file_content, subject, topic)

            return Response({
                'explanation': explanation_result['answer'],
                'references': explanation_result.get('references', []),
                'file_name': uploaded_file.name,
                'material': {
                    'id': material.id,
                    'title': material.title,
                    'courseCode': material.courseCode,
                    'type': material.type,
                    'file_url': request.build_absolute_uri(material.file.url) if material.file else None,
                    'file_size': material.file_size,
                    'uploaded_at': material.uploaded_at,
                },
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

            explanation_result = get_rag_service().explain_text(content, subject, topic)

            return Response({
                'explanation': explanation_result['answer'],
                'references': explanation_result.get('references', [])
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

# GPA Advice View
class GPAAdviceView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            gpa = request.data.get('gpa')
            courses = request.data.get('courses', [])

            if gpa is None:
                return Response({'error': 'GPA is required'}, status=status.HTTP_400_BAD_REQUEST)

            result = get_rag_service().gpa_advice(gpa=gpa, courses=courses)

            return Response({'advice': result['answer']}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Dashboard Stats View
class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            total_quizzes = Quiz.objects.filter(user=user).count()
            total_sessions = ChatSession.objects.filter(user=user).count()
            total_messages = ChatMessage.objects.filter(session__user=user, role='user').count()
            avg_score = QuizSubmission.objects.filter(quiz__user=user).aggregate(
                avg=Avg('score')
            )['avg']

            return Response({
                'total_quizzes': total_quizzes,
                'total_sessions': total_sessions,
                'total_messages': total_messages,
                'avg': round(avg_score) if avg_score is not None else 0,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Quiz History View
class QuizHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            submissions = QuizSubmission.objects.filter(
                quiz__user=request.user
            ).select_related('quiz').order_by('-submitted_at')

            history = [
                {
                    'topic': sub.quiz.topic,
                    'subject': sub.quiz.subject,
                    'score': sub.score,
                    'submitted_at': sub.submitted_at,
                    'total_questions': len(sub.quiz.questions or []),
                }
                for sub in submissions
            ]

            return Response(history, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Flashcard Generation View
class FlashcardGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            subject = request.data.get('subject', 'General')
            topic = request.data.get('topic', '')
            num_cards = request.data.get('num_cards', 8)

            if not topic:
                return Response({'error': 'Topic is required'}, status=status.HTTP_400_BAD_REQUEST)

            cards = get_rag_service().generate_flashcards(
                subject=subject,
                topic=topic,
                num_cards=num_cards,
            )

            return Response({'cards': cards}, status=status.HTTP_200_OK)

        except json.JSONDecodeError as e:
            return Response({'error': f'Failed to parse flashcards JSON: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Study Plan Generation View
class StudyPlanGenerateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        try:
            subject = request.data.get('subject', 'General')
            topics = request.data.get('topics', [])
            exam_date = request.data.get('exam_date', '')
            daily_hours = request.data.get('daily_hours', 2)

            if not topics:
                return Response({'error': 'Topics are required'}, status=status.HTTP_400_BAD_REQUEST)

            plan = get_rag_service().generate_study_plan(
                subject=subject,
                topics=topics,
                exam_date=exam_date,
                daily_hours=daily_hours,
            )

            return Response(plan, status=status.HTTP_200_OK)

        except json.JSONDecodeError as e:
            return Response({'error': f'Failed to parse study plan JSON: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
