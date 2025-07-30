# Complete Authentication Flow Guide

## 🎯 Overview
This guide shows you how to test the complete authentication system with plan selection, registration, and login functionality.

## ✅ Available Pages

### **Public Pages (No Authentication Required)**
1. **Landing Page** (`/landing`) - Main entry point
2. **Auth Page** (`/auth`) - Login/Registration with plan selection
3. **Pricing Page** (`/pricing`) - Detailed pricing information
4. **Simple Login** (`/simple-login`) - Quick demo login

### **Protected Pages (Authentication Required)**
1. **Dashboard** (`/dashboard`) - Main application dashboard
2. **Clients** (`/clients`) - Client management
3. **Estimates** (`/estimates`) - Estimate creation and management
4. **Projects** (`/projects`) - Project tracking
5. **Invoices** (`/invoices`) - Invoice management
6. **Settings** (`/settings`) - Account settings

## 🚀 Testing Flow

### **Step 1: Start the Application**
```bash
# Start the backend server
npm run dev

# In another terminal, start the frontend
cd client
npm run dev
```

### **Step 2: Access the Landing Page**
1. Open your browser to `http://localhost:3000/landing`
2. You'll see the Remodra welcome page with three options:
   - **Get Started** → Goes to `/auth` (registration/login)
   - **View Pricing** → Goes to `/pricing` (detailed pricing)
   - **Demo Login** → Goes to `/simple-login` (quick login)

### **Step 3: Test Registration Flow**
1. Click **"Get Started"** or go to `http://localhost:3000/auth`
2. You'll see a dual-panel interface:
   - **Left Panel**: Login/Registration forms
   - **Right Panel**: Plan selection

3. **Switch to Registration Tab**:
   - Fill in your details:
     - First Name: `John`
     - Last Name: `Contractor`
     - Email: `john@example.com`
     - Company Name: `ABC Contracting`
     - Phone: `(555) 123-4567`
     - Password: `password123`
     - Confirm Password: `password123`

4. **Select a Plan** (right panel):
   - **Basic** ($29/month) - 10 clients, basic features
   - **Pro** ($59/month) - 50 clients, AI features
   - **Business** ($99/month) - Unlimited, all features

5. **Click "Create Account"**
   - Account will be created with the selected plan
   - You'll be automatically logged in
   - Redirected to `/dashboard`

### **Step 4: Test Login Flow**
1. Go to `http://localhost:3000/auth`
2. **Switch to Login Tab**:
   - Email: `john@example.com`
   - Password: `password123`
3. **Click "Sign In"**
   - You'll be logged in and redirected to `/dashboard`

### **Step 5: Test Demo Login**
1. Go to `http://localhost:3000/simple-login`
2. Use the demo credentials:
   - Email: `test@remodra.com`
   - Password: `test123`
3. **Click "Sign In"**
   - You'll be logged in with a demo account

### **Step 6: Explore the Application**
Once logged in, you can access:

#### **Main Features**
- **Dashboard** (`/dashboard`) - Overview of your business
- **Clients** (`/clients`) - Manage client relationships
- **Estimates** (`/estimates`) - Create and manage estimates
- **Projects** (`/projects`) - Track project progress
- **Invoices** (`/invoices`) - Handle billing

#### **Advanced Features** (Based on Plan)
- **AI Assistant** (`/ai-assistant`) - AI-powered cost analysis
- **Time Clock** (`/timeclock`) - Employee time tracking
- **Settings** (`/settings`) - Account configuration

## 📊 Plan Features by Subscription

### **Basic Plan ($29/month)**
- ✅ Up to 10 clients
- ✅ Basic estimates & invoices
- ✅ Project tracking
- ❌ AI cost analysis
- ❌ Time clock
- ❌ Stripe integration

### **Pro Plan ($59/month)**
- ✅ Up to 50 clients
- ✅ AI cost analysis (10/month)
- ✅ Time clock functionality
- ✅ Custom client portal
- ❌ Stripe integration

### **Business Plan ($99/month)**
- ✅ Unlimited clients
- ✅ Unlimited AI analysis
- ✅ Stripe integration
- ✅ Fully branded portal
- ✅ All features unlocked

## 🔧 Development Testing

### **Create Multiple Test Accounts**
```bash
# Test different plans
Email: basic@test.com, Plan: basic
Email: pro@test.com, Plan: pro  
Email: business@test.com, Plan: business
```

### **Test Plan Limitations**
1. **Client Limits**:
   - Basic: Try to add more than 10 clients
   - Pro: Try to add more than 50 clients
   - Business: No limits

2. **AI Usage**:
   - Basic: AI features should be disabled
   - Pro: Limited to 10 AI analyses per month
   - Business: Unlimited AI usage

3. **Feature Access**:
   - Time Clock: Only Pro and Business
   - Stripe Integration: Only Business
   - Custom Portal: Pro and Business

### **Database Verification**
```bash
# Check created accounts
sqlite3 dev.db "SELECT email, plan, subscription_status FROM contractors;"

# Check subscription plans
sqlite3 dev.db "SELECT * FROM subscription_plans;"
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Registration Fails**
   - Check server logs for errors
   - Verify database connection
   - Ensure all required fields are filled

2. **Login Fails**
   - Verify email/password combination
   - Check if account exists in database
   - Ensure subscription status is 'active'

3. **Plan Features Not Working**
   - Verify plan assignment in database
   - Check subscription middleware
   - Ensure feature gates are properly implemented

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3001/health

# Check user authentication
curl http://localhost:3001/api/user

# Check subscription status
curl http://localhost:3001/api/subscription/status
```

## 🎯 Next Steps

### **For Testing**
1. Test all three subscription plans
2. Verify feature access controls
3. Test plan upgrade/downgrade flows
4. Verify usage tracking

### **For Development**
1. Implement Stripe integration
2. Add payment processing
3. Create admin dashboard
4. Add usage analytics

### **For Production**
1. Set up proper SSL certificates
2. Configure production database
3. Implement email verification
4. Add password reset functionality

## 📝 Notes

- All new accounts start with "basic" plan by default
- Demo account (`test@remodra.com`) has full access for testing
- Plan features are enforced through middleware
- Usage tracking is implemented for AI features
- Session management handles authentication state

This authentication flow provides a complete foundation for your SaaS platform with proper plan-based access control. 