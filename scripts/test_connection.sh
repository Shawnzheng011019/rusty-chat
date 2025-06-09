#!/bin/bash

# Connection test script for Rusty Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

echo -e "${BLUE}Testing Rusty Chat connections...${NC}"

# Test backend health
echo -e "${YELLOW}Testing backend connection...${NC}"
if curl -s -f "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running at $BACKEND_URL${NC}"
else
    echo -e "${RED}✗ Backend is not responding at $BACKEND_URL${NC}"
    echo -e "${YELLOW}Make sure to start the backend with: cargo run${NC}"
fi

# Test frontend
echo -e "${YELLOW}Testing frontend connection...${NC}"
if curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is running at $FRONTEND_URL${NC}"
else
    echo -e "${RED}✗ Frontend is not responding at $FRONTEND_URL${NC}"
    echo -e "${YELLOW}Make sure to start the frontend with: cd frontend && npm run dev${NC}"
fi

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql -h localhost -U postgres -d rusty_chat -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo -e "${YELLOW}Make sure PostgreSQL is running and database exists${NC}"
fi

# Test Redis connection
echo -e "${YELLOW}Testing Redis connection...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis connection failed${NC}"
    echo -e "${YELLOW}Make sure Redis is running: redis-server${NC}"
fi

# Test API endpoints
echo -e "${YELLOW}Testing API endpoints...${NC}"

# Test registration endpoint
echo -e "  Testing registration endpoint..."
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","username":"testuser","password":"testpass123"}' \
    -o /dev/null)

if [ "$REGISTER_RESPONSE" = "200" ] || [ "$REGISTER_RESPONSE" = "400" ]; then
    echo -e "${GREEN}  ✓ Registration endpoint is working${NC}"
else
    echo -e "${RED}  ✗ Registration endpoint failed (HTTP $REGISTER_RESPONSE)${NC}"
fi

# Test login endpoint
echo -e "  Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass123"}' \
    -o /dev/null)

if [ "$LOGIN_RESPONSE" = "200" ] || [ "$LOGIN_RESPONSE" = "401" ]; then
    echo -e "${GREEN}  ✓ Login endpoint is working${NC}"
else
    echo -e "${RED}  ✗ Login endpoint failed (HTTP $LOGIN_RESPONSE)${NC}"
fi

# Test WebSocket endpoint
echo -e "${YELLOW}Testing WebSocket connection...${NC}"
WS_TEST=$(timeout 5 wscat -c "ws://localhost:3000/ws" -x '{"message_type":"ping","data":{}}' 2>&1 || echo "timeout")

if [[ "$WS_TEST" != *"timeout"* ]] && [[ "$WS_TEST" != *"error"* ]]; then
    echo -e "${GREEN}✓ WebSocket endpoint is accessible${NC}"
else
    echo -e "${RED}✗ WebSocket connection failed${NC}"
    echo -e "${YELLOW}Note: WebSocket requires authentication for full functionality${NC}"
fi

echo -e "${BLUE}Connection test completed!${NC}"

# Summary
echo -e "\n${BLUE}Quick Start Commands:${NC}"
echo -e "${YELLOW}1. Start backend:${NC} cargo run"
echo -e "${YELLOW}2. Start frontend:${NC} cd frontend && npm run dev"
echo -e "${YELLOW}3. Visit:${NC} http://localhost:5173"
