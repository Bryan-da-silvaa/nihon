.PHONY: help build up down logs clean dev dev-logs db-shell stop restart ps

help:
	@echo "🐳 Nihon Docker Commands"
	@echo ""
	@echo "Production:"
	@echo "  make build          - Build production images"
	@echo "  make up             - Start production services"
	@echo "  make stop           - Stop production services"
	@echo "  make down           - Stop and remove production containers"
	@echo "  make logs           - View production logs"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start development services with hot reload"
	@echo "  make dev-logs       - View development logs"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell       - Open MariaDB shell"
	@echo "  make db-logs        - View MariaDB logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make ps             - Show running containers"
	@echo "  make clean          - Remove all containers, networks, and volumes"
	@echo "  make restart        - Restart all services"
	@echo ""

# Production commands
build:
	docker compose build

build-no-cache:
	docker compose build --no-cache

up:
	docker compose up -d
	@echo "✅ Services started. App available at http://localhost:3000"

stop:
	docker compose stop

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

restart: stop up

# Development commands
dev:
	docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Development services started. App available at http://localhost:3000 with hot reload"

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-down:
	docker compose -f docker-compose.dev.yml down

# Database commands
db-shell:
	docker compose exec mariadb mariadb -u root -p$$(grep MARIADB_ROOT_PASSWORD .env 2>/dev/null | cut -d= -f2) $$(grep DB_NAME .env 2>/dev/null | cut -d= -f2)

db-logs:
	docker compose logs mariadb

# Cleanup commands
clean:
	docker compose down -v
	@echo "✅ All containers, networks, and volumes removed"

clean-dev:
	docker compose -f docker-compose.dev.yml down -v
	@echo "✅ All development containers, networks, and volumes removed"

# View image sizes
sizes:
	docker images | grep nihon

# View resource usage
stats:
	docker stats
