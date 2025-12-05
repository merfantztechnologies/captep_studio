import uuid
from django.db import models

class RunProcess(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    port = models.IntegerField()
    pid = models.IntegerField()
    status = models.CharField(max_length=20, choices=[('active', 'active'), ('inactive', 'inactive')])
    workflow_id = models.TextField()
    temp_file_path = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "run_process"
        managed = False 