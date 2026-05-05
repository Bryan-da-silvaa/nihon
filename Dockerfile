# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Installer dumb-init pour la gestion des signaux
RUN apk add --no-cache dumb-init

# Copier les dépendances depuis le stage builder
COPY --from=builder /app/node_modules ./node_modules

# Copier la build Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Changer le propriétaire des fichiers
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1

# Utiliser dumb-init pour gérer les signaux correctement
ENTRYPOINT ["dumb-init", "--"]

CMD ["node_modules/.bin/next", "start"]
