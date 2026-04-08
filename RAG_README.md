# RAG GoldLink

## Vue d'ensemble

Cette version ajoute un assistant conversationnel RAG a GoldLink.

Le systeme repose sur :
- des documents metier situes dans `knowledge/`
- des donnees publiques issues de la base GoldLink
- une indexation en base des chunks et embeddings
- une route de chat `POST /api/chat/rag`
- une interface utilisateur sur `/chat`
- un fournisseur LLM configurable : `Ollama` en local ou `OpenAI`

## Ce qui est indexe

Sources documentaires :
- `knowledge/faq.md`
- `knowledge/presentation-goldlink.md`
- `knowledge/guide-acheteur.md`
- `knowledge/guide-vendeur.md`
- `knowledge/politique-location.md`
- `knowledge/estimation-or.md`

Sources dynamiques :
- vendeurs verifies publics
- bijoux disponibles avec leurs informations publiques

## Variables d'environnement requises

Ajouter dans `.env` :

```env
RAG_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_CHAT_MODEL="gemma3"
OLLAMA_EMBED_MODEL="embeddinggemma"
RAG_TOP_K=6
```

Pour utiliser OpenAI a la place :

```env
RAG_PROVIDER="openai"
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_CHAT_MODEL="gpt-5-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
RAG_TOP_K=6
```

## Preparation Ollama

Verifier qu'Ollama tourne localement puis installer les modeles necessaires :

```bash
ollama pull gemma3
ollama pull embeddinggemma
```

## Mise en route

1. Demarrer PostgreSQL

```bash
docker compose up -d postgres
```

2. Pousser le schema Prisma

```bash
npm run db:push
```

3. Charger les donnees de test si necessaire

```bash
npm run db:seed
```

4. Lancer l'ingestion RAG

```bash
npm run rag:ingest
```

5. Lancer l'application

```bash
npm run dev
```

6. Ouvrir le chat

```txt
http://localhost:3000/chat
```

## Fonctionnement

Lorsqu'un utilisateur envoie une question :
1. la question est embeddee
2. les chunks les plus proches sont recuperes
3. le contexte retrouve est injecte dans le prompt
4. le modele genere la reponse
5. les sources sont renvoyees a l'interface

## Limites actuelles

- les embeddings sont stockes en `Float[]`, pas en `pgvector`
- la similarite est calculee cote serveur en Node.js
- seules les donnees publiques sont indexees
- il n'y a pas encore de reindexation automatique apres mutation de la base
- en mode Docker, l'acces a Ollama passe par `host.docker.internal`

## Evolutions recommandees

- passer a `pgvector` pour la recherche vectorielle a grande echelle
- ajouter une route admin de reindexation
- historiser les conversations en base
- segmenter l'acces aux connaissances selon le role utilisateur
