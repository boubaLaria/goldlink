
  ---
  GoldLink — Présentation Investisseur

  ---
  PITCH (30 secondes)

  GoldLink est la première plateforme française de location et vente de bijoux certifiés entre particuliers et bijoutiers professionnels.

  Nous combinons un marketplace de confiance avec des technologies de pointe — intelligence artificielle et essayage virtuel 3D — pour transformer l'accès au bijou de luxe. L'objectif : rendre le bijou haut de
  gamme accessible à tous, tout en offrant aux vendeurs et bijoutiers un canal digital moderne pour monétiser leur stock dormant.

  ---
  PROBLÈME & OPPORTUNITÉ

  ┌─────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
  │                                  Problème                                   │                  Notre réponse                   │
  ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Les bijoux de valeur restent inutilisés chez les particuliers et bijoutiers │ Location entre particuliers + professionnels     │
  ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Impossible d'essayer un bijou à distance avant de l'acheter/louer           │ Try-on virtuel 3D en temps réel (webcam)         │
  ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Méfiance sur l'authenticité et la valeur des pièces                         │ Estimation IA + certification + profils vérifiés │
  ├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
  │ Pas de canal digital dédié pour les bijoutiers indépendants                 │ Tableau de bord professionnel complet            │
  └─────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘

  Le marché mondial de la joaillerie représente 330 Mds$ en 2024 (CAGR 8%), avec une forte demande en location pour l'événementiel (mariages, galas, photo) — segment encore quasi inexistant en digital en France.

  ---
  FONCTIONNALITÉS DÉVELOPPÉES — PRODUCTION-READY ✅

  1. Marketplace Bijoux — Catalog & Listings

  - Catalogue complet avec recherche plein texte et filtres avancés (type, pureté, prix, ville)
  - Fiches produit riches : galerie photos, visionneuse 3D interactive, description, prix location/vente
  - 3 modes de mise en vente : Location, Vente, Échange
  - Types supportés : Collier, Bracelet, Bague, Boucles d'oreilles, Pendentif, Chaîne
  - Puretés : 8K à 24K
  - Upload multi-formats : photos (JPEG/PNG/WebP) + modèles 3D (GLB/GLTF)

  ▎ Valeur marché : 6 000 – 12 000 €

  ---
  2. Système de Réservation & Location

  - Sélection de dates avec calendrier interactif
  - Calcul automatique du prix total + caution (20% du total)
  - Option assurance
  - Suivi du statut en temps réel : En attente → Confirmé → Actif → Terminé → Annulé
  - Historique des locations (locataire et propriétaire)
  - Page de détail de réservation avec récapitulatif financier

  ▎ Valeur marché : 8 000 – 15 000 €

  ---
  3. Authentification & Gestion des Rôles (RBAC)

  - 4 rôles distincts : Acheteur, Vendeur, Bijoutier, Administrateur
  - Tokens JWT sécurisés (access 15min + refresh 7 jours)
  - Mots de passe chiffrés (bcrypt)
  - Cookies HTTP-only (protection XSS)
  - Middleware de protection des routes
  - Inscription publique (rôle Acheteur), création bijoutier/vendeur par admin

  ▎ Valeur marché : 3 000 – 6 000 €

  ---
  4. Tableaux de Bord Multi-Rôles

  Acheteur : historique des locations, réservations en cours, accès catalogue
  Vendeur/Bijoutier : gestion des annonces, suivi des réservations entrantes, statistiques
  Administrateur : vue globale (utilisateurs, bijoux, réservations, transactions), revenus plateforme, gestion complète

  - Graphiques et statistiques (Recharts)
  - Commission plateforme 10% calculée automatiquement
  - Activation/désactivation des annonces en un clic

  ▎ Valeur marché : 6 000 – 12 000 €

  ---
  5. Profils & Paramètres Utilisateur

  - Modification du profil (nom, téléphone, adresse)
  - Préférences régionales : devise multi-pays (EUR, USD, GBP, MAD…)
  - Changement de mot de passe sécurisé
  - Préférences de notifications (email, SMS, push)
  - Badges de vérification vendeur

  ▎ Valeur marché : 2 000 – 4 000 €

  ---
  6. Visionneuse 3D Bijoux

  - Intégration React Three Fiber (Three.js)
  - Chargement de modèles GLB/GLTF uploadés par les vendeurs
  - Rotation 360°, zoom, éclairage "studio joaillerie"
  - Fallback procédural si aucun modèle n'est fourni
  - Validation des fichiers GLB (structure, version, maillage)

  ▎ Valeur marché : 4 000 – 8 000 €

  ---
  7. Système d'Avis & Notation

  - Notes 1 à 5 étoiles sur les bijoux et les utilisateurs
  - Commentaires texte
  - Protection anti-doublon (un avis par utilisateur par bijou)
  - Mise à jour automatique de la note moyenne
  - Affichage sur les fiches et profils vendeurs

  ▎ Valeur marché : 2 000 – 4 000 €

  ---
  8. Estimation de la Valeur Or (IA)

  - Saisie du poids (grammes) et de la pureté (18K, 22K, 24K)
  - Upload photo optionnel
  - Calcul basé sur le cours de l'or spot
  - Valeur or brut + valeur commerciale estimée
  - Score de confiance (70% / 95%)
  - Historique des estimations

  ▎ Valeur marché : 3 000 – 7 000 €

  ---
  9. Messagerie Privée (Utilisateurs)

  - Chat privé entre acheteurs, vendeurs et bijoutiers
  - Liste des conversations avec recherche
  - Compteur de messages non lus
  - Aperçu du dernier message
  - Support des caractères spéciaux (accents français)
  - Envoi par Entrée, saut de ligne par Shift+Entrée

  ▎ Valeur marché : 4 000 – 8 000 €

  ---
  FONCTIONNALITÉS EN BETA 🟡

  Assistant IA RAG — Chat Intelligent Bijoux

  ▎ Statut : BÊTA — fonctionnel, en cours d'optimisation

  Un assistant conversationnel propulsé par OpenAI GPT + RAG (Retrieval-Augmented Generation) :
  - Base de connaissances indexée (types de bijoux, conseils, entretien)
  - Recherche sémantique dans le catalogue réel de la plateforme
  - Suggestions de bijoux contextualisées dans la conversation
  - Attribution des sources (titre, score de pertinence, extrait)
  - Historique persistant (localStorage)

  La bêta est stable mais nous travaillons à améliorer la précision des suggestions et à enrichir la base de connaissance.

  ▎ Valeur marché : 10 000 – 20 000 €

  ---
  FONCTIONNALITÉS EN DÉVELOPPEMENT 🔵

  Try-On Virtuel 3D en Temps Réel

  ▎ Statut : EN DÉVELOPPEMENT — prototype fonctionnel sur bracelets

  L'innovation phare de GoldLink : essayer un bijou depuis son téléphone ou son ordinateur, sans rien installer.

  Stack technologique :
  - MediaPipe Hand Landmarker (Google) — détection de la main en 21 points clés
  - Three.js / React Three Fiber — rendu 3D photoréaliste du bijou
  - One Euro Filter — lissage temporel pour éliminer les tremblements
  - Occluder de profondeur — le bracelet passe derrière les doigts naturellement

  Fonctionnalités prototype :
  - Détection du poignet en temps réel via webcam
  - Placement automatique du bracelet sur le poignet
  - Mesure du périmètre de poignet en millimètres
  - Validation de pose (main à plat, doigts écartés)
  - Mode mobile via QR code (caméra arrière)
  - Capture et téléchargement du résultat

  Roadmap :
  - Étendu à tous les types de bijoux (bagues, colliers, boucles)
  - Amélioration de la fidélité couleur/matière (or, argent, platine)
  - Mode multi-bijoux simultanés

  ▎ Valeur marché estimée à maturité : 30 000 – 60 000 €
  ▎ (Technologie comparable : Snap Try-On, Google Shopping AR — fonctionnalités vendues 50k€+ en B2B)

  ---
  SYNTHÈSE DE LA VALEUR DÉVELOPPÉE

  ┌──────────────────────────────┬──────────────────┬────────────────────┐
  │            Module            │      Statut      │   Valeur estimée   │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Marketplace & Catalogue      │ ✅ Production    │ 6 000 – 12 000 €   │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Système de réservation       │ ✅ Production    │ 8 000 – 15 000 €   │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Auth & RBAC                  │ ✅ Production    │ 3 000 – 6 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Tableaux de bord multi-rôles │ ✅ Production    │ 6 000 – 12 000 €   │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Profils & paramètres         │ ✅ Production    │ 2 000 – 4 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Visionneuse 3D               │ ✅ Production    │ 4 000 – 8 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Avis & notation              │ ✅ Production    │ 2 000 – 4 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Estimation IA or             │ ✅ Production    │ 3 000 – 7 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Messagerie privée            │ ✅ Production    │ 4 000 – 8 000 €    │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Assistant RAG IA             │ 🟡 Bêta          │ 10 000 – 20 000 €  │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ Try-On Virtuel 3D            │ 🔵 Développement │ 30 000 – 60 000 €  │
  ├──────────────────────────────┼──────────────────┼────────────────────┤
  │ TOTAL                        │                  │ 78 000 – 156 000 € │
  └──────────────────────────────┴──────────────────┴────────────────────┘

  ---
  STACK TECHNIQUE

  Frontend : Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui
  Backend : Next.js API Routes, Prisma ORM, PostgreSQL
  IA : OpenAI GPT (chat + embeddings), RAG avec similarité cosinus
  3D/AR : Three.js, React Three Fiber, MediaPipe (Google)
  Infra : Docker, déploiement mono-commande
  Sécurité : JWT, bcrypt, RBAC, cookies HTTP-only

  ---
  PROCHAINES ÉTAPES

  1. Finaliser le Try-On sur l'ensemble des catégories de bijoux
  2. Enrichir la base RAG avec le stock réel des bijoutiers partenaires
  3. Intégrer un système de paiement (Stripe) pour la caution et les transactions
  4. Onboarding bijoutiers : acquisition des 10 premiers bijoutiers partenaires
  5. Application mobile React Native

  ---
  GoldLink — L'or accessible, l'élégance partagée.

  ---