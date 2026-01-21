# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps --no-audit --no-fund; else npm install --legacy-peer-deps --no-audit --no-fund; fi

COPY . .

# Build configuration: production | preprod | staging
ARG BUILD_CONFIGURATION=production

# Generate chatbot prebuilt index (from PRODUCT_DOC_LOCAGUEST-*.md)
RUN npm run gen:chatbot:index

RUN npm run build -- --configuration $BUILD_CONFIGURATION

# Normalize output into /app/out (handles both dist/locaGuest/browser and dist/locaGuest)
RUN mkdir -p /app/out && \
    if [ -d "dist/locaGuest/browser" ]; then \
      cp -a dist/locaGuest/browser/. /app/out/; \
    elif [ -d "dist/locaGuest" ]; then \
      cp -a dist/locaGuest/. /app/out/; \
    else \
      echo "Angular build output not found. dist content:" && ls -la dist && exit 1; \
    fi

# Runtime stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built Angular app
COPY --from=build /app/out/ .

# Copy nginx vhost config (recommended location)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
