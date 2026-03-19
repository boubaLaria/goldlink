# ✅ Ce qui reste à faire — GoldLink Try-On

> Dernière mise à jour : 18 mars 2026

---

## 🔴 Priorité 1 — Bloquant

### 1. Retraiter les images bijoux avec BRIA RMBG (qualité médiocre avec u2net actuel)

Les 9 PNGs actuels ont été générés avec `u2net` (qualité insuffisante).
`tryon-earrings-gold` est aussi manquant dans `prisma/seeds/images/`.

**Option A — BRIA RMBG-2.0 (meilleure qualité, gated)**
```bash
# 1. Créer compte sur https://huggingface.co
# 2. Accepter les conditions : https://huggingface.co/briaai/RMBG-2.0
# 3. Créer un token : https://huggingface.co/settings/tokens
huggingface-cli login   # coller le token
python3 scripts/rembg_bria2.py
```

**Option B — RMBG-1.4 (accès libre, très bon)**
```bash
python3 - <<'EOF'
from transformers import AutoModelForImageSegmentation
import torch
from torchvision import transforms
from PIL import Image
import pathlib

model = AutoModelForImageSegmentation.from_pretrained("briaai/RMBG-1.4", trust_remote_code=True)
model.eval()
device = "mps" if torch.backends.mps.is_available() else "cpu"
model = model.to(device)

transform = transforms.Compose([
    transforms.Resize((1024, 1024)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

SRC = pathlib.Path("prisma/seeds/images")
for jpg in sorted(SRC.glob("tryon-*.jpg")):
    img = Image.open(jpg).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        mask = model(tensor)[-1].sigmoid().cpu().squeeze()
    mask_pil = transforms.ToPILImage()(mask).resize(img.size, Image.LANCZOS)
    out = img.convert("RGBA")
    r, g, b, _ = out.split()
    Image.merge("RGBA", [r, g, b, mask_pil]).save(jpg.with_suffix(".png"), "PNG")
    print(f"  ✓ {jpg.stem}.png")
EOF
```

---

### 2. Image manquante — `tryon-earrings-gold.jpg`

```bash
python3 - <<'EOF'
import urllib.request, pathlib
dest = pathlib.Path("prisma/seeds/images/tryon-earrings-gold.jpg")
url  = "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=600&auto=format&q=85"
headers = {"User-Agent": "Mozilla/5.0 Chrome/120.0.0.0"}
with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=15) as r:
    dest.write_bytes(r.read())
print(f"✓ {dest.stat().st_size // 1024} KB")
EOF
```
Puis relancer le script BRIA pour générer le `.png` correspondant.

---

### 3. Rebuild Docker complet (appliquer tous les changements)

Plusieurs changements n'ont pas encore été appliqués en production :
- `seed.ts` : helpers `J()` catalogue JPG / `P()` essayage PNG séparés
- `webcam-view.tsx` : vidéo visible dès activation (sans attendre MediaPipe)
- `tryon-overlay.ts` : shadow + blend mode `multiply`
- `app/api/tryon/` : utilise Diffusers au lieu de ComfyUI
- `docker-compose.yml` : suppression ollama/comfyui Docker → services natifs Mac

```bash
docker compose down -v && docker compose up --build -d
```

---

## 🟡 Priorité 2 — Fonctionnel mais non testé

### 4. Service Diffusers Try-On (Python natif Mac)

Le microservice est créé (`services/diffusers-tryon/`) mais jamais lancé.

```bash
# Installation (une seule fois)
pip install -r services/diffusers-tryon/requirements.txt

# Lancement (télécharge sdxl-turbo ~6 GB au 1er appel)
python services/diffusers-tryon/server.py

# Vérification
curl http://localhost:8189/health
# → {"status":"ok","device":"mps","model":"sdxl-turbo"}

curl http://localhost:3000/api/tryon/status
# → {"ollama":true,"diffusers":true,"fullFeatures":true,"previewOnly":false}
```

---

### 5. Ollama — modèle llava requis

Pour la validation d'image bijou (image-validator → reconnaissance IA).

```bash
ollama serve                        # démarrer le serveur
ollama pull llava-llama3:8b         # puller le modèle (~5 GB, une seule fois)
curl http://localhost:11434/api/tags | grep llava   # vérifier
```

---

## 🟢 Priorité 3 — Optionnel

### 6. Fal.ai — Rendu IA cloud (alternative à Diffusers local)

Pour un rendu pro sans GPU local. Compatible avec le workflow ComfyUI existant (`buildTryOnWorkflow`).
- Créer compte sur [fal.ai](https://fal.ai)
- Ajouter `FAL_API_KEY` dans `.env.docker`
- Remplacer `diffusers.service.ts` par appel `fal-ai/comfyui`
- Résultat : rendu IA pro, ~5s, sans GPU

### 7. Mettre à jour TRYON_GUIDE.md

Le guide actuel référence encore ComfyUI Docker et Ollama Docker.
À mettre à jour pour refléter l'architecture actuelle :
- Ollama natif Mac (`ollama serve`)
- Diffusers natif Mac (`python services/diffusers-tryon/server.py`)
- ComfyUI → remplacé par Diffusers ou Fal.ai

---

## 📋 Résumé

| # | Tâche | Statut | Temps |
|---|-------|--------|-------|
| 1 | Retraiter PNGs avec BRIA RMBG-1.4 ou 2.0 | 🔴 Bloquant | 30 min |
| 2 | Télécharger `tryon-earrings-gold.jpg` manquant | 🔴 Bloquant | 2 min |
| 3 | Rebuild Docker complet | 🔴 Requis après 1+2 | 5 min |
| 4 | Lancer service Diffusers (rendu IA local) | 🟡 Requis pour fullFeatures | 15 min |
| 5 | Puller `llava-llama3:8b` dans Ollama | 🟡 Requis pour validation vendeur | 15 min |
| 6 | Fal.ai cloud render | 🟢 Optionnel | 1h |
| 7 | Mise à jour TRYON_GUIDE.md | 🟢 Optionnel | 20 min |
