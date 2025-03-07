# Stage 1: Build Stage
FROM node:18 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the .env file
COPY .env .env

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Stage 2: Production Stage
FROM node:18-slim

# Install necessary packages
RUN apt update && apt install libssl-dev dumb-init -y --no-install-recommends

# Set the working directory
WORKDIR /usr/src/app

# Copy the build artifacts and node_modules from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/.env .env

# Set environment variables
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["dumb-init", "node", "dist/main"]
