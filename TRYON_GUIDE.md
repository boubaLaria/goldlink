# 🪞 Guide — Essayage Virtuel (Try-on)

**Fonctionnalité** : Essayer des bijoux en réalité augmentée via webcam ou photo importée, avec rendu IA haute qualité via ComfyUI.

---

## Architecture

```
Navigateur                    Serveur (Docker)
──────────────────────────    ──────────────────────────────────────
WebcamView / PhotoUploadView  app (Next.js)
  │ MediaPipe (CDN)             │ /api/tryon          → crée session
  │ Canvas overlay              │ /api/tryon/[id]     → polling statut
  │ Capture image               │ /api/tryon/status   → état services
  │                             │ /api/tryon/history  → historique
  │ base64 → POST /api/tryon    │
  │                             ├── image-validator (port 8090)
  │◄── sessionId ───────────────│     rembg + OpenCV + LLaVA
  │                             │
  │ polling toutes 2.5s         ├── ollama (port 11434)
  │ GET /api/tryon/[id]         │     llava-llama3:8b (détection bijou)
  │◄── status + outputImageUrl ─│
                                └── comfyui (port 8188)
                                      SDXL + IP-Adapter (rendu IA)
```

---

## Prérequis

### 1. Démarrer tous les services Docker

```bash
cd /Users/laria/ynov/labot/goldlink-front
docker compose up --build -d
```

### 2. Attendre que les services soient prêts

```bash
# Vérifier l'état de tous les services
docker compose ps

# Suivre les logs de l'app
docker compose logs -f app
# → Attendre "Ready in Xms"

# Ollama télécharge le modèle au 1er démarrage (~5 GB, peut prendre 10-15 min)
docker compose logs -f ollama-init
# → Attendre "llava-llama3:8b pulled successfully"

# ComfyUI démarre lentement (~2 min)
docker compose logs -f comfyui
# → Attendre "To see the GUI go to: http://0.0.0.0:8188"
```

### 3. Vérifier l'état des services IA

```bash
curl http://localhost:3000/api/tryon/status
```

Réponse attendue (services OK) :
```json
{
  "ollama": true,
  "comfyui": true,
  "fullFeatures": true,
  "previewOnly": false
}
```

| `fullFeatures` | `previewOnly` | État |
|---|---|---|
| `true` | `false` | ✅ Tout fonctionne — webcam + rendu IA |
| `false` | `true` | 🟡 Aperçu uniquement — webcam sans rendu IA |
| `false` | `false` | 🔴 Services indisponibles |

---

## Activer l'essayage sur un bijou (vendeur)

### Étape 1 — Ouvrir le dashboard vendeur

1. Se connecter : `fatima@goldlink.com` / `seller123`
2. Aller sur http://localhost:3000/dashboard/listings

### Étape 2 — Modifier un bijou

1. Cliquer sur l'icône ✏️ **Modifier** sur un bijou
2. Dans le Sheet latéral, scroller jusqu'à **"Essayage virtuel"**

### Étape 3 — Configurer le try-on

1. Activer le toggle **"Essayage virtuel"**
2. Sélectionner la **zone d'essayage** correspondant au bijou :

| Zone | Utiliser pour |
|---|---|
| Boucles d'oreilles / Oreilles | Boucles, pendants d'oreilles |
| Collier / Chaîne / Pendentif | Colliers, chaînes, pendentifs |
| Bracelet | Bracelets |
| Bague | Bagues, chevalières |
| Parure (plusieurs zones) | Sets complets |

3. Uploader une **image du bijou** (PNG recommandé, fond blanc/uni)
4. ✅ Feedback immédiat du microservice image-validator :
   - Vert → bijou validé, type détecté automatiquement
   - Rouge → raison de l'échec (qualité, taille, fond trop chargé...)

5. Cliquer **Enregistrer** → badge violet **Try-on** apparaît dans la table

> 💡 **Conseils pour l'image du bijou** :
> - Fond blanc ou uni (rembg retire le fond automatiquement)
> - Résolution minimale 400×400 px
> - Format PNG de préférence (transparence conservée)
> - Bijou bien centré, occupant au moins 25% de l'image
> - Image nette (flou = validation échouée)
> - Taille max 15 MB

---

## Tester l'essayage (acheteur)

### Étape 1 — Trouver un bijou avec try-on

**Option A** — Via le catalogue :
1. Aller sur http://localhost:3000/catalog
2. Activer le filtre **"Essayage virtuel uniquement"**
3. Cliquer sur un bijou avec le badge violet ✨

**Option B** — Directement :
```
http://localhost:3000/jewelry/[id]/try-on
```

### Étape 2 — Accéder à la page try-on

Sur la page détail du bijou :
- Services OK → bouton violet **"Essayer ce bijou en AR"**
- Services dégradés → bouton outline **"Essayer ce bijou"** + bandeau orange
- Services éteints → bouton désactivé

Cliquer le bouton → page `/jewelry/[id]/try-on`

> ⚠️ Connexion requise. Si non connecté → redirect vers `/login` puis retour automatique.

---

## Mode Webcam (temps réel)

### Utilisation

1. Onglet **"Caméra en direct"** (sélectionné par défaut)
2. Cliquer **"Démarrer la caméra"**
3. Autoriser l'accès à la caméra dans le navigateur
4. Pendant le chargement de MediaPipe : badge "Chargement détection…" en haut à droite
5. Une fois chargé : **le bijou apparaît en overlay** en temps réel

### Positionnement selon le type

| Type | Comment se positionner |
|---|---|
| **Boucles d'oreilles** | Regarder la caméra de face, oreilles visibles |
| **Collier** | Visage et cou visibles, regarder de face |
| **Bracelet** | Tendre le poignet vers la caméra |
| **Bague** | Présenter la main, doigt annulaire visible |
| **Parure** | Corps visible de face |

### Capture

1. Cadrer le bijou à la bonne position
2. Cliquer **"Capturer"**
3. ✅ Toast : "Photo envoyée, génération en cours…"
4. La page passe en mode **Rendu**

### Arrêter la caméra

- Cliquer **"Arrêter"** → flux coupé, retour à l'état initial

---

## Mode Photo (image statique)

### Utilisation

1. Onglet **"Importer une photo"**
2. Cliquer **"Choisir une photo"**
3. Sélectionner une photo JPG/PNG/WebP de soi
4. ✅ MediaPipe analyse la photo → bijou positionné automatiquement
5. Vérifier le résultat sur le canvas
6. Cliquer **"Essayer ce bijou"**

> 💡 **Conseils pour la photo** :
> - Bonne luminosité, visage/mains bien visibles
> - Résolution suffisante (> 500×500 px)
> - Pour les bagues/bracelets : photo de la main de face

---

## Suivi du rendu IA

### États de la session

```
PENDING     → En attente de traitement (ComfyUI en queue)
PROCESSING  → Génération du rendu en cours (~30-120s selon GPU)
DONE        → ✅ Rendu disponible
FAILED      → ❌ Erreur (relancer)
```

### Interface de suivi

```
┌─────────────────────────────────────────────┐
│ 🔄 Génération du rendu IA…    [mis à jour/2.5s] │
├───────────────────┬─────────────────────────┤
│                   │                         │
│  Photo originale  │   Rendu IA              │
│  [votre capture]  │   [résultat ComfyUI]    │
│                   │   (spinner pendant)     │
│                   │                         │
└───────────────────┴─────────────────────────┘
       [Télécharger]  [Nouvel essayage]  [Supprimer]
```

### Toasts de notification

| Événement | Notification |
|---|---|
| Photo envoyée | ℹ️ "Photo envoyée, génération en cours…" |
| PROCESSING | ℹ️ "Génération du rendu IA en cours…" |
| DONE | ✅ "Rendu généré avec succès !" |
| FAILED | ❌ "Le rendu a échoué. Réessayez." |

### Durée typique

- Avec GPU : 15–30 secondes
- CPU uniquement : 2–5 minutes
- Si ComfyUI est en queue : délai supplémentaire

---

## Historique des essayages

1. Aller sur http://localhost:3000/dashboard/tryon-history
2. ✅ Grille de toutes les sessions avec thumbnail + statut + date
3. **"Réessayer"** → retour sur la page try-on du bijou
4. Icône 🗑️ → supprime la session + toast confirmation

---

## Debug & résolution de problèmes

### Webcam ne démarre pas
```
Cause : permissions navigateur refusées
Fix   : Cliquer l'icône cadenas dans la barre d'adresse → Autoriser la caméra → Recharger
```

### MediaPipe ne se charge pas (overlay absent)
```
Cause : CDN inaccessible ou réseau lent
Fix   : Vérifier la connexion internet (WASM chargé depuis cdn.jsdelivr.net)
        Attendre le badge "Chargement détection…" disparaisse (30-60s la 1ère fois)
```

### image-validator retourne une erreur
```bash
# Vérifier que le service tourne
curl http://localhost:8090/health
# → {"status": "ok", "model": "u2net"}

# Logs du service
docker compose logs image-validator

# Causes fréquentes :
# - Image trop petite (< 400×400)
# - Fond trop chargé (utiliser fond blanc/uni)
# - Bijou peu visible (< 25% de l'image)
# - Fichier > 15 MB
```

### ComfyUI ne génère pas (session reste PENDING)
```bash
# Vérifier ComfyUI
curl http://localhost:8188/system_stats

# Logs
docker compose logs comfyui

# Causes fréquentes :
# - Modèles SDXL/IP-Adapter non téléchargés (1er démarrage)
# - GPU VRAM insuffisante (ComfyUI passe en mode CPU → plus lent)
# - Queue ComfyUI saturée → attendre
```

### Ollama / modèle non disponible
```bash
# Vérifier Ollama
curl http://localhost:11434/api/tags
# → doit contenir "llava-llama3:8b"

# Forcer le re-pull du modèle
docker compose restart ollama-init

# Logs du pull
docker compose logs ollama-init
```

### Reset complet
```bash
docker compose down -v && docker compose up --build -d
```

---

## Endpoints API try-on

| Méthode | URL | Description |
|---|---|---|
| `GET` | `/api/tryon/status` | État des services IA |
| `POST` | `/api/tryon` | Créer une session (body: `{jewelryId, inputImage, mode}`) |
| `GET` | `/api/tryon/[sessionId]` | Polling statut + résultat |
| `DELETE` | `/api/tryon/[sessionId]` | Supprimer une session |
| `GET` | `/api/tryon/history` | Historique de l'utilisateur |
| `POST` | `/api/uploads?purpose=tryon` | Valider + uploader image bijou |

---

## Données de test

Pour tester rapidement sans activer manuellement, des bijoux avec try-on peuvent être créés via la seed :

```bash
# Vérifier les bijoux avec tryOnAvailable = true
docker exec goldlink-postgres psql -U goldlink -d goldlink \
  -c 'SELECT id, title, "tryOnType", "tryOnImageUrl" FROM "Jewelry" WHERE "tryOnAvailable" = true;'

# Voir les sessions existantes
docker exec goldlink-postgres psql -U goldlink -d goldlink \
  -c 'SELECT id, status, mode, "createdAt" FROM "TryOnSession" ORDER BY "createdAt" DESC LIMIT 5;'
```
