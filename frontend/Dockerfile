# Stage 1: Build the React Application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and lock files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the optimized production bundle (creates the 'dist' directory)
RUN npm run build

# Stage 2: Serve the compiled files using Nginx
FROM nginx:alpine

# Copy the build artifacts from Stage 1 into the Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx configuration with our SPA-routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (default HTTP port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
