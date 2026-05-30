# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json /app/
RUN npm install

# Copy application code
COPY . /app/

# Set production API URL build arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build client bundle
RUN npm run build

# Stage 2: Serve the build directory with Nginx
FROM nginx:alpine

# Copy built files to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
