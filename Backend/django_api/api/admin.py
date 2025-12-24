from django.contrib import admin
from .models import Material

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "courseCode", "type")
    search_fields = ("title", "courseCode")
    list_filter = ("type", "courseCode")
