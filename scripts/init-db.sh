#!/bin/bash

set -e

echo "🔑 GoldLink Database Initialization"
echo "===================================="

echo "📊 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database with test data..."
npx prisma db seed

echo "✅ Database initialized successfully!"
echo ""
echo "📝 Test credentials:"
echo "   Admin: admin@goldlink.com / admin123"
echo "   Seller: fatima@goldlink.com / seller123"
echo "   Jeweler: karim@goldlink.com / jeweler123"
echo "   Buyer: amina@goldlink.com / buyer123"
