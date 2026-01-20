# Stage 1: Build React app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the app
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy React build to nginx html folder
COPY --from=build /app/build /usr/share/nginx/html

# Copy runtime environment config (this allows dynamic API URL without rebuilding)
COPY public/env-config.js /usr/share/nginx/html/env-config.js

# Add custom Nginx config for React Router (handles routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
