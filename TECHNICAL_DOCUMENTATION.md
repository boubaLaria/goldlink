# GoldLink - Documentation Technique Complète

## 📋 Vue d'ensemble du Projet

**GoldLink** est une plateforme marketplace pour la location et vente de bijoux haut de gamme. Il combine:
- **Frontend**: React 18 + Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: API Routes Next.js + Prisma ORM + PostgreSQL
- **Auth**: JWT (Access Token 15min + Refresh Token 7 jours) + bcrypt
- **Deployment**: Docker Compose avec PostgreSQL, App, Adminer

---

## 🏗️ Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React Components + Hooks)                        │
│  - Pages: Catalog, Dashboard, Bookings, Messages, etc      │
│  - Hooks: useAuth, useJewelry, useBookings, useMessages    │
│  - State: localStorage (JWT tokens) + React Hooks           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ (Fetch + JWT Authorization)
┌─────────────────────────────────────────────────────────────┐
│  API Routes (Next.js 13 App Router)                         │
│  /api/auth/*, /api/jewelry/*, /api/bookings/*, etc         │
│  - Authentication middleware                                │
│  - Error handling                                            │
│  - File uploads (multer)                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ (Prisma ORM Queries)
┌─────────────────────────────────────────────────────────────┐
│  Prisma Client + PostgreSQL                                 │
│  - 8 models: User, Jewelry, Booking, Message, etc          │
│  - 20+ relations and indexes                                │
│  - Prisma migrations                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Stack Technique

### Frontend
```
React 18.2.0
├── Next.js 16.0.0 (App Router)
├── TypeScript 5
├── Tailwind CSS 3
├── Radix UI (composants)
├── React Hook Form
├── Zustand (state management - sera remplacé par hooks API)
└── sonner (notifications toast)
```

### Backend
```
Node.js 20+
├── Prisma 6.19.2 (ORM)
├── PostgreSQL 17 (database)
├── jsonwebtoken (JWT)
├── bcryptjs (passwords)
├── multer (file uploads)
└── uuid (identifiants)
```

### DevOps
```
Docker
├── Multi-stage Dockerfile
├── docker-compose.yml (3 services)
├── PostgreSQL container
└── Adminer pour DB management
```

---

## 📊 Base de Données - Schéma Prisma

### 8 Modèles Principaux

#### 1. **User**
```prisma
model User {
  id, email (unique), name, bio, avatar
  password (hashed), role (BUYER|SELLER|JEWELER|ADMIN)
  location, phone, isVerified
  → Jewelry (listings), Bookings, Messages, Reviews, Estimations
}
```

#### 2. **Jewelry**
```prisma
model Jewelry {
  id, title, description, type (NECKLACE|BRACELET|RING|EARRINGS|PENDANT|CHAIN)
  purity (K8|K10|K14|K18|K22|K24), weight, rentPricePerDay, salePrice
  status (AVAILABLE|RENTED|SOLD), location
  images[], views, createdAt, ownerId → User
}
```

#### 3. **Booking** (Location)
```prisma
model Booking {
  id, startDate, endDate, days (calculé)
  totalPrice, deposit, status (PENDING|CONFIRMED|ACTIVE|COMPLETED)
  renterId → User, jewelry → Jewelry
}
```

#### 4. **Message**
```prisma
model Message {
  id, content, images[], read
  sender → User, receiver → User
  conversation → Conversation
}
```

#### 5. **Conversation**
```prisma
model Conversation {
  user1Id / user2Id (sorted), messages[] relation
}
```

#### 6. **Review**
```prisma
model Review {
  id, rating (1-5), comment, createdAt
  reviewer → User, targetId (jewelry|user), targetType
  → Jewelry (recalcules rating/count)
}
```

#### 7. **Transaction**
```prisma
model Transaction {
  id, amount, status (PENDING|COMPLETED|FAILED)
  type (PAYMENT|DEPOSIT_REFUND), booking → Booking
  createdAt, metadata (JSON)
}
```

#### 8. **Estimation** (Gold value)
```prisma
model Estimation {
  id, weight, purity
  estimatedGoldValue, commercialValue
  confidence (0.7|0.95), images[]
  creator → User, createdAt
}
```

---

## 🔐 Authentification & Autorisation

### Flow JWT
1. **Register** (`POST /api/auth/register`)
   - Email + Password → hash bcrypt → User créé
   - Retour: access_token (15min) + refresh_token (7j)

2. **Login** (`POST /api/auth/login`)
   - Email + Password → bcrypt verify → tokens générés
   - Tokens stockés dans localStorage (frontend)

3. **Refresh** (`POST /api/auth/refresh`)
   - Refresh Token → nouvelle paire de tokens

4. **Protected Routes**
   - Middleware `authenticate()` extrait Bearer token
   - JWT vérifié avec `JWT_ACCESS_SECRET`
   - User chargé depuis DB et attaché à `req.user`

### Headers Auth
```
Authorization: Bearer <access_token>
```

### Rôles & Permissions
```
BUYER    → Réserver, commenter
SELLER   → Créer listings, voir bookings
JEWELER  → Créer listings, faire estimations
ADMIN    → Tout accès
```

---

## 🛣️ API Endpoints (13 routes)

### Auth (4 endpoints)
```
POST   /api/auth/register       Créer compte
POST   /api/auth/login          Connexion
POST   /api/auth/refresh        Renouveler tokens
GET    /api/auth/me             User courant (protected)
```

### Jewelry (2 endpoints)
```
GET    /api/jewelry?type=...&purity=...&minPrice=...&maxPrice=...&location=...&search=...
       Lister bijoux avec filtres
POST   /api/jewelry             Créer bijou (protected)
GET    /api/jewelry/[id]        Détail bijou
PATCH  /api/jewelry/[id]        Modifier (owner only)
DELETE /api/jewelry/[id]        Supprimer (owner|admin)
```

### Bookings (2 endpoints)
```
GET    /api/bookings?status=...&location=...    Lister réservations
POST   /api/bookings                 Créer réservation (protected)
GET    /api/bookings/[id]           Détail réservation
PATCH  /api/bookings/[id]           Changer status (protected)
```

### Messages (2 endpoints)
```
GET    /api/messages?conversationId=...   Lister conversations + messages
POST   /api/messages                  Envoyer message (protected)
GET    /api/messages/[id]            Messages d'une conversation
```

### Reviews (1 endpoint)
```
GET    /api/reviews?targetId=...&targetType=...   Lister reviews
POST   /api/reviews                  Créer review (protected)
```

### Estimations (1 endpoint)
```
GET    /api/estimations             Lister estimations
POST   /api/estimations             Créer estimation (protected)
```

### Uploads (1 endpoint)
```
POST   /api/uploads               Upload image (multipart/form-data, max 5MB)
       Catégories: jewelry, avatars, estimations
```

### Health (1 endpoint)
```
GET    /api/health/                Status check pour Docker
```

---

## ⚛️ React Hooks Personnalisés

### 1. `useAuth` (lib/hooks/use-auth.ts)
```typescript
const {
  register,      // (email, password) → login + tokens
  login,         // (email, password) → user
  logout,        // Effacer tokens
  currentUser,   // User | null
  isLoading,
  error
} = useAuth()
```

### 2. `useJewelry` (lib/hooks/use-jewelry.ts)
```typescript
const {
  jewelry,       // Jewelry[]
  list,          // (filters) → fetch
  getById,       // (id) → single
  create,        // (data) → create
  update,        // (id, data)
  delete: deleteItem // (id)
} = useJewelry()
```

### 3. `useBookings` (lib/hooks/use-bookings.ts)
```typescript
const {
  bookings,
  list,          // (filters)
  getById,       // (id)
  create,        // (data)
  updateStatus   // (id, status)
} = useBookings()
```

### 4. `useMessages` (lib/hooks/use-messages.ts)
```typescript
const {
  conversations, // Conversation[]
  messages,      // Message[] de conversation active
  list,          // (conversationId)
  send           // (receiverId, content, images)
} = useMessages()
```

### 5. `useReviews` (lib/hooks/use-reviews.ts)
```typescript
const {
  reviews,       // Review[]
  list,          // (targetId, targetType)
  create         // (data)
} = useReviews()
```

### 6. `useEstimations` (lib/hooks/use-estimations.ts)
```typescript
const {
  estimations,   // Estimation[]
  list,
  create         // (weight, purity, images)
} = useEstimations()
```

---

## 📁 Structure des Dossiers

```
app/
├── api/
│   ├── auth/
│   │   ├── register/route.ts
│   │   ├── login/route.ts
│   │   ├── refresh/route.ts
│   │   └── me/route.ts
│   ├── jewelry/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── bookings/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── messages/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── reviews/route.ts
│   ├── estimations/route.ts
│   ├── uploads/route.ts
│   └── health/route.ts
├── catalog/page.tsx      (→ useJewelry)
├── dashboard/
│   ├── page.tsx          (→ useAuth, useJewelry, useBookings)
│   ├── bookings/page.tsx (→ useBookings)
│   └── listings/page.tsx (→ useJewelry)
├── messages/page.tsx     (→ useMessages)
├── booking/[id]/page.tsx
├── jewelry/[id]/page.tsx
└── ...

lib/
├── db.ts                 (Prisma singleton)
├── auth.ts               (JWT utils)
├── middleware.ts         (Auth middleware)
├── api-client.ts         (Fetch wrapper + auto-refresh)
├── hooks/
│   ├── use-auth.ts
│   ├── use-jewelry.ts
│   ├── use-bookings.ts
│   ├── use-messages.ts
│   ├── use-reviews.ts
│   └── use-estimations.ts
├── types.ts              (TypeScript interfaces)
└── utils.ts              (Helper functions)

prisma/
├── schema.prisma         (324 lines, 8 models)
└── seed.ts               (Test data: 4 users, 6 jewelry, etc)

docker/
├── Dockerfile            (Multi-stage build)
└── docker-compose.yml    (3 services: app, postgres, adminer)
```

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Setup Database
```bash
# Démarrer PostgreSQL via Docker
docker-compose up -d postgres

# Créer les tables
npm run db:push

# Charger données de test
npx tsx prisma/seed.ts
```

### 3. Development
```bash
npm run dev              # http://localhost:3000
```

### 4. Build & Production
```bash
npm run build
npm start
```

### 5. Docker Production
```bash
docker-compose up       # tous les services
curl http://localhost:3000/api/health
```

---

## 🔧 Configuration

### `.env` (requis)
```env
DATABASE_URL="postgresql://goldlink:goldlink_password@localhost:5432/goldlink"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
UPLOAD_DIR="./public/uploads"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### `prisma/schema.prisma`
- Provider: `prisma-client-js`
- Datasource: PostgreSQL 17
- 8 modèles avec relations
- Indexes sur: email (unique), ownerId, renterId, etc.

---

## 📋 Features Complétées

✅ User authentication (register/login/refresh)  
✅ Jewelry CRUD (create, read, update, delete)  
✅ Booking system (rental reservations)  
✅ Messaging system (conversations)  
✅ Ratings & reviews  
✅ Gold value estimations  
✅ File uploads (images)  
✅ JWT token refresh flow  
✅ Role-based access control  
✅ Docker containerization  
✅ React hooks API integration  
✅ TypeScript strict mode  

---

## ⚠️ À Faire

- [ ] Seed data: `npx tsx prisma/seed.ts` (nécessite PostgreSQL running)
- [ ] End-to-end tests (Cypress)
- [ ] API documentation (Swagger)
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Image optimization & CDN

---

## 📞 Support

- **Schema issues**: Vérifier `prisma/schema.prisma`
- **API issues**: Vérifier logs dans `app/api/*/route.ts`
- **Build issues**: Vérifier `npm run build` avec `prisma generate` (postinstall)
- **DB issues**: Vérifier PostgreSQL container: `docker-compose logs postgres`

