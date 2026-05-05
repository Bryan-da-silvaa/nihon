#!/bin/bash

# Script de démarrage rapide pour Nihon avec Docker
# Utilisation: ./docker-start.sh [dev|prod|stop|clean]

set -e

ENVIRONMENT="${1:-prod}"
ENV_FILE=".env"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Nihon Docker Management${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Fichier .env non trouvé, création depuis .env.docker..."
        cp .env.docker "$ENV_FILE"
        print_success "Fichier .env créé"
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose (plugin) n'est pas installé"
        exit 1
    fi
    
    print_success "Docker et Docker Compose détectés"
}

start_production() {
    print_header
    echo -e "${BLUE}Mode: PRODUCTION${NC}"
    echo ""
    
    check_docker
    check_env_file
    
    print_info "Construction des images..."
    docker compose build
    
    print_info "Démarrage des services..."
    docker compose up -d
    
    print_success "Services démarrés!"
    echo ""
    echo -e "${GREEN}Application disponible sur: ${BLUE}http://localhost:3000${NC}"
    echo -e "${GREEN}Base de données: ${BLUE}localhost:3306${NC}"
    echo ""
    echo -e "Commandes utiles:"
    echo -e "  ${YELLOW}docker compose logs -f${NC}        - Voir les logs en temps réel"
    echo -e "  ${YELLOW}docker compose ps${NC}             - Voir l'état des services"
    echo -e "  ${YELLOW}docker compose down${NC}           - Arrêter les services"
}

start_development() {
    print_header
    echo -e "${BLUE}Mode: DÉVELOPPEMENT (Hot Reload)${NC}"
    echo ""
    
    check_docker
    check_env_file
    
    print_info "Démarrage des services en mode développement..."
    docker compose -f docker-compose.dev.yml up -d
    
    print_success "Services de développement démarrés!"
    echo ""
    echo -e "${GREEN}Application disponible sur: ${BLUE}http://localhost:3000${NC}"
    echo -e "${GREEN}Base de données: ${BLUE}localhost:3306${NC}"
    echo ""
    echo -e "Commandes utiles:"
    echo -e "  ${YELLOW}docker compose -f docker-compose.dev.yml logs -f${NC} - Voir les logs en temps réel"
    echo -e "  ${YELLOW}docker compose -f docker-compose.dev.yml ps${NC}    - Voir l'état des services"
    echo -e "  ${YELLOW}./docker-start.sh stop${NC}                          - Arrêter les services"
}

stop_services() {
    print_header
    echo ""
    
    print_info "Arrêt des services..."
    docker compose down
    
    print_success "Services arrêtés"
}

clean_all() {
    print_header
    echo -e "${RED}⚠️  Nettoyage complet (suppression des données)${NC}"
    echo ""
    
    read -p "Êtes-vous sûr ? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Suppression des conteneurs, réseaux et volumes..."
        docker compose down -v
        print_success "Nettoyage terminé"
    else
        print_info "Annulé"
    fi
}

show_help() {
    echo -e "${BLUE}Utilisation: $0 [commande]${NC}"
    echo ""
    echo "Commandes:"
    echo "  ${YELLOW}prod${NC}    - Démarrer en mode production (défaut)"
    echo "  ${YELLOW}dev${NC}     - Démarrer en mode développement avec hot reload"
    echo "  ${YELLOW}stop${NC}    - Arrêter les services"
    echo "  ${YELLOW}clean${NC}   - Supprimer les conteneurs, réseaux et volumes"
    echo "  ${YELLOW}help${NC}    - Afficher cette aide"
    echo ""
}

case "$ENVIRONMENT" in
    prod|production)
        start_production
        ;;
    dev|development)
        start_development
        ;;
    stop)
        stop_services
        ;;
    clean)
        clean_all
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        print_error "Commande inconnue: $ENVIRONMENT"
        show_help
        exit 1
        ;;
esac
