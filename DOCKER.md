# Docker Setup - Nihon

Guide complet pour dockeriser et exécuter le projet Nihon avec Docker et Docker Compose.

## 📋 Prérequis

- [Docker](https://www.docker.com/products/docker-desktop) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

## 🚀 Quick Start

### 1. Configuration des variables d'environnement

Créer un fichier `.env` à partir du modèle fourni :

```bash
cp .env.docker .env
```

Vous pouvez modifier les valeurs selon vos besoins :
```env
DB_USER=nihon_user
DB_PASSWORD=nihon_password
DB_NAME=nihon_db
MARIADB_ROOT_PASSWORD=root_password
```

### 2. Lancer l'application (Production)

```bash
# Build les images Docker
docker-compose build

# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f nihon-app
```

L'application sera disponible sur : **http://localhost:3000**

### 3. Développement avec Hot Reload

```bash
# Utiliser la configuration de développement
docker-compose -f docker-compose.dev.yml up -d

# Voir les logs en temps réel
docker-compose -f docker-compose.dev.yml logs -f nihon-app
```

## 🛑 Arrêter les services

```bash
# Production
docker-compose down

# Développement
docker-compose -f docker-compose.dev.yml down
```

## 🗑️ Nettoyage complet (y compris les données)

```bash
# Production
docker-compose down -v

# Développement
docker-compose -f docker-compose.dev.yml down -v
```

## 📦 Services disponibles

### Frontend (Next.js)
- **Port** : 3000
- **URL** : http://localhost:3000
- **Variables d'env** : `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Base de données (MariaDB)
- **Port** : 3306
- **Utilisateur par défaut** : root
- **Mot de passe** : configuré via `.env`
- **Data volume** : `mariadb_data` (persistent)

## 📝 Scripts disponibles

### Build custom
```bash
# Rebuild des images
docker-compose build --no-cache
```

### Accéder à la base de données
```bash
# Shell MySQL interactif
docker-compose exec mariadb mariadb -u root -p${MARIADB_ROOT_PASSWORD} ${DB_NAME}

# Exemple :
docker-compose exec mariadb mariadb -u root -proot_password nihon_db
```

### Voir les logs
```bash
# Tous les services
docker-compose logs

# Service spécifique
docker-compose logs nihon-app
docker-compose logs mariadb

# Suivi en temps réel
docker-compose logs -f
```

### Exécuter une commande dans un conteneur
```bash
# Next.js
docker-compose exec nihon-app npm run lint

# MariaDB
docker-compose exec mariadb mariadb-admin status -u root -proot_password
```

## 🔍 Dépannage

### Le conteneur Next.js ne démarre pas

```bash
# Vérifier les logs
docker-compose logs nihon-app

# Vérifier la santé du conteneur
docker-compose ps
```

### Erreur de connexion à la base de données

1. Vérifier que MariaDB est sain :
```bash
docker-compose exec mariadb mariadb-admin ping -u root -proot_password
```

2. Vérifier les logs de MariaDB :
```bash
docker-compose logs mariadb
```

3. Vérifier que les variables d'environnement sont correctes :
```bash
docker-compose config
```

### Port déjà utilisé

Si le port 3000 ou 3306 est déjà occupé, modifier le `docker-compose.yml` :

```yaml
ports:
  - "3001:3000"  # Utiliser 3001 localement au lieu de 3000
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tous les conteneurs et volumes
docker-compose down -v

# Supprimer les images
docker rmi nihon-nihon-app

# Recommencer
docker-compose up -d
```

## 📊 Voir les ressources utilisées

```bash
# Utilisation CPU/Mémoire
docker stats

# Détails du réseau
docker network ls
docker network inspect nihon_nihon-network
```

## 🔐 Sécurité

- Les variables sensibles (mots de passe) sont dans `.env` (à ajouter à `.gitignore`)
- L'application s'exécute sous un utilisateur non-root (`nextjs`)
- MariaDB écoute uniquement sur le réseau Docker interne (sauf le port exposé)

## 📚 Ressources additionnelles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation MariaDB](https://mariadb.com/docs/)

## 🤝 Support

Pour toute question ou problème, consultez :
- Les logs des services : `docker-compose logs`
- La santé des services : `docker-compose ps`
- La configuration : `docker-compose config`
