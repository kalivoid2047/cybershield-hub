import os
import uuid

from django.core.exceptions import ValidationError

ALLOWED_UPLOAD_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf", ".txt", ".log", ".eml", ".msg"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def validate_evidence_upload(file_obj):
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise ValidationError("Unsupported evidence file type.")
    if file_obj.size > MAX_UPLOAD_SIZE:
        raise ValidationError("Evidence file exceeds the 10 MB limit.")


def evidence_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return f"incident-evidence/{instance.incident.reference_number}/{safe_name}"
