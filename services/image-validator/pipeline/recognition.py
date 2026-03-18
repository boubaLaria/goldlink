import requests
import base64
import json
import os
import re

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")

TRYON_TYPES = {"FACE", "NECK", "WRIST", "FINGER", "MULTI"}

PROMPT = """You are a jewelry expert. Analyze this image and respond ONLY with valid JSON.

Determine:
1. Is this image a jewelry piece (earring, necklace, bracelet, ring, chain, pendant, set)?
2. What try-on type applies?
   - FACE: earrings, ear cuffs
   - NECK: necklaces, chains, pendants, chokers
   - WRIST: bracelets, bangles, cuffs
   - FINGER: rings
   - MULTI: jewelry sets with multiple pieces

Respond ONLY with this JSON (no extra text):
{"isJewelry": true, "type": "FACE", "confidence": 0.95, "reason": "gold hoop earrings clearly visible"}
"""


def recognize_jewelry(image_bytes: bytes) -> tuple[bool, str | None, float, str | None]:
    """
    Appelle Ollama LLaVA pour reconnaître le bijou.
    Retourne (is_jewelry, detected_type, confidence, error)
    """
    try:
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        payload = {
            "model": "llava-llama3:8b",
            "prompt": PROMPT,
            "images": [image_b64],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1},
        }

        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
            timeout=60,
        )
        response.raise_for_status()

        raw = response.json().get("response", "")

        # Extraire le JSON de la réponse (LLaVA peut ajouter du texte autour)
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            return False, None, 0.0, "Le modèle n'a pas retourné de réponse valide."

        result = json.loads(match.group())

        is_jewelry = bool(result.get("isJewelry", False))
        detected_type = result.get("type", "").upper()
        confidence = float(result.get("confidence", 0.0))

        if detected_type not in TRYON_TYPES:
            detected_type = None

        return is_jewelry, detected_type, confidence, None

    except requests.exceptions.ConnectionError:
        return False, None, 0.0, "Service de reconnaissance indisponible."
    except Exception as e:
        return False, None, 0.0, f"Erreur de reconnaissance : {str(e)}"
