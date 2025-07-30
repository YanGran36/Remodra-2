# Remodra SaaS Deployment Guide

## Quick Start Options

### Option 1: Docker Compose (Recommended)
```bash
# 1. Set environment variables
export POSTGRES_PASSWORD="your-secure-password"
export SESSION_SECRET="your-super-secure-session-secret"
export FRONTEND_URL="https://yourdomain.com"

# 2. Deploy
docker-compose up -d

# 3. Check status
docker-compose ps
```

### Option 2: Manual VPS Deployment
```bash
# 1. Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql nginx

# 2. Set up PostgreSQL
sudo -u postgres createdb remodra
sudo -u postgres createuser remodra_user

# 3. Set environment variables
export DATABASE_URL="postgresql://remodra_user:password@localhost:5432/remodra"
export SESSION_SECRET="your-secure-session-secret"
export NODE_ENV="production"

# 4. Deploy
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Cloud Platforms

#### Railway
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically

#### Render
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`

## Environment Variables

Create a `.env` file with:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your-super-secure-session-secret
FRONTEND_URL=https://yourdomain.com
PORT=3001

# Optional API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
STRIPE_SECRET_KEY=your-stripe-secret
SENDGRID_API_KEY=your-sendgrid-key
```

## Database Setup

### PostgreSQL (Production)
```sql
CREATE DATABASE remodra;
CREATE USER remodra_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE remodra TO remodra_user;
```

### Run Migrations
```bash
npm run db:push
```

## SSL/HTTPS Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring & Maintenance

### Health Checks
- Application: `https://yourdomain.com/health`
- Database: Check PostgreSQL logs
- Nginx: `sudo systemctl status nginx`

### Logs
```bash
# Application logs
docker-compose logs -f remodra

# Database logs
docker-compose logs -f postgres

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Backup Strategy
```bash
# Database backup
pg_dump remodra > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
pg_dump $DATABASE_URL > /backups/remodra_$(date +%Y%m%d_%H%M%S).sql
find /backups -name "*.sql" -mtime +7 -delete
```

## Security Checklist

- [ ] Change default passwords
- [ ] Set up firewall (UFW)
- [ ] Configure SSL/TLS
- [ ] Set up rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs for suspicious activity

## Performance Optimization

### Nginx Caching
```nginx
# Add to nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_estimates_user_id ON estimates(user_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Session Issues**
   - Verify SESSION_SECRET is set
   - Check cookie settings
   - Ensure HTTPS in production

3. **Build Failures**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`
   - Check Node.js version compatibility

### Support
For deployment issues, check:
- Application logs
- Database logs
- Nginx logs
- System resources (CPU, memory, disk) 