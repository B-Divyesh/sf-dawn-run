FROM node:22-bookworm-slim
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts=false --no-audit --no-fund
COPY api/ ./
ENV PORT=8080 DATABASE_PATH=/tmp/dawn-run.sqlite PERSIST_PATH=/data/dawn-run-scores-v3.sqlite NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
