# Rusty Chat

A real-time chat application built with Rust (Axum) backend and React frontend.

## Features

- 🔐 User Authentication (Registration/Login)
- 💬 Real-time Messaging
- 👥 Friend Management System
- 🏢 Group Chat
- 📁 File Upload and Sharing
- 🎤 Voice Messages
- 📷 Image and Video Sharing
- 🔔 Real-time Notifications
- 📱 Responsive Design

## Tech Stack

### Backend
- **Rust** - Systems programming language
- **Axum** - Modern async web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **WebSocket** - Real-time communication
- **JWT** - Authentication
- **SQLx** - Database ORM

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Vite** - Build tool
- **Socket.IO** - WebSocket client
- **Axios** - HTTP client

## Quick Start

### Prerequisites

- Rust 1.70+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rusty-chat
   ```

2. **Setup database**
   ```bash
   # Run database setup script
   ./scripts/setup_db.sh

   # Or setup manually
   createdb rusty_chat
   psql -d rusty_chat -f migrations/001_initial.sql
   ```

3. **Configure environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env file and set your database and Redis connection info
   ```

4. **Start Redis**
   ```bash
   # macOS
   brew services start redis

   # Linux
   sudo systemctl start redis

   # Or run directly
   redis-server
   ```

5. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

6. **Start development servers**

   **Backend (Terminal 1):**
   ```bash
   cargo run
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Project Structure

```
rusty-chat/
├── src/                    # Rust backend source code
│   ├── handlers/          # API handlers
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   ├── config.rs          # Configuration management
│   ├── database.rs        # Database connection
│   ├── websocket.rs       # WebSocket handling
│   └── main.rs            # Application entry point
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React Context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
├── migrations/            # Database migrations
├── scripts/               # Utility scripts
└── uploads/               # File upload directory
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### User Endpoints
- `GET /api/users/me` - Get current user info
- `GET /api/users/search` - Search users

### Friend Endpoints
- `GET /api/friends` - Get friends list
- `POST /api/friends/requests` - Send friend request
- `POST /api/friends/requests/:id/accept` - Accept friend request
- `POST /api/friends/requests/:id/reject` - Reject friend request
- `DELETE /api/friends/:id` - Remove friend

### Group Endpoints
- `GET /api/groups` - Get groups list
- `POST /api/groups` - Create group
- `GET /api/groups/:id/members` - Get group members
- `POST /api/groups/:id/members` - Add group member
- `DELETE /api/groups/:id/members/:user_id` - Remove group member

### Message Endpoints
- `GET /api/messages/:chat_id` - Get chat messages
- `POST /api/messages` - Send message

### File Endpoints
- `POST /api/upload` - Upload file
- `GET /api/files/:id` - Download file

## WebSocket Events

### Client Sends
- `authenticate` - Authentication
- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `send_message` - Send message
- `typing_indicator` - Typing status indicator

### Server Sends
- `new_message` - New message
- `typing_indicator` - Typing status
- `user_online` - User online
- `user_offline` - User offline
- `friend_request` - Friend request
- `group_invitation` - Group invitation

## Development Guide

### Backend Development
```bash
# Run tests
cargo test

# Check code
cargo clippy

# Format code
cargo fmt
```

### Frontend Development
```bash
cd frontend

# Run tests
npm test

# Code linting
npm run lint

# Build for production
npm run build
```

## Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cargo build --release
```

### Docker Deployment
```bash
# Build image
docker build -t rusty-chat .

# Run container
docker run -p 3000:3000 rusty-chat
```

### Using Docker Compose
```bash
# Start all services (database, redis, app)
docker-compose up -d

# Stop all services
docker-compose down
```

### Quick Development Setup
```bash
# Use the development script for automatic setup
./scripts/dev.sh
```

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or suggestions, please create an Issue or contact the project maintainers.
