#!/bin/bash

# Database setup script for Rusty Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="rusty_chat"
DB_USER="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${GREEN}Setting up PostgreSQL database for Rusty Chat...${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL service is not running. Starting it...${NC}"
    
    # Try to start PostgreSQL service
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start postgresql
    else
        echo -e "${RED}Could not start PostgreSQL service automatically.${NC}"
        echo "Please start PostgreSQL manually and run this script again."
        exit 1
    fi
    
    # Wait a moment for the service to start
    sleep 2
fi

# Create database if it doesn't exist
echo -e "${GREEN}Creating database '$DB_NAME'...${NC}"
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || echo "Database '$DB_NAME' already exists"

# Run migrations
echo -e "${GREEN}Running database migrations...${NC}"
if [ -f "migrations/001_initial.sql" ]; then
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/001_initial.sql
    echo -e "${GREEN}Migrations completed successfully!${NC}"
else
    echo -e "${RED}Migration file not found: migrations/001_initial.sql${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating .env file...${NC}"
    cp .env.example .env
    
    # Update database URL in .env
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME|" .env
    rm .env.bak 2>/dev/null || true
    
    echo -e "${YELLOW}Please update the .env file with your actual configuration values.${NC}"
fi

echo -e "${GREEN}Database setup completed successfully!${NC}"
echo -e "${GREEN}You can now run the application with: cargo run${NC}"
