.PHONY: up down build logs reset dev seed migrate ps help

## Production commands
up:         ## Start all containers (build if needed)
	docker compose up -d --build

down:       ## Stop all containers
	docker compose down

build:      ## Build images without starting
	docker compose build

logs:       ## Follow container logs
	docker compose logs -f

ps:         ## Show container status
	docker compose ps

reset:      ## Full reset: wipe volumes + restart fresh
	docker compose down -v
	docker compose up -d --build

## Development commands
dev:        ## Start postgres + adminer for local dev
	docker compose -f docker-compose.dev.yml up -d
	@echo "✅ PostgreSQL ready on :5432 | Adminer on :8080"
	@echo "Now run: npm run dev"

dev-down:   ## Stop dev containers
	docker compose -f docker-compose.dev.yml down

## Database commands
migrate:    ## Push Prisma schema to DB
	npx prisma db push

seed:       ## Seed database with test data
	npx tsx prisma/seed.ts

studio:     ## Open Prisma Studio
	npx prisma studio

## Help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
