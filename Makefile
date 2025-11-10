.PHONY: help install dev build test clean docker-up docker-down db-migrate db-seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

dev: ## Start development servers
	pnpm dev

build: ## Build all packages
	pnpm build

test: ## Run tests
	pnpm test

test-e2e: ## Run end-to-end tests
	pnpm test:e2e

clean: ## Clean all build artifacts
	pnpm clean
	rm -rf node_modules

docker-up: ## Start Docker containers
	docker compose up -d

docker-down: ## Stop Docker containers
	docker compose down

docker-logs: ## View Docker logs
	docker compose logs -f

db-migrate: ## Run database migrations
	cd apps/api && pnpm prisma migrate dev

db-migrate-deploy: ## Deploy migrations (production)
	cd apps/api && pnpm prisma migrate deploy

db-seed: ## Seed database with demo data
	cd apps/api && pnpm prisma db seed

db-studio: ## Open Prisma Studio
	cd apps/api && pnpm prisma studio

db-reset: ## Reset database (WARNING: destroys all data)
	cd apps/api && pnpm prisma migrate reset

format: ## Format code
	pnpm format

lint: ## Lint code
	pnpm lint
