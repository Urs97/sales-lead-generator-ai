# Stage 1: Build Stage
FROM node:18 AS builder

WORKDIR /usr/src/app

# Copy package.json first for better caching
COPY package*.json ./
RUN npm install

# Copy the full project
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Stage 2: Production Stage
FROM node:18-slim

WORKDIR /usr/src/app

# Install necessary system packages (adds `ps` for NestJS)
RUN apt update && apt install -y libssl-dev dumb-init procps --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy the required files from the builder stage
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/package*.json /usr/src/app/
COPY --from=builder /usr/src/app/prisma /usr/src/app/prisma

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"]

