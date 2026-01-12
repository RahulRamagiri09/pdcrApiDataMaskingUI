# Use Node.js 23.11.1
FROM node:23.11.1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (like npm install)
RUN npm install

# Copy source code
COPY . .

# Expose port 5000
EXPOSE 5000

# Run the dev server with --host to expose to Docker network
CMD ["npm", "run", "start:dev", "--", "--host"]
