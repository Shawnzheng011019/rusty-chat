#!/bin/bash

# Development environment startup script for Rusty Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Rusty Chat development environment...${NC}"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

echo -e "${YELLOW}Checking required tools...${NC}"
check_tool "cargo"
check_tool "node"
check_tool "npm"
check_tool "psql"
check_tool "redis-cli"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created. Please update it with your configuration.${NC}"
fi

# Start PostgreSQL if not running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo -e "${RED}Please start PostgreSQL manually${NC}"
        exit 1
    fi
    sleep 2
fi

# Start Redis if not running
echo -e "${YELLOW}Checking Redis...${NC}"
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    if command -v brew &> /dev/null; then
        brew services start redis
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start redis
    else
        echo -e "${YELLOW}Starting Redis in background...${NC}"
        redis-server --daemonize yes
    fi
    sleep 2
fi

# Setup database
echo -e "${YELLOW}Setting up database...${NC}"
./scripts/setup_db.sh

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}Frontend dependencies already installed${NC}"
fi
cd ..

# Create uploads directory
mkdir -p uploads

echo -e "${GREEN}Development environment setup complete!${NC}"
echo -e "${BLUE}To start the application:${NC}"
echo -e "${YELLOW}1. Backend:${NC} cargo run"
echo -e "${YELLOW}2. Frontend:${NC} cd frontend && npm run dev"
echo -e "${YELLOW}3. Visit:${NC} http://localhost:5173"

# Ask if user wants to start the services
read -p "Do you want to start the backend and frontend now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting services...${NC}"
    
    # Start backend in background
    echo -e "${YELLOW}Starting backend...${NC}"
    cargo run &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo -e "${YELLOW}Starting frontend...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "${GREEN}Services started!${NC}"
    echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
    echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Wait for user to stop
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
fi
