#!/bin/bash

# Thai Escrow Platform - Setup Script

set -e

echo "🛡️  Thai Escrow Platform - Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

echo "✅ pnpm $(pnpm -v)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You'll need to run PostgreSQL and Redis manually."
    DOCKER_AVAILABLE=false
else
    echo "✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1)"
    DOCKER_AVAILABLE=true
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "📝 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env already exists, skipping"
fi

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "🐳 Starting Docker services..."
    docker compose up -d postgres redis
    
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 5
fi

echo ""
echo "🗄️  Running database migrations..."
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev --name init
cd ../..

echo ""
echo "🌱 Seeding database..."
pnpm db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo ""
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "  1. Start all services:"
    echo "     docker compose up -d"
    echo ""
fi
echo "  2. Start development servers:"
echo "     pnpm dev"
echo ""
echo "  3. Open in browser:"
echo "     Frontend: http://localhost:3000"
echo "     API:      http://localhost:4000"
echo ""
echo "  4. View database:"
echo "     pnpm db:studio"
echo ""
echo "Happy coding! 🚀"
