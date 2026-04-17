import os
import logging

logger = logging.getLogger(__name__)

_configured = False

def _configure():
    global _configured
    if _configured:
        return
    cloud = os.getenv("CLOUDINARY_CLOUD_NAME")
    key = os.getenv("CLOUDINARY_API_KEY")
    secret = os.getenv("CLOUDINARY_API_SECRET")
    if not (cloud and key and secret):
        return
    try:
        import cloudinary
        cloudinary.config(cloud_name=cloud, api_key=key, api_secret=secret, secure=True)
        _configured = True
    except Exception as e:
        logger.warning(f"Cloudinary config error: {e}")


def upload_image(file_bytes: bytes, folder: str = "reportes") -> str | None:
    """Upload bytes to Cloudinary. Returns secure_url or None if not configured."""
    _configure()
    if not _configured:
        return None
    try:
        import cloudinary.uploader
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="image",
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return None
