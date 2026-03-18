"""
GoldLink — Diffusers Try-On Service
Microservice FastAPI natif Mac (MPS / Apple Silicon)

Usage:
  pip install -r requirements.txt
  python server.py

API:
  GET  /health
  POST /generate   { user_image: base64, try_on_type: "FACE|NECK|WRIST|FINGER|MULTI" }
  GET  /status/:id { status: pending|processing|done|failed, output_image?: base64 }
"""

import threading
import uuid
import base64
import io
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── In-memory job store ────────────────────────────────────────────────────────
jobs: dict[str, dict] = {}

# ── Pipeline (chargé une seule fois au 1er appel) ─────────────────────────────
_pipeline = None
_pipeline_lock = threading.Lock()


def get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline
    with _pipeline_lock:
        if _pipeline is not None:
            return _pipeline

        import torch
        from diffusers import AutoPipelineForImage2Image

        if torch.backends.mps.is_available():
            device = "mps"
            dtype = torch.float16
            variant = "fp16"
            log.info("Using Apple Silicon MPS (Metal)")
        else:
            device = "cpu"
            dtype = torch.float32
            variant = None
            log.info("No MPS found — using CPU (slow)")

        log.info("Loading stabilityai/sdxl-turbo …")
        pipe = AutoPipelineForImage2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=dtype,
            variant=variant,
        ).to(device)

        pipe.enable_attention_slicing()
        _pipeline = pipe
        log.info("Pipeline ready on %s", device)
        return _pipeline


# ── Prompts par zone d'essayage ───────────────────────────────────────────────
PROMPTS = {
    "FACE":   "photorealistic portrait wearing gold earrings, natural skin tone, soft studio lighting, sharp focus, 8k",
    "NECK":   "photorealistic portrait wearing elegant gold necklace on neck, natural skin tone, soft studio lighting, sharp focus, 8k",
    "WRIST":  "photorealistic photo of wrist wearing gold bracelet, natural skin tone, soft studio lighting, sharp focus, 8k",
    "FINGER": "photorealistic photo of hand wearing gold ring on finger, natural skin tone, soft studio lighting, sharp focus, 8k",
    "MULTI":  "photorealistic portrait wearing gold jewelry set, natural skin tone, soft studio lighting, sharp focus, 8k",
}

NEGATIVE_PROMPT = (
    "blurry, low quality, cartoon, illustration, deformed, ugly, "
    "artifacts, watermark, text, overexposed, dark"
)


def run_generation(job_id: str, image_bytes: bytes, try_on_type: str):
    jobs[job_id]["status"] = "processing"
    try:
        from PIL import Image

        pipe = get_pipeline()

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((768, 768))
        prompt = PROMPTS.get(try_on_type, PROMPTS["NECK"])
        log.info("[%s] Generating — type=%s", job_id[:8], try_on_type)

        result = pipe(
            prompt=prompt,
            negative_prompt=NEGATIVE_PROMPT,
            image=img,
            num_inference_steps=4,   # SDXL-Turbo : 1-4 steps suffisent
            strength=0.35,           # préserve la pose, améliore le rendu
            guidance_scale=0.0,      # SDXL-Turbo ne supporte pas CFG > 0
        ).images[0]

        buf = io.BytesIO()
        result.save(buf, format="PNG")
        jobs[job_id]["output"] = base64.b64encode(buf.getvalue()).decode()
        jobs[job_id]["status"] = "done"
        log.info("[%s] Done", job_id[:8])

    except Exception as e:
        log.error("[%s] Failed: %s", job_id[:8], e)
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


# ── App ───────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("GoldLink Diffusers Try-On Service starting on :8189")
    yield
    log.info("Shutting down")

app = FastAPI(title="GoldLink Diffusers Try-On", version="1.0.0", lifespan=lifespan)


# ── Schémas ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    user_image: str                  # base64 (avec ou sans header data:...)
    try_on_type: str = "NECK"        # FACE | NECK | WRIST | FINGER | MULTI


class GenerateResponse(BaseModel):
    job_id: str


class StatusResponse(BaseModel):
    status: str                      # pending | processing | done | failed
    output_image: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    import torch
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    return {"status": "ok", "device": device, "model": "sdxl-turbo"}


@app.post("/generate", response_model=GenerateResponse, status_code=201)
def generate(body: GenerateRequest):
    image_b64 = body.user_image
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "output": None}

    thread = threading.Thread(
        target=run_generation,
        args=(job_id, image_bytes, body.try_on_type.upper()),
        daemon=True,
    )
    thread.start()

    log.info("[%s] Job created — type=%s", job_id[:8], body.try_on_type)
    return GenerateResponse(job_id=job_id)


@app.get("/status/{job_id}", response_model=StatusResponse)
def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return StatusResponse(status=job["status"], output_image=job.get("output"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8189, reload=False)
