# ====================================
# Dockerfile for Backend API
# ====================================
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 staffclock

# Copy the production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER staffclock

EXPOSE 3001

ENV PORT 3001

CMD ["node", "server.js"]

# ====================================
# Dockerfile for Frontend
# ====================================
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ====================================
# docker-compose.yml - Complete Development Stack
# ====================================
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: staffclock-postgres
    environment:
      POSTGRES_DB: staffclock
      POSTGRES_USER: staffclock_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - staffclock-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U staffclock_user -d staffclock"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for Session Storage
  redis:
    image: redis:7-alpine
    container_name: staffclock-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - staffclock-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: staffclock-api
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgresql://staffclock_user:secure_password@postgres:5432/staffclock
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secure-jwt-secret-key-change-in-production
      JWT_EXPIRES_IN: 24h
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: your-email@gmail.com
      SMTP_PASS: your-app-password
      BCRYPT_ROUNDS: 12
      FRONTEND_URL: http://localhost:3000
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - staffclock-network
    restart: unless-stopped

  # Frontend React App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_BASE_URL: http://localhost:3001/api
    container_name: staffclock-frontend
    ports:
      - "3000:80"
    depends_on:
      - api
    networks:
      - staffclock-network
    restart: unless-stopped

  # Nginx Load Balancer (for production)
  nginx:
    image: nginx:alpine
    container_name: staffclock-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
    networks:
      - staffclock-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  staffclock-network:
    driver: bridge

# ====================================
# nginx.conf - Frontend Nginx Configuration
# ====================================
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;

    # Frontend server
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html index.htm;

        # Handle React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# ====================================
# Production nginx.conf - Load Balancer
# ====================================
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream api {
        server api:3001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

    server {
        listen 80;
        server_name staffclock.company.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name staffclock.company.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}

# ====================================
# database/init.sql - Database Initialization
# ====================================
-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'admin', 'security', 'ceo')),
    department VARCHAR(100),
    job_title VARCHAR(100),
    phone VARCHAR(20),
    is_manager BOOLEAN DEFAULT FALSE,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_clocked_in BOOLEAN DEFAULT FALSE,
    assigned_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Leave requests table
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id),
    manager_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('Annual', 'Sick', 'Personal', 'Emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clock activities table
CREATE TABLE clock_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('clock_in', 'clock_out')),
    timestamp TIMESTAMP NOT NULL,
    location VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP verifications table
CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('verification', 'password_reset')),
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, type)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_leave_requests_staff ON leave_requests(staff_id);
CREATE INDEX idx_leave_requests_manager ON leave_requests(manager_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_start_date ON leave_requests(start_date);
CREATE INDEX idx_leave_requests_created_at ON leave_requests(created_at);

CREATE INDEX idx_clock_activities_staff ON clock_activities(staff_id);
CREATE INDEX idx_clock_activities_timestamp ON clock_activities(timestamp);
CREATE INDEX idx_clock_activities_location ON clock_activities(location);

CREATE INDEX idx_otp_email ON otp_verifications(email);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Insert CEO user (password: password123)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    department, 
    job_title, 
    is_manager, 
    is_verified, 
    is_active
) VALUES (
    'ceo@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj94.KMsnFp2', -- password123
    'Sarah',
    'Chen',
    'ceo',
    'Executive',
    'Chief Executive Officer',
    true,
    true,
    true
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

# ====================================
# package.json - Backend Dependencies
# ====================================
{
  "name": "staffclock-api",
  "version": "1.0.0",
  "description": "StaffClock Backend API with hierarchical leave approvals",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "seed": "node scripts/seed.js"
  },
  "keywords": ["staffclock", "api", "nodejs", "express", "postgresql"],
  "author": "Your Company",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-rate-limit": "^6.8.1",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.1",
    "nodemailer": "^6.9.3",
    "dotenv": "^16.3.1",
    "joi": "^17.9.2",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.1",
    "supertest": "^6.3.3",
    "eslint": "^8.44.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

# ====================================
# .env.example - Environment Template
# ====================================
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://staffclock_user:secure_password@localhost:5432/staffclock
DB_HOST=localhost
DB_PORT=5432
DB_NAME=staffclock
DB_USER=staffclock_user
DB_PASS=secure_password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security Configuration
BCRYPT_ROUNDS=12
OTP_EXPIRES_MINUTES=5
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# ====================================
# scripts/deploy.sh - Deployment Script
# ====================================
#!/bin/bash

set -e

echo "🚀 Starting StaffClock deployment..."

# Build and start services
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🗄️ Starting database..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔧 Running database migrations..."
docker-compose exec postgres psql -U staffclock_user -d staffclock -f /docker-entrypoint-initdb.d/init.sql

echo "🚀 Starting application services..."
docker-compose up -d api frontend nginx

echo "🔍 Checking service health..."
sleep 15

# Health checks
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$API_HEALTH" = "200" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 API: http://localhost:3001/api"
echo "📍 API Health: http://localhost:3001/api/health"

# ====================================
# Makefile - Development Commands
# ====================================
.PHONY: help dev build start stop clean logs test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development environment
	docker-compose up --build

build: ## Build all Docker images
	docker-compose build

start: ## Start all services
	docker-compose up -d

stop: ## Stop all services
	docker-compose down

clean: ## Stop and remove all containers, networks, images, and volumes
	docker-compose down -v --rmi all --remove-orphans

logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show API logs
	docker-compose logs -f api

logs-frontend: ## Show frontend logs
	docker-compose logs -f frontend

test: ## Run tests
	docker-compose exec api npm test

test-watch: ## Run tests in watch mode
	docker-compose exec api npm run test:watch

seed: ## Seed database with sample data
	docker-compose exec api npm run seed

db-connect: ## Connect to PostgreSQL database
	docker-compose exec postgres psql -U staffclock_user -d staffclock

redis-connect: ## Connect to Redis
	docker-compose exec redis redis-cli

health: ## Check health of all services
	@echo "Checking API health..."
	@curl -s http://localhost:3001/api/health | jq .
	@echo "Checking Frontend..."
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000