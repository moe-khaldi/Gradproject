from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_chatsession_chatmessage_quiz_quizsubmission'),
    ]

    operations = [
        migrations.AddField(
            model_name='material',
            name='owner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='materials', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='material',
            name='url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='material',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='materials/%Y/%m/%d/'),
        ),
        migrations.AddField(
            model_name='material',
            name='original_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='material',
            name='file_size',
            field=models.BigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='material',
            name='uploaded_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]
