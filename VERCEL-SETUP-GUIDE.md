# 🚀 Vercel Setup Guide for Get-Remodra

## 📋 **Prerequisites**
✅ GitHub repository: `https://github.com/YanGran36/Remodra-2.git`  
✅ Vercel configuration: `vercel.json` ready  
✅ Database schema: `setup-neon-database.sql` ready  

## 🌐 **Step 1: Create Vercel Account**

### 1.1 Sign up for Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 1.2 Access Vercel Dashboard
1. After signup, you'll be redirected to the Vercel dashboard
2. You should see your GitHub repositories listed

## 🚀 **Step 2: Deploy Get-Remodra**

### 2.1 Import Repository
1. In Vercel dashboard, click **"New Project"**
2. Find and select: `YanGran36/Remodra-2`
3. Click **"Import"**

### 2.2 Configure Project Settings
1. **Project Name**: `get-remodra`
2. **Framework Preset**: Vercel will auto-detect (should be "Other")
3. **Root Directory**: Leave as `/` (default)
4. **Build Command**: Leave as default
5. **Output Directory**: Leave as default

### 2.3 Environment Variables
**IMPORTANT**: Add these environment variables before deploying:

```
DATABASE_URL=postgresql://user:password@host/database
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here
FRONTEND_URL=https://get-remodra.vercel.app
```

**To add environment variables:**
1. Click **"Environment Variables"** section
2. Click **"Add"** for each variable
3. Enter the name and value
4. Make sure **"Production"** is selected for all

### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for build to complete (usually 2-3 minutes)
3. You'll see the deployment URL when done

## 🔧 **Step 3: Configure Vercel Settings**

### 3.1 Domain Settings
1. Go to your project dashboard
2. Click **"Settings"** → **"Domains"**
3. Your default URL will be: `https://get-remodra.vercel.app`

### 3.2 Function Settings
1. Go to **"Settings"** → **"Functions"**
2. Set **"Max Duration"** to 30 seconds
3. This is already configured in `vercel.json`

### 3.3 Environment Variables (if not set)
1. Go to **"Settings"** → **"Environment Variables"**
2. Add the variables listed above
3. Make sure they're set for **Production**

## 🗄️ **Step 4: Database Setup**

### 4.1 Create Neon Database
1. Go to [neon.tech](https://neon.tech)
2. Create new project: `get-remodra-db`
3. Copy the connection string

### 4.2 Update Environment Variable
1. In Vercel dashboard, go to **"Settings"** → **"Environment Variables"**
2. Update `DATABASE_URL` with your Neon connection string
3. Redeploy the project

### 4.3 Run Database Schema
1. In Neon dashboard, go to **"SQL Editor"**
2. Copy and paste the content of `setup-neon-database.sql`
3. Click **"Run"**
4. Verify tables are created

## ✅ **Step 5: Verify Deployment**

### 5.1 Test Health Check
```bash
curl https://get-remodra.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-08-02T...",
  "environment": "production",
  "database": "connected"
}
```

### 5.2 Test Login
```bash
curl -X POST https://get-remodra.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@remodra.com","password":"test123"}'
```

### 5.3 Access Frontend
Visit: `https://get-remodra.vercel.app`

## 🔧 **Troubleshooting**

### Common Issues:

#### **Build Errors**
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Vercel dashboard

#### **Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check that Neon database is accessible
- Ensure database schema is run

#### **CORS Errors**
- Verify `FRONTEND_URL` is set correctly
- Check that the URL matches your Vercel domain

#### **Session Issues**
- Ensure `SESSION_SECRET` is set
- Check that cookies are being set properly

### Debug Commands:
```bash
# Check Vercel logs
vercel logs

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test API endpoints
curl https://get-remodra.vercel.app/api/health
```

## 🎯 **Expected Results**

✅ **Frontend**: `https://get-remodra.vercel.app`  
✅ **Backend API**: `https://get-remodra.vercel.app/api`  
✅ **Health Check**: `https://get-remodra.vercel.app/api/health`  
✅ **Login**: test@remodra.com / test123 (Business Plan)  
✅ **Complete Workflow**: All 9 stages operational  

## 🎉 **Success!**

Once deployed, your Get-Remodra SaaS will be:
- **Production Ready**: Scalable Vercel infrastructure
- **Database Connected**: PostgreSQL with Neon
- **Fully Functional**: All features operational
- **Business Plan**: Test user with full access

**Your Get-Remodra SaaS is ready for production!** 🚀

## 📞 **Need Help?**

If you encounter any issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test database connection
4. Check API endpoints

**Follow this guide step by step and you'll have a fully operational SaaS!** 🎯 