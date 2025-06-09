#!/bin/bash

# Production build script for Rusty Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Rusty Chat for production...${NC}"

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

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf target/release/rusty-chat
rm -rf frontend/dist

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm ci
fi

# Build frontend
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Frontend build completed successfully!${NC}"
cd ..

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
cargo build --release

# Check if build was successful
if [ ! -f "target/release/rusty-chat" ]; then
    echo -e "${RED}Backend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Backend build completed successfully!${NC}"

# Create production directory structure
echo -e "${YELLOW}Creating production directory structure...${NC}"
mkdir -p dist/production
cp target/release/rusty-chat dist/production/
cp -r frontend/dist dist/production/frontend
cp -r migrations dist/production/
cp .env.example dist/production/

# Create startup script
cat > dist/production/start.sh << 'EOF'
#!/bin/bash

# Production startup script for Rusty Chat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Rusty Chat in production mode...${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${RED}Please update the .env file with your production configuration!${NC}"
    exit 1
fi

# Create uploads directory
mkdir -p uploads

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
if command -v psql &> /dev/null; then
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL=" .env; then
        DB_URL=$(grep "DATABASE_URL=" .env | cut -d '=' -f2)
        if [ ! -z "$DB_URL" ]; then
            psql "$DB_URL" -f migrations/001_initial.sql 2>/dev/null || echo "Migrations may have already been applied"
        fi
    fi
fi

# Start the application
echo -e "${GREEN}Starting Rusty Chat server...${NC}"
./rusty-chat
EOF

chmod +x dist/production/start.sh

# Create systemd service file
cat > dist/production/rusty-chat.service << 'EOF'
[Unit]
Description=Rusty Chat Application
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/rusty-chat
ExecStart=/opt/rusty-chat/rusty-chat
Restart=always
RestartSec=10
Environment=RUST_LOG=info

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration
cat > dist/production/nginx.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration (update paths to your certificates)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend static files
    location / {
        root /opt/rusty-chat/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Create deployment instructions
cat > dist/production/DEPLOYMENT.md << 'EOF'
# Rusty Chat Production Deployment

## Prerequisites

1. Ubuntu/Debian server with sudo access
2. PostgreSQL 13+
3. Redis 6+
4. Nginx (optional, for reverse proxy)

## Installation Steps

1. **Copy files to server:**
   ```bash
   scp -r dist/production/* user@your-server:/opt/rusty-chat/
   ```

2. **Set up database:**
   ```bash
   sudo -u postgres createdb rusty_chat
   sudo -u postgres psql rusty_chat -f /opt/rusty-chat/migrations/001_initial.sql
   ```

3. **Configure environment:**
   ```bash
   cd /opt/rusty-chat
   cp .env.example .env
   # Edit .env with your production settings
   nano .env
   ```

4. **Set up systemd service:**
   ```bash
   sudo cp rusty-chat.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable rusty-chat
   sudo systemctl start rusty-chat
   ```

5. **Configure Nginx (optional):**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/rusty-chat
   sudo ln -s /etc/nginx/sites-available/rusty-chat /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Variables

Update the following in your `.env` file:

- `DATABASE_URL`: Your PostgreSQL connection string
- `REDIS_URL`: Your Redis connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `SERVER_ADDR`: Server binding address (usually 0.0.0.0:3000)

## SSL Certificate

For HTTPS, obtain an SSL certificate (e.g., using Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring

Check service status:
```bash
sudo systemctl status rusty-chat
sudo journalctl -u rusty-chat -f
```

## Updates

To update the application:
1. Stop the service: `sudo systemctl stop rusty-chat`
2. Replace the binary: `cp new-rusty-chat /opt/rusty-chat/rusty-chat`
3. Update frontend files if needed
4. Start the service: `sudo systemctl start rusty-chat`
EOF

echo -e "${GREEN}Production build completed successfully!${NC}"
echo -e "${BLUE}Build artifacts are in: dist/production/${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review the deployment instructions in dist/production/DEPLOYMENT.md"
echo -e "2. Update the .env file with your production configuration"
echo -e "3. Deploy to your production server"
echo -e "4. Configure SSL certificates for HTTPS"
