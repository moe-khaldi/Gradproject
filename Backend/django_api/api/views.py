from django.shortcuts import render
from rest_framework import generics
from .models import Material
from .serializers import MaterialSerializer


class MaterialListCreateView(generics.ListCreateAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer


class MaterialRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
