from django.urls import path
from .views import (
    MaterialListCreateView,
    MaterialRetrieveUpdateDestroyView,
)

urlpatterns = [
    path('materials/', MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<int:pk>/', MaterialRetrieveUpdateDestroyView.as_view(), name='material-detail'),
]
