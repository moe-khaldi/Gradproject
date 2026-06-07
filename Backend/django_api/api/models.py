from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_student = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

class Material(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    title = models.CharField(max_length=200)
    courseCode = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='materials/%Y/%m/%d/', blank=True, null=True)
    original_name = models.CharField(max_length=255, blank=True)
    file_size = models.BigIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def clean(self):
        if not self.url and not self.file:
            raise ValidationError('Either a URL or an uploaded file is required.')

    def delete(self, *args, **kwargs):
        stored_file = self.file
        super().delete(*args, **kwargs)
        if stored_file:
            stored_file.delete(save=False)

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    subject = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.subject} - {self.created_at}"

    class Meta:
        ordering = ['-updated_at']

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=[('user', 'User'), ('assistant', 'Assistant')])
    content = models.TextField()
    context = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"

    class Meta:
        ordering = ['created_at']

class Quiz(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=20, default='medium')
    questions = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} - {self.topic} - {self.user.email}"

    class Meta:
        ordering = ['-created_at']

class QuizSubmission(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    answers = models.JSONField()
    score = models.FloatField()
    feedback = models.JSONField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz {self.quiz.id} - Score: {self.score}"

    class Meta:
        ordering = ['-submitted_at']
