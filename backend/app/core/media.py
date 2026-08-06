import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.models.enums import MediaType

MEDIA_ROOT = Path(__file__).resolve().parent.parent.parent / "media"
AVATAR_DIR = MEDIA_ROOT / "avatars"
POST_MEDIA_DIR = MEDIA_ROOT / "posts"
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
POST_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
VIDEO_CONTENT_TYPES = {"video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}

MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5MB
MAX_POST_MEDIA_BYTES = 50 * 1024 * 1024  # 50MB, generous enough for a short clip


def save_avatar(user_id: int, file: UploadFile) -> str:
    ext = IMAGE_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be JPEG, PNG, or WebP")

    contents = file.file.read(MAX_AVATAR_BYTES + 1)
    if len(contents) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be under 5MB")

    filename = f"{user_id}-{uuid.uuid4().hex}{ext}"
    (AVATAR_DIR / filename).write_bytes(contents)
    return f"/media/avatars/{filename}"


def save_post_media(user_id: int, file: UploadFile) -> tuple[str, MediaType]:
    content_type = file.content_type or ""
    if content_type in IMAGE_CONTENT_TYPES:
        ext = IMAGE_CONTENT_TYPES[content_type]
        media_type = MediaType.image
    elif content_type in VIDEO_CONTENT_TYPES:
        ext = VIDEO_CONTENT_TYPES[content_type]
        media_type = MediaType.video
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Media must be JPEG, PNG, WebP, MP4, WebM, or MOV",
        )

    contents = file.file.read(MAX_POST_MEDIA_BYTES + 1)
    if len(contents) > MAX_POST_MEDIA_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Media must be under 50MB")

    filename = f"{user_id}-{uuid.uuid4().hex}{ext}"
    (POST_MEDIA_DIR / filename).write_bytes(contents)
    return f"/media/posts/{filename}", media_type
