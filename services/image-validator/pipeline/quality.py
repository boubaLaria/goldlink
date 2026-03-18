from PIL import Image
import numpy as np
import cv2
import io

MIN_WIDTH = 400
MIN_HEIGHT = 400
MIN_JEWELRY_COVERAGE = 0.20  # bijou doit couvrir au moins 20% de l'image
MIN_SHARPNESS = 100.0         # score Laplacian minimum
MAX_ASPECT_RATIO = 4.0        # pas plus de 4:1 (largeur/hauteur ou inverse)


def check_quality(image_bytes: bytes) -> list[str]:
    """
    Vérifie la qualité de l'image PNG (avec fond transparent).
    Retourne une liste d'erreurs (vide = OK).
    """
    errors = []

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        width, height = img.size

        # 1. Résolution minimale
        if width < MIN_WIDTH or height < MIN_HEIGHT:
            errors.append(
                f"Image trop petite ({width}×{height}px). Minimum requis : {MIN_WIDTH}×{MIN_HEIGHT}px."
            )

        # 2. Ratio dimensions
        aspect = max(width, height) / max(min(width, height), 1)
        if aspect > MAX_ASPECT_RATIO:
            errors.append("Proportions trop extrêmes. Utilisez une image plus carrée.")

        # 3. Couverture du bijou (pixels non-transparents)
        arr = np.array(img)
        alpha = arr[:, :, 3]
        visible_pixels = np.sum(alpha > 10)
        total_pixels = alpha.size
        coverage = visible_pixels / total_pixels

        if coverage < MIN_JEWELRY_COVERAGE:
            errors.append(
                f"Le bijou occupe trop peu de surface ({coverage:.0%}). Recadrez l'image sur le bijou."
            )

        # 4. Netteté (sur la zone visible uniquement)
        gray = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2GRAY)
        # Appliquer le masque alpha pour ne noter que la zone du bijou
        mask = (alpha > 10).astype(np.uint8)
        if mask.sum() > 0:
            masked_gray = gray * mask
            laplacian = cv2.Laplacian(masked_gray, cv2.CV_64F)
            sharpness = laplacian.var()
            if sharpness < MIN_SHARPNESS:
                errors.append("Image trop floue. Utilisez une photo nette avec un bon éclairage.")

    except Exception as e:
        errors.append(f"Impossible d'analyser l'image : {str(e)}")

    return errors
