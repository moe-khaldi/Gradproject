from django.db import models

class Material(models.Model):
    title = models.CharField(max_length=200)
    courseCode = models.CharField(max_length=50)
    type = models.CharField(max_length=50)
    url = models.URLField()

    def __str__(self):
        return self.title
