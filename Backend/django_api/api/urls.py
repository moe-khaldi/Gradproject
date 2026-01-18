from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
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
    ChatSessionListView,
    ChatSessionDetailView,
)

urlpatterns = [
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

    # Explain endpoints
    path('upload/explain/', FileExplainView.as_view(), name='file-explain'),
    path('explain/', TextExplainView.as_view(), name='text-explain'),
]
