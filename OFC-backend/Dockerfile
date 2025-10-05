# Simple production Dockerfile for the backend
FROM node:20-alpine

WORKDIR /app

# Install system deps if needed (sharp)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD [ "node", "index.js" ]