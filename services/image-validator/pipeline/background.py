from PIL import Image
from rembg import remove, new_session
import io
import numpy as np

# Session réutilisable (modèle chargé une seule fois)
_session = new_session("u2net")


def has_transparency(img: Image.Image) -> bool:
    """Vérifie si l'image a déjà un canal alpha avec du transparent."""
    if img.mode != "RGBA":
        return False
    arr = np.array(img)
    alpha = arr[:, :, 3]
    transparent_ratio = np.sum(alpha < 10) / alpha.size
    return transparent_ratio > 0.1


def remove_background(image_bytes: bytes) -> tuple[bytes, float, str | None]:
    """
    Supprime le fond de l'image.
    Retourne (png_bytes, transparent_ratio, error_message)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        if has_transparency(img):
            # Déjà transparent — vérifier quand même le ratio
            arr = np.array(img)
            alpha = arr[:, :, 3]
            transparent_ratio = np.sum(alpha < 10) / alpha.size
        else:
            # Supprimer le fond avec rembg
            output = remove(image_bytes, session=_session)
            img = Image.open(io.BytesIO(output)).convert("RGBA")
            arr = np.array(img)
            alpha = arr[:, :, 3]
            transparent_ratio = np.sum(alpha < 10) / alpha.size

        if transparent_ratio < 0.3:
            return b"", 0.0, "Le fond n'a pas pu être correctement supprimé. Utilisez une photo sur fond uni."

        # Retourner en PNG
        out = io.BytesIO()
        img.save(out, format="PNG")
        return out.getvalue(), transparent_ratio, None

    except Exception as e:
        return b"", 0.0, f"Erreur lors du traitement de l'image : {str(e)}"
