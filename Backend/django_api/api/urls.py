from django.urls import path

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    health,
    MaterialListCreateView,
    MaterialRetrieveUpdateDestroyView,
    RegisterView,
    LogoutView,
    CurrentUserView,
    ChatView,
    QuizGenerateView,
    QuizSubmitView,
    FileExplainView,
    TextExplainView,
    DebugCodeView,
    ChatSessionListView,
    ChatSessionDetailView,
    GPAAdviceView,
    DashboardStatsView,
    QuizHistoryView,
    FlashcardGenerateView,
    StudyPlanGenerateView,
)

urlpatterns = [
    path("health/", health),
    # Material endpoints
    path('materials/', MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<int:pk>/', MaterialRetrieveUpdateDestroyView.as_view(), name='material-detail'),

    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),

    # Chat endpoints
    path('chat/', ChatView.as_view(), name='chat'),
    path('sessions/', ChatSessionListView.as_view(), name='chat-sessions'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),

    # Quiz endpoints
    path('quiz/generate/', QuizGenerateView.as_view(), name='quiz-generate'),
    path('quiz/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
    path('quiz/history/', QuizHistoryView.as_view(), name='quiz-history'),

    # Explain endpoints
    path('upload/explain/', FileExplainView.as_view(), name='file-explain'),
    path('explain/', TextExplainView.as_view(), name='text-explain'),
    path('debug/code/', DebugCodeView.as_view(), name='debug-code'),

    # GPA endpoint
    path('gpa/advice/', GPAAdviceView.as_view(), name='gpa-advice'),

    # Dashboard endpoint
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),

    # Flashcards endpoint
    path('flashcards/', FlashcardGenerateView.as_view(), name='flashcards-generate'),

    # Study Planner endpoint
    path('planner/', StudyPlanGenerateView.as_view(), name='planner-generate'),
]
