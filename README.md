# Remodra - Professional Home Remodeling SaaS Platform

A comprehensive, secure, and powerful SaaS platform designed specifically for home remodeling companies. Built with modern technologies and enterprise-grade architecture.

## 🚀 Features

### Core Business Features
- **Multi-tenant Architecture** - Secure isolation between contractors
- **Client Management** - Complete client lifecycle management
- **Estimate Generation** - Professional estimate creation with multiple templates
- **Project Management** - Kanban boards, timelines, and progress tracking
- **Invoice Management** - Automated billing and payment tracking
- **Time Tracking** - Employee timeclock with GPS verification
- **Calendar Integration** - Appointment scheduling and management
- **Lead Capture** - Public lead capture forms with automation

### Advanced Features
- **AI-Powered Analysis** - Cost analysis and project recommendations
- **Digital Measurement Tools** - Professional measurement and estimation
- **PDF Generation** - Customizable estimate and invoice templates
- **Achievement System** - Gamification for employee engagement
- **Multi-language Support** - Internationalization ready
- **Real-time Notifications** - WebSocket-based updates
- **Audit Logging** - Complete activity tracking for compliance

### Security & Compliance
- **Role-based Access Control** - Granular permissions system
- **Data Encryption** - End-to-end encryption for sensitive data
- **Audit Trails** - Complete audit logging for compliance
- **Session Management** - Secure session handling with recovery
- **Input Validation** - Comprehensive input sanitization
- **Rate Limiting** - Protection against abuse

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive design
- **TanStack Query** for server state management
- **Wouter** for routing
- **React Hook Form** for form handling
- **Lucide React** for icons

### Backend
- **Node.js** with TypeScript
- **Express.js** for API framework
- **SQLite** for development (PostgreSQL for production)
- **Drizzle ORM** for database management
- **Passport.js** for authentication
- **JWT** for stateless sessions
- **WebSocket** for real-time features

### Database
- **Multi-tenant schema** with proper isolation
- **Migrations** for version control
- **Seeding** for development data
- **Backup and recovery** procedures

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd remodra
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the application**
   ```bash
   ./start-remodra.sh
   ```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5005
- **Health Check**: http://localhost:5005/health

## 🔧 Development

### Project Structure
```
remodra/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── ...
├── server/                # Backend Node.js application
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── services/         # Business logic services
│   └── ...
├── shared/               # Shared types and schemas
├── db/                   # Database migrations and seeds
└── ...
```

### Available Scripts

#### Backend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database
```

#### Frontend
```bash
cd client
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=file:./dev.db

# Authentication
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## 🔒 Security Features

### Authentication & Authorization
- **Multi-factor authentication** support
- **Role-based access control** (RBAC)
- **Session management** with secure cookies
- **Password policies** and strength requirements
- **Account lockout** protection

### Data Protection
- **Input validation** and sanitization
- **SQL injection** prevention
- **XSS protection** with CSP headers
- **CSRF protection** with tokens
- **Rate limiting** to prevent abuse

### Compliance
- **GDPR compliance** ready
- **Data retention** policies
- **Audit logging** for all actions
- **Data export** capabilities
- **Privacy controls** for users

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:port/db
   SESSION_SECRET=your-production-secret
   ```

2. **Database Setup**
   ```bash
   npm run db:migrate
   npm run db:seed:production
   ```

3. **Build Application**
   ```bash
   npm run build
   cd client && npm run build && cd ..
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5005
CMD ["npm", "start"]
```

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Health checks** for all services
- **Performance metrics** collection
- **Error tracking** and logging
- **Usage analytics** dashboard
- **Real-time alerts** for issues

### Logging
- **Structured logging** with JSON format
- **Log levels** (debug, info, warn, error)
- **Log rotation** and retention
- **Centralized logging** support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Add proper error handling

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: [docs.remodra.com](https://docs.remodra.com)
- **Issues**: [GitHub Issues](https://github.com/remodra/remodra/issues)
- **Discord**: [Remodra Community](https://discord.gg/remodra)

## 🏆 Acknowledgments

- Built with modern web technologies
- Inspired by real contractor needs
- Community-driven development
- Enterprise-grade security practices

---

**Remodra** - Empowering contractors with professional tools for success. 