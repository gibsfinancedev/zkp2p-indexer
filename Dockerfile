# Use Node.js 18 as the base image
FROM node:lts-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY ponder.config.ts ./
COPY ponder-env.d.ts ./
COPY ponder.schema.ts ./
COPY src ./src
COPY abis ./abis
COPY .eslintrc.json ./

# Install dependencies
RUN npm i

# Build TypeScript files (if needed)
RUN npm run typecheck

CMD ["npm", "start"]
