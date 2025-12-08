import uuid
from django.db import models

def upload_to_fetched(instance, filename):
    return f"fetched/{instance.id}/{filename}"

class RemoteDocument(models.Model):
    """
    Store scraped documents and computed NLP metadata.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(max_length=2000)
    source = models.CharField(max_length=255, null=True, blank=True)  # friendly name
    raw_text = models.TextField(null=True, blank=True)               # raw scraped text
    content_file = models.FileField(upload_to=upload_to_fetched, null=True, blank=True)
    content_size = models.BigIntegerField(null=True, blank=True)
    entities = models.JSONField(null=True, blank=True)               # list of (word, label)
    tags = models.JSONField(null=True, blank=True)                   # list of tags
    severity = models.FloatField(null=True, blank=True)
    probability = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.source or self.url} ({self.id})"
