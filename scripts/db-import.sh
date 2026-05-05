#!/bin/bash
set -e

FILE="$1"

if [ -z "$FILE" ]; then
    echo -e "\033[0;31m❌ Erreur: Aucun fichier spécifié.\033[0m"
    echo "Utilisation: make db-import FILE=chemin/vers/votre_fichier.sql"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo -e "\033[0;31m❌ Erreur: Le fichier '$FILE' est introuvable.\033[0m"
    exit 1
fi

# Charger les variables d'environnement
if [ -f ".env.local" ]; then
    source .env.local
else
    echo -e "\033[0;31m❌ Erreur: Fichier .env introuvable.\033[0m"
    exit 1
fi

# Détecter quel conteneur MariaDB est en cours d'exécution (dev ou prod)
if docker ps --format '{{.Names}}' | grep -q "^nihon-mariadb-dev$"; then
    CONTAINER="nihon-mariadb-dev"
elif docker ps --format '{{.Names}}' | grep -q "^nihon-mariadb$"; then
    CONTAINER="nihon-mariadb"
else
    echo -e "\033[0;31m❌ Erreur: Aucun conteneur MariaDB Nihon n'est en cours d'exécution.\033[0m"
    echo "Lancez d'abord 'make dev' ou 'make up'."
    exit 1
fi

echo -e "\033[1;34m📦 Importation du fichier '$FILE' dans la base de données '$DB_NAME' (Conteneur: $CONTAINER)...\033[0m"

# Exécuter l'importation via docker exec (mode interactif pour passer le fichier via stdin)
docker exec -i "$CONTAINER" mariadb -u root -p"${MARIADB_ROOT_PASSWORD:-root_password}" "$DB_NAME" < "$FILE"

echo -e "\033[0;32m✅ Importation terminée avec succès !\033[0m"
