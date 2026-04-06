# ============ Frontend build ============
FROM node:20-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ARG VITE_BULWARC_ADDRESS
ARG VITE_ORACLE_ADDRESS
ARG VITE_RPC_URL=https://rpc.testnet.arc.network
ARG VITE_CHAIN_ID=5042002

RUN npm run build

# ============ Backend build ============
FROM node:20-alpine AS backend-build

WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --include=dev

COPY backend/ .

# ============ Production ============
FROM node:20-alpine

RUN apk add --no-cache nginx

# Backend
WORKDIR /app/backend
COPY --from=backend-build /app ./

# Frontend static files
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Nginx config with API proxy
COPY nginx.prod.conf /etc/nginx/http.d/default.conf

# Data volume for SQLite
VOLUME /app/backend/data

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 80

# Start script: nginx + backend
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

CMD ["/docker-entrypoint.sh"]
