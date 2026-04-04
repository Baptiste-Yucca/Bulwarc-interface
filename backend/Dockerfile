FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV DB_PATH=/app/data/bulwarc.db
ENV PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
