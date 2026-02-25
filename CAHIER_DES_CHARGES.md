# CAHIER DES CHARGES - GoldLink

## 1. IDENTIFICATION DU PROJET

**Nom du Projet**: GoldLink  
**Type**: Plateforme Marketplace en ligne  
**Domaine**: Location et vente de bijoux haut de gamme  
**Version**: 1.0  
**Date**: Février 2026  
**Statut**: En cours de développement  

---

## 2. OBJECTIFS DU PROJET

### Objectifs Principaux
1. **Créer une marketplace digitale** permettant la location et l'achat de bijoux de qualité
2. **Connecter vendeurs/loueurs et acheteurs** dans un écosystème sécurisé
3. **Faciliter la gestion des locations** (dates, prix, dépôts)
4. **Permettre la communication directe** entre utilisateurs
5. **Offrir une estimation de valeur** pour les bijoux en or

### Objectifs Secondaires
- Construire une communauté d'utilisateurs (bijoutiers, collectionneurs)
- Générer des revenus via commissions sur transactions
- Assurer la sécurité et la confiance (authentification, paiements)
- Fournir une expérience utilisateur fluide et intuitive

---

## 3. ACTEURS & RÔLES

### 3.1 Rôles Utilisateurs

#### **BUYER** (Acheteur/Loueur)
- Parcourir le catalogue de bijoux
- Réserver une location (date début/fin, prix, dépôt)
- Acheter des bijoux
- Écrire des avis
- Envoyer des messages aux vendeurs
- Voir l'historique de ses réservations

#### **SELLER** (Vendeur/Loueur)
- Créer des listings de bijoux (photo, description, prix)
- Gérer les réservations entrantes (accepter/refuser)
- Voir le catalogue de ses bijoux
- Communiquer avec les acheteurs
- Lire les avis clients

#### **JEWELER** (Bijoutier Expert)
- Créer des listings premium
- Faire des estimations de valeur en or
- Accès à des statistiques avancées
- Rôle spécialisé pour professionnels

#### **ADMIN** (Administrateur)
- Accès complet à toutes les données
- Modérer le contenu (bijoux, messages)
- Gérer les utilisateurs et leurs rôles
- Voir les rapports d'activité
- Gérer les transactions

---

## 4. SPÉCIFICATIONS FONCTIONNELLES

### 4.1 AUTHENTIFICATION & GESTION UTILISATEUR

#### US1: Inscription (Register)
```
Étant un nouvel utilisateur,
Je veux créer un compte avec mon email et mot de passe
Pour accéder à la plateforme
```
**Critères d'acceptation**:
- Email unique (validation format)
- Mot de passe hashé + salted (bcrypt)
- Retour access_token (15min) + refresh_token (7j)
- Validation email optionnelle
- Rôle par défaut: BUYER

#### US2: Connexion (Login)
```
Étant un utilisateur inscrit,
Je veux me connecter avec email/password
Pour accéder à mon compte
```
**Critères d'acceptation**:
- Vérification email/password
- Retour JWT tokens
- Tokens stockés côté client (localStorage)
- Session active pendant 15min (access token)

#### US3: Refresh Token
```
Étant un utilisateur connecté,
Je veux renouveler mon access_token expiré
Sans me reconnecter
```
**Critères d'acceptation**:
- Refresh token valide 7 jours
- Génération nouvelle paire tokens
- Automatique côté client quand 401

#### US4: Profil Utilisateur
```
Étant connecté,
Je veux voir et modifier mon profil
```
**Critères d'acceptation**:
- GET /api/auth/me → user complet
- PATCH /profile → mettre à jour nom, bio, avatar, location
- Validation des champs

---

### 4.2 CATALOGUE DE BIJOUX

#### US5: Lister Bijoux avec Filtres
```
Étant un acheteur,
Je veux voir le catalogue avec filtres avancés
Pour trouver les bijoux que je cherche
```
**Critères d'acceptation**:
- Afficher tous les bijoux (AVAILABLE seulement)
- Filtrer par:
  - Type (collier, bracelet, bague, boucles, pendentif, chaîne)
  - Pureté (K8, K10, K14, K18, K22, K24)
  - Prix min/max
  - Location (ville/région)
  - Recherche texte (titre + description)
- Pagination (20 items par page)
- Tri par: prix, date création, popularité

#### US6: Détail Bijou
```
Étant un acheteur,
Je veux voir les détails complets d'un bijou
```
**Critères d'acceptation**:
- Afficher: titre, description, images, type, pureté, poids, prix
- Voir les avis (notes + commentaires)
- Voir le vendeur (profile, rating)
- Bouton "Louer" ou "Acheter"
- Incrémenter le compteur de vues

#### US7: Créer Listing (SELLER)
```
Étant un vendeur,
Je veux créer un listing de bijou
Pour le mettre en location/vente
```
**Critères d'acceptation**:
- Formulaire: titre, description, type, pureté, poids
- Upload 1-5 images (JPEG/PNG, max 5MB chacune)
- Setter prix rental (par jour) et/ou prix vente
- Setter location (auto-remplir depuis profil)
- Validation prix > 0
- Status par défaut: AVAILABLE
- Bijou apparaît dans catalog après création

#### US8: Modifier/Supprimer Listing (SELLER)
```
Étant un vendeur,
Je veux modifier ou supprimer mes listings
```
**Critères d'acceptation**:
- PATCH: modifier tous les champs
- DELETE: supprimer et ses associations
- Vérification ownership (ou ADMIN)
- Bijoux RENTED/SOLD ne peuvent pas être modifiés

---

### 4.3 SYSTÈME DE RÉSERVATION

#### US9: Réserver Bijou (BUYER)
```
Étant un acheteur,
Je veux réserver un bijou pour une période donnée
Pour le louer
```
**Critères d'acceptation**:
- Formulaire: date début, date fin, prix confirmé
- Calcul automatique:
  - Nombre de jours
  - Total price = rentPricePerDay × days
  - Dépôt = 20% du total
- Status initial: PENDING
- Bijou devient RENTED
- Notification vendeur

#### US10: Gérer Réservations (SELLER)
```
Étant un vendeur,
Je veux accepter/refuser les réservations
```
**Critères d'acceptation**:
- Voir liste des bookings (PENDING, CONFIRMED, ACTIVE, COMPLETED)
- PATCH /bookings/[id] { status: "CONFIRMED" }
- Workflow: PENDING → CONFIRMED → ACTIVE → COMPLETED
- Auto-transition: date_start atteinte → ACTIVE

#### US11: Voir Mes Réservations (BUYER)
```
Étant un acheteur,
Je veux voir mes réservations passées/futures
```
**Critères d'acceptation**:
- GET /api/bookings?status=...
- Filtrer par statut: PENDING, CONFIRMED, ACTIVE, COMPLETED
- Afficher: bijou, dates, prix, statut
- Bouton "Annuler" si PENDING

---

### 4.4 SYSTÈME DE MESSAGING

#### US12: Envoyer Message
```
Étant un utilisateur,
Je veux envoyer un message privé à un autre utilisateur
Pour communiquer
```
**Critères d'acceptation**:
- POST /api/messages { receiverId, content, images[] }
- Max 1000 caractères
- Support images (optionnel)
- Conversation créée auto si n'existe pas
- Sort user IDs (user1Id < user2Id) pour éviter doublons

#### US13: Voir Conversations
```
Étant un utilisateur,
Je veux voir toutes mes conversations
```
**Critères d'acceptation**:
- GET /api/messages
- Lister par date récente en premier
- Afficher dernier message + auteur
- Unread count
- Avatar de l'autre utilisateur

#### US14: Lire Messages d'une Conversation
```
Étant un utilisateur,
Je veux lire tous les messages d'une conversation
```
**Critères d'acceptation**:
- GET /api/messages/[conversationId]
- Messages triés chronologiquement (ascendant)
- Marquer comme READ automatiquement
- Afficher timestamps

---

### 4.5 SYSTÈME D'AVIS & NOTES

#### US15: Laisser Avis
```
Étant un acheteur ayant loué,
Je veux laisser un avis sur le bijou/vendeur
Pour aider la communauté
```
**Critères d'acceptation**:
- POST /api/reviews { targetId, targetType, rating (1-5), comment }
- Max 1 avis par utilisateur par bijou
- Recalcule rating moyen du bijou
- Recalcule rating moyen du vendeur
- Avis publié immédiatement

#### US16: Voir Avis
```
Étant un visiteur,
Je veux voir les avis sur un bijou
```
**Critères d'acceptation**:
- GET /api/reviews?targetId=...&targetType=...
- Afficher: author, rating, comment, date
- Trier par récent en premier
- Pagination
- Afficher rating moyen en haut

---

### 4.6 ESTIMATION DE VALEUR OR

#### US17: Créer Estimation
```
Étant un bijoutier ou acheteur,
Je veux estimer la valeur en or d'un bijou
```
**Critères d'acceptation**:
- Formulaire: poids (g), pureté (K8-K24), images (optionnel)
- Calcul: estimatedGoldValue = weight × puurity_price
- Confidence: 0.95 avec images, 0.7 sans
- Prix or par gram: K8=150, K10=200, K14=280, K18=450, K22=550, K24=600 MAD
- Markup commercial: commercialValue = estimatedGoldValue × 1.40
- Résultat instruit

#### US18: Voir Mes Estimations
```
Étant un utilisateur,
Je veux voir l'historique de mes estimations
```
**Critères d'acceptation**:
- GET /api/estimations
- Afficher: poids, pureté, valeur calculée, confiance, date

---

### 4.7 UPLOADS DE FICHIERS

#### US19: Upload Images
```
Étant un vendeur,
Je veux uploader des images de bijoux
```
**Critères d'acceptation**:
- POST /api/uploads (multipart/form-data)
- Format: JPEG, PNG, WebP
- Max 5MB par image
- Catégories: jewelry, avatars, estimations
- Retour: { url, filename, category }
- Fichiers stockés dans public/uploads/[category]/

---

## 5. SPÉCIFICATIONS TECHNIQUES

### 5.1 Architecture

```
Client (React + Next.js) 
    ↓ (Fetch + JWT Authorization)
API Routes (Next.js 13 App Router)
    ↓ (Prisma ORM)
PostgreSQL 17 Database
```

### 5.2 Base de Données

**SGBD**: PostgreSQL 17  
**ORM**: Prisma 6.19.2  
**Schéma**: 8 modèles, 20+ relations, indexes

#### Modèles
1. User (authentication)
2. Jewelry (catalog)
3. Booking (reservations)
4. Message (communications)
5. Conversation (grouped messages)
6. Review (ratings)
7. Estimation (gold value)
8. Transaction (payments)

### 5.3 Authentification

**Type**: JWT (JSON Web Tokens)  
**Access Token**: 15 minutes  
**Refresh Token**: 7 jours  
**Hash**: bcryptjs (10 salt rounds)  
**Storage**: localStorage (client)  

### 5.4 API

**Framework**: Next.js API Routes  
**Format**: REST  
**Status Codes**: 200, 201, 400, 401, 403, 404, 500  
**Pagination**: offset/limit  
**Filtering**: Query parameters  

### 5.5 Frontend

**Framework**: React 18 + Next.js 16  
**Language**: TypeScript  
**Styling**: Tailwind CSS  
**UI Components**: Radix UI  
**State Management**: React Hooks + Custom Hooks  
**Forms**: React Hook Form + Zod validation  

### 5.6 Infrastructure

**Containerization**: Docker  
**Orchestration**: Docker Compose  
**Services**:
- app:3000 (Next.js)
- postgres:5432 (PostgreSQL)
- adminer:8080 (Database UI)

### 5.7 File Storage

**Type**: Local filesystem  
**Path**: public/uploads/  
**Categories**:
- jewelry (images de bijoux)
- avatars (photos de profil)
- estimations (images pour estimation)

---

## 6. CALENDRIER & JALONS

### Phase 1: Conception & Setup (✅ COMPLÉTÉ)
- [x] Définition du cahier des charges
- [x] Architecture système
- [x] Schéma Prisma
- [x] Setup Docker

### Phase 2: Backend API (✅ COMPLÉTÉ)
- [x] Authentification (register, login, refresh)
- [x] Jewelry CRUD
- [x] Booking system
- [x] Messaging system
- [x] Reviews & ratings
- [x] Estimations
- [x] File uploads

### Phase 3: Frontend (✅ COMPLÉTÉ)
- [x] Pages principales (Catalog, Dashboard, Messages)
- [x] React hooks pour API integration
- [x] Forms & validation
- [x] Responsive design
- [x] Authentication flows

### Phase 4: Testing & QA (⏳ EN COURS)
- [ ] Integration tests API
- [ ] E2E tests (Cypress)
- [ ] Performance testing
- [ ] Security audit

### Phase 5: Deployment (⏳ À FAIRE)
- [ ] Docker image build
- [ ] Production environment setup
- [ ] Database backup strategy
- [ ] Monitoring & logging

---

## 7. CRITÈRES DE SUCCÈS

### Fonctionnels
- ✅ Tous les endpoints API testés et fonctionnels
- ✅ Authentification JWT sécurisée
- ✅ CRUD complet pour bijoux/réservations/messages
- ✅ Filtres & recherche performants
- ✅ Upload images sans erreurs

### Performance
- [ ] Temps réponse API < 200ms (95e percentile)
- [ ] Temps chargement page < 3s
- [ ] Support 1000 concurrent users
- [ ] Database queries optimisées (indexes)

### Fiabilité
- [ ] Uptime 99%
- [ ] Backups quotidiens
- [ ] Error logging & monitoring
- [ ] Graceful degradation

### Sécurité
- [ ] HTTPS en production
- [ ] Input validation côté serveur
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CORS configuré
- [ ] Rate limiting

### Utilisateur
- [ ] NPS > 7/10
- [ ] User satisfaction > 80%
- [ ] Mobile responsive
- [ ] Accessibilité WCAG 2.1 AA

---

## 8. CONTRAINTES & LIMITATIONS

### Techniques
- Node.js 20+ requis
- PostgreSQL 12+ pour compatibilité
- 4GB RAM minimum (servidor)
- Internet connection requis

### Métier
- Prix location en MAD (Maroc)
- Locations max 30 jours
- Dépôt = 20% du prix (non négociable)
- Pureté or: K8 à K24 uniquement

### Légales
- Conditions d'utilisation acceptées obligatoires
- RGPD compliance pour données utilisateurs
- Politique confidentialité requise
- Termes de service pour vendeurs

---

## 9. RISQUES & MITIGATION

### Risque 1: Fraude (Locations non respectées)
**Probabilité**: Moyen  
**Impact**: Élevé  
**Mitigation**: Système de caution, reviews, rate limiting

### Risque 2: Performance DB (Croissance données)
**Probabilité**: Faible  
**Impact**: Élevé  
**Mitigation**: Indexes, caching, pagination

### Risque 3: Sécurité (Vol tokens JWT)
**Probabilité**: Faible  
**Impact**: Critique  
**Mitigation**: HTTPS, secure storage, token expiration

### Risque 4: Indisponibilité DB
**Probabilité**: Très faible  
**Impact**: Critique  
**Mitigation**: Backups, failover, monitoring 24/7

---

## 10. ÉQUIPE & RESSOURCES

### Ressources Actuelles
- **1 Développeur Full-Stack**: Backend API + Frontend
- **1 Designer UI/UX**: (optionnel)
- **1/2 QA Tester**: (optionnel)

### Outils & Accès
- GitHub (version control)
- Docker Hub (images)
- PostgreSQL database
- Monitoring tools (logs, metrics)

---

## 11. BUDGET & ROI (Prévisionnel)

### Coûts Développement
- Développement: 40-60 heures estimées ✅ (COMPLÉTÉ)
- Infrastructure: $100-200/mois (AWS/DigitalOcean)
- Maintenance: 5-10 heures/mois

### Revenus
- Commission: 10% par transaction
- Subscription premium: (future)
- Sponsored listings: (future)

### Breakeven
- Estimé après 500+ transactions
- (~6-12 mois projectionnel)

---

## 12. GLOSSAIRE

| Terme | Définition |
|-------|-----------|
| JWT | JSON Web Token - standard de sécurité |
| Booking | Réservation de location |
| Listing | Annonce de bijou |
| Pureté | Teneur en or (K8, K10, K14, etc) |
| Caution | Dépôt = 20% du prix de location |
| Status | État de la réservation (PENDING, ACTIVE, etc) |
| Endpoint | URL d'une route API |

---

## 13. APPROUVATIONS

| Rôle | Nom | Date | Signature |
|------|------|------|-----------|
| Product Owner | - | 25/02/2026 | ✅ |
| Tech Lead | - | 25/02/2026 | ✅ |
| Client | - | 25/02/2026 | ✅ |

---

**Document Version**: 1.0  
**Dernière mise à jour**: 25 février 2026  
**Statut**: APPROUVÉ ✅

