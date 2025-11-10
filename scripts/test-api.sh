#!/bin/bash

# Quick API Health Check Script

API_URL="${API_BASE_URL:-http://localhost:4000}"

echo "🔍 Testing Thai Escrow API..."
echo "API URL: $API_URL"
echo ""

# Health Check
echo "1. Health Check..."
curl -s "$API_URL/health" | jq '.' || echo "Failed"
echo ""

# Request OTP
echo "2. Testing Email OTP Request..."
curl -s -X POST "$API_URL/api/v1/auth/email/request" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq '.' || echo "Failed"
echo ""

echo "✅ Basic API tests complete"
echo ""
echo "For more tests, run:"
echo "  pnpm test"
echo "  pnpm test:e2e"
