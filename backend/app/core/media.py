import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

MEDIA_ROOT = Path(__file__).resolve().parent.parent.parent / "media"
AVATAR_DIR = MEDIA_ROOT / "avatars"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB


def save_avatar(user_id: int, file: UploadFile) -> str:
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be JPEG, PNG, or WebP"
        )

    contents = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be under 5MB")

    filename = f"{user_id}-{uuid.uuid4().hex}{ext}"
    (AVATAR_DIR / filename).write_bytes(contents)
    return f"/media/avatars/{filename}"
