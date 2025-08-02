# 🚀 Remodra Deployment Guide - Vercel + Neon Database

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Sign up at [neon.tech](https://neon.tech)
3. **GitHub Repository**: Push your code to GitHub

## 🗄️ Step 1: Set up Neon Database

### 1.1 Create Neon Database
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:password@host/database`)

### 1.2 Set up Database Schema
```bash
# Connect to your Neon database and run the schema
# The schema is already in shared/schema.ts
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### 2.2 Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables and add:

```
DATABASE_URL=postgresql://user:password@host/database
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key
FRONTEND_URL=https://your-app.vercel.app
```

### 2.3 Deploy
1. Vercel will automatically detect the configuration
2. Click "Deploy"
3. Wait for build to complete

## 🔧 Step 3: Database Migration

### 3.1 Run Database Migrations
```bash
# Connect to your Neon database and run:
# The schema is already configured in the codebase
```

### 3.2 Seed Initial Data
```bash
# Add a test user to your Neon database:
INSERT INTO contractors (
  email, 
  password, 
  username, 
  first_name, 
  last_name, 
  company_name, 
  phone, 
  address, 
  city, 
  state, 
  zip, 
  country, 
  role, 
  plan, 
  subscription_status, 
  created_at, 
  updated_at
) VALUES (
  'test@remodra.com',
  'b5aaf5a25213238fedccac4601fb934016797a773a8b44b7c227a09218de822fc1fd7bac4be962a1a397f99ac707ab1a7db21c4d5f4ad144707626fe8d068279.b0e434eecad3396e40d5901b1fcf92a8',
  'testuser',
  'Test',
  'User',
  'Test Company',
  '(555) 123-4567',
  '123 Test St',
  'Test City',
  'TS',
  '12345',
  'USA',
  'contractor',
  'business',
  'active',
  EXTRACT(EPOCH FROM NOW()) * 1000,
  EXTRACT(EPOCH FROM NOW()) * 1000
);
```

## ✅ Step 4: Verify Deployment

### 4.1 Test Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 4.2 Test Login
```bash
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@remodra.com","password":"test123"}'
```

### 4.3 Access Frontend
Visit: `https://your-app.vercel.app`

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"
      }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🎯 Expected Results

✅ **Backend**: Running on Vercel serverless functions  
✅ **Frontend**: Served from Vercel CDN  
✅ **Database**: Neon PostgreSQL with real data  
✅ **Authentication**: Working with session management  
✅ **Complete Workflow System**: All features operational  

## 🚨 Troubleshooting

### Common Issues:
1. **Database Connection**: Check `DATABASE_URL` environment variable
2. **CORS Errors**: Verify `FRONTEND_URL` is set correctly
3. **Session Issues**: Check `SESSION_SECRET` is set
4. **Build Errors**: Check Node.js version compatibility

### Debug Commands:
```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Vercel logs
vercel logs
```

## 🎉 Success!

Once deployed, your Remodra application will be available at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.vercel.app/api`
- **Health Check**: `https://your-app.vercel.app/api/health`

**Login Credentials:**
- Email: `test@remodra.com`
- Password: `test123`
- Plan: Business 