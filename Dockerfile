FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ gcc musl-dev libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]