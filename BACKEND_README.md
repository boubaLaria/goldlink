# GoldLink - Jewelry Marketplace Backend

Système complet de marketplace pour location et vente de bijoux avec backend API fullstack intégré.

## 📋 Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [Développement local](#développement-local)
- [Docker](#docker)
- [API Documentation](#api-documentation)
- [Base de données](#base-de-données)

## 🚀 Démarrage rapide

### Docker (Recommandé)

```bash
# Cloner et entrer dans le répertoire
cd goldlink-front

# Démarrer les services
docker-compose up -d

# Les migrations seront appliquées automatiquement
# L'app est accessible à http://localhost:3000
# Adminer (GUI DB) est à http://localhost:8080
```

### Développement local

```bash
# Installer les dépendances
npm install

# Copier le fichier d'env
cp .env.example .env.local

# Créer les migrations de base de données
npm run db:migrate

# Charger les données de seed (optionnel)
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

## 🏗️ Architecture

### Stack Technique

- **Frontend**: Next.js 16 + React 18 + TypeScript
- **Backend**: Next.js API Routes
- **Base de données**: PostgreSQL 17
- **ORM**: Prisma
- **Authentification**: JWT (Access + Refresh Tokens)
- **Uploads**: Disque local (public/uploads)
- **Container**: Docker + Docker Compose

### Structure du projet

```
app/
├── api/                 # Backend API Routes
│   ├── auth/           # Authentification
│   ├── jewelry/        # Bijoux
│   ├── bookings/       # Réservations
│   ├── messages/       # Messagerie
│   ├── reviews/        # Avis
│   ├── estimations/    # Estimations
│   └── uploads/        # Uploads fichiers
└── [routes frontend]   # Pages publiques et protégées

lib/
├── api-client.ts       # Client API avec auth
├── auth.ts             # Utilitaires JWT
├── db.ts               # Client Prisma
├── middleware.ts       # Helpers pour API routes
└── hooks/              # React hooks custom
    ├── use-auth.ts
    ├── use-jewelry.ts
    ├── use-bookings.ts
    └── ...

prisma/
├── schema.prisma       # Modèles de données
└── seed.ts             # Données par défaut
```

## 💻 Développement local

### Variables d'environnement

Créer `.env.local`:

```
DATABASE_URL="postgresql://goldlink:goldlink_password@localhost:5432/goldlink"
JWT_ACCESS_SECRET="dev-secret-access-key"
JWT_REFRESH_SECRET="dev-secret-refresh-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

### Commandes utiles

```bash
# Créer et appliquer migrations
npm run db:migrate

# Réinitialiser la DB complètement
npm run db:reset

# Charger les données de seed
npm run db:seed

# Ouvrir Prisma Studio (GUI DB)
npm run db:studio

# Démarrer en développement
npm run dev

# Builder pour production
npm run build

# Démarrer en production
npm run start
```

## 🐳 Docker

### Architecture Docker

```
┌─────────────────────────────────────┐
│   Docker Network: goldlink-network  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────┐  ┌──────────┐  │
│  │  app:3000       │  │ postgres │  │
│  │  Next.js        │──│ :5432    │  │
│  └─────────────────┘  └──────────┘  │
│           │                         │
│           └─ public/uploads (volume)│
│                                     │
│  ┌──────────────────────────────┐   │
│  │  adminer:8080 (optionnel)    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Commandes Docker

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Arrêter les services
docker-compose down

# Réinitialiser la DB (attention!)
docker-compose down -v

# Reconstruire l'image
docker-compose up -d --build

# Exécuter une commande dans le container
docker-compose exec app npm run db:seed
```

### Accès aux services

- **App**: http://localhost:3000
- **Adminer (DB GUI)**: http://localhost:8080
  - Server: `postgres`
  - User: `goldlink`
  - Password: `goldlink_password`
  - Database: `goldlink`

## 📚 API Documentation

### Authentification

```
POST /api/auth/register
Body: { email, password, firstName, lastName, phone, role }
Response: { user, accessToken, refreshToken }

POST /api/auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }

POST /api/auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }

GET /api/auth/me (PROTECTED)
Response: { user }
```

### Bijoux

```
GET /api/jewelry?type=NECKLACE&purity=K18&minPrice=10000&maxPrice=50000
Response: { data: [], pagination: { total, limit, skip } }

POST /api/jewelry (PROTECTED)
Body: { title, description, images[], type, weight, purity, ... }
Response: { jewelry }

GET /api/jewelry/[id]
Response: { jewelry, owner, reviews[] }

PATCH /api/jewelry/[id] (PROTECTED - Propriétaire)
Body: { title, description, ... }
Response: { jewelry }

DELETE /api/jewelry/[id] (PROTECTED - Propriétaire)
Response: { success: true }
```

### Réservations

```
GET /api/bookings (PROTECTED)
Response: { data: [], pagination }

POST /api/bookings (PROTECTED)
Body: { jewelryId, startDate, endDate, insurance }
Response: { booking }

GET /api/bookings/[id] (PROTECTED)
Response: { booking }

PATCH /api/bookings/[id] (PROTECTED - Propriétaire)
Body: { status }
Response: { booking }
```

### Messagerie

```
GET /api/messages?conversationId=... (PROTECTED)
Response: { data: [], pagination }

POST /api/messages (PROTECTED)
Body: { receiverId, content, images[] }
Response: { message }

GET /api/messages/[conversationId] (PROTECTED)
Response: { data: [], pagination }
```

### Avis

```
GET /api/reviews?targetId=...&targetType=jewelry
Response: { data: [], pagination }

POST /api/reviews (PROTECTED)
Body: { targetId, targetType, rating, comment, bookingId }
Response: { review }
```

### Estimations

```
GET /api/estimations (PROTECTED)
Response: { data: [], pagination }

POST /api/estimations (PROTECTED)
Body: { images[], weight, purity }
Response: { estimation }
```

### Uploads

```
POST /api/uploads (PROTECTED)
Form Data: file, category (jewelry|avatars|estimations)
Response: { url, filename, category }
```

## 🗄️ Base de Données

### Modèles Prisma

- **User**: Utilisateurs (4 rôles: BUYER, SELLER, JEWELER, ADMIN)
- **Jewelry**: Annonces de bijoux
- **Booking**: Réservations
- **Transaction**: Transactions financières
- **Message**: Messages entre utilisateurs
- **Conversation**: Conversations avec lastMessage
- **Review**: Avis sur bijoux ou utilisateurs
- **Estimation**: Estimations de valeur

### Données de seed

Le script seed crée automatiquement:

- **4 utilisateurs de test**:
  - Admin: `admin@goldlink.com` / `admin123`
  - Seller: `fatima@goldlink.com` / `seller123`
  - Jeweler: `karim@goldlink.com` / `jeweler123`
  - Buyer: `amina@goldlink.com` / `buyer123`

- **6 annonces de bijoux**
- **1 réservation confirmée**
- **2 avis**
- **1 estimation**
- **1 conversation avec messages**

## 🔐 Sécurité

### Authentification JWT

- **Access Token**: Expire en 15 minutes
- **Refresh Token**: Expire en 7 jours
- Secrets à changer en production dans `.env`

### Middleware d'authentification

Toutes les routes protégées verificient:
- Présence du token Bearer dans les headers
- Validité du JWT
- Existence de l'utilisateur en BD

### Rôles et permissions

- **Propriétaire bijou**: Peut modifier/supprimer ses annonces
- **Vendeur**: Peut créer des annonces
- **Admin**: Accès complet

## 🐛 Troubleshooting

### Erreur de connexion BD

```bash
# Vérifier que postgres est accessible
docker-compose ps

# Voir les logs postgres
docker-compose logs postgres

# Réinitialiser la BD
docker-compose down -v
docker-compose up -d
```

### Erreur de migration

```bash
# Forcer une migration
docker-compose exec app npx prisma migrate reset

# Ou avec npm en local
npm run db:reset
```

### Tokens expirés

Les tokens sont automatiquement rafraîchis par le client API. Si ça ne fonctionne pas:
- Nettoyer localStorage
- Se reconnecter
- Vérifier les secrets JWT dans .env

## 📝 Notes

- Uploads stockés dans `public/uploads/` (persisté avec Docker volume)
- Les images sont servies statiquement via `/uploads/...`
- Commissions: 5% sur location, à adapter dans `/api/bookings`
- Gold prices: Définies dans `/api/estimations`, à mettre à jour régulièrement

## 🚢 Déploiement

### Production avec Docker

```bash
# Construire l'image
docker build -t goldlink:latest .

# Démarrer avec variables de production
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="long-random-secret" \
  -e JWT_REFRESH_SECRET="long-random-secret" \
  -e NODE_ENV="production" \
  -v goldlink-uploads:/app/public/uploads \
  goldlink:latest
```

### Avec Vercel (Alternative)

- Déployer le repo sur Vercel
- Connecter une DB Vercel Postgres
- Variables d'env via Vercel dashboard

## 📞 Support

Pour les erreurs ou questions:
1. Vérifier les logs: `docker-compose logs app`
2. Vérifier la BD: Adminer sur http://localhost:8080
3. Vérifier les variables d'env
4. Réinitialiser si nécessaire: `docker-compose down -v`
