from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
import tempfile
import requests

from pipeline.background import remove_background
from pipeline.recognition import recognize_jewelry
from pipeline.quality import check_quality

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
VALID_TYPES = {"FACE", "NECK", "WRIST", "FINGER", "MULTI"}

app = FastAPI(title="GoldLink Image Validator", version="1.0.0")


@app.get("/health")
def health():
    ollama_ok = False
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        ollama_ok = r.status_code == 200
    except Exception:
        pass
    return {"status": "ok", "ollama": ollama_ok}


@app.post("/validate")
async def validate_image(
    file: UploadFile = File(...),
    declared_type: str = Form(None),
):
    # Lecture du fichier
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 15MB).")

    errors = []
    warnings = []

    # ── Étape 1 : Suppression du fond ──────────────────────────────
    png_bytes, transparent_ratio, bg_error = remove_background(content)
    if bg_error:
        return JSONResponse({
            "valid": False,
            "errors": [bg_error],
            "warnings": [],
            "pngBase64": None,
            "detectedType": None,
            "confidence": 0.0,
            "typeMismatch": False,
        })

    # ── Étape 2 : Reconnaissance bijou (Ollama LLaVA) ──────────────
    is_jewelry, detected_type, confidence, recog_error = recognize_jewelry(png_bytes)

    if recog_error:
        # Ollama indisponible → on valide quand même la qualité sans la reconnaissance
        warnings.append("Reconnaissance IA indisponible. La validation manuelle sera requise.")
        detected_type = declared_type
        confidence = 0.0
    elif not is_jewelry or confidence < 0.65:
        errors.append("Aucun bijou reconnu dans cette image. Uploadez une photo du bijou seul sur fond uni.")
        return JSONResponse({
            "valid": False,
            "errors": errors,
            "warnings": [],
            "pngBase64": None,
            "detectedType": None,
            "confidence": confidence,
            "typeMismatch": False,
        })

    # Vérification concordance type déclaré vs détecté
    type_mismatch = False
    if (
        declared_type
        and declared_type.upper() in VALID_TYPES
        and detected_type
        and detected_type != declared_type.upper()
    ):
        type_mismatch = True
        warnings.append(
            f"Type détecté ({detected_type}) différent du type sélectionné ({declared_type.upper()}). "
            "Vérifiez votre sélection."
        )

    # ── Étape 3 : Contrôle qualité ─────────────────────────────────
    quality_errors = check_quality(png_bytes)
    errors.extend(quality_errors)

    if errors:
        return JSONResponse({
            "valid": False,
            "errors": errors,
            "warnings": warnings,
            "pngBase64": None,
            "detectedType": detected_type,
            "confidence": confidence,
            "typeMismatch": type_mismatch,
        })

    # ── Succès ─────────────────────────────────────────────────────
    import base64
    png_b64 = base64.b64encode(png_bytes).decode("utf-8")

    return JSONResponse({
        "valid": True,
        "errors": [],
        "warnings": warnings,
        "pngBase64": png_b64,
        "detectedType": detected_type or declared_type,
        "confidence": confidence,
        "typeMismatch": type_mismatch,
    })
