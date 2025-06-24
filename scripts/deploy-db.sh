#!/bin/bash

# Database Deployment Script for Production
# Run this after setting up environment variables in Vercel

echo "🗄️  Setting up database for production deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set up your environment variables first:"
    echo "1. Go to Vercel Dashboard > Project > Settings > Environment Variables"
    echo "2. Add all required environment variables"
    echo "3. Pull them locally: vercel env pull .env.local"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema (creates tables if they don't exist)
echo "🚀 Pushing database schema..."
npx prisma db push --force-reset

echo "✅ Database setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Test your application"
echo "3. Verify email functionality"
echo ""
echo "🌐 Your app will be available at: https://your-project.vercel.app" 