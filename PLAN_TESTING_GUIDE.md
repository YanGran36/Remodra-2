# Plan-Based Access Control Testing Guide

## 🎯 Overview
This guide shows you how to test the three different subscription plans and their access controls in the Remodra SaaS platform.

## 📊 Account Setup

### **Available Test Accounts:**

| Account | Email | Password | Plan | Features |
|---------|-------|----------|------|----------|
| **Basic** | `test@remodra.com` | `test123` | Basic | Calendar, Estimates, Invoices |
| **Pro** | `john@abccontracting.com` | `password123` | Pro | Basic + Projects, AI Assistant |
| **Business** | `carlos@emial.com` | (unknown) | Business | All features |

## 🚀 Testing Instructions

### **Step 1: Start the Application**
```bash
export DATABASE_URL="sqlite://./dev.db"
npm run dev
```

### **Step 2: Test Each Plan**

#### **🔵 Basic Plan Testing**
1. **Login**: `test@remodra.com` / `test123`
2. **Expected Sidebar Features**:
   - ✅ Dashboard
   - ✅ Calendar
   - ✅ Estimates
   - ✅ Invoices
   - 🔒 Clients (locked)
   - 🔒 Projects (locked)
   - 🔒 Materials (locked)
   - 🔒 Time Clock (locked)
   - 🔒 Agents (locked)
   - 🔒 AI Assistant (locked)
   - 🔒 Tools (locked)
   - ✅ Settings

3. **Test Navigation**:
   - Visit `/dashboard` - Should work
   - Visit `/calendar` - Should work
   - Visit `/estimates` - Should work
   - Visit `/invoices` - Should work
   - Visit `/clients` - Should show upgrade prompt
   - Visit `/projects` - Should show upgrade prompt
   - Visit `/ai-assistant` - Should show upgrade prompt

#### **🟢 Pro Plan Testing**
1. **Login**: `john@abccontracting.com` / `password123`
2. **Expected Sidebar Features**:
   - ✅ Dashboard
   - ✅ Calendar
   - ✅ Estimates
   - ✅ Invoices
   - ✅ Projects
   - ✅ AI Assistant
   - 🔒 Clients (locked)
   - 🔒 Materials (locked)
   - 🔒 Time Clock (locked)
   - 🔒 Agents (locked)
   - 🔒 Tools (locked)
   - ✅ Settings

3. **Test Navigation**:
   - Visit `/dashboard` - Should work
   - Visit `/calendar` - Should work
   - Visit `/estimates` - Should work
   - Visit `/invoices` - Should work
   - Visit `/projects` - Should work
   - Visit `/ai-assistant` - Should work
   - Visit `/clients` - Should show upgrade prompt
   - Visit `/timeclock` - Should show upgrade prompt

#### **🟣 Business Plan Testing**
1. **Login**: `carlos@emial.com` / (check password)
2. **Expected Sidebar Features**:
   - ✅ Dashboard
   - ✅ Calendar
   - ✅ Estimates
   - ✅ Invoices
   - ✅ Projects
   - ✅ AI Assistant
   - ✅ Clients
   - ✅ Materials
   - ✅ Time Clock
   - ✅ Agents
   - ✅ Tools
   - ✅ Settings

3. **Test Navigation**:
   - All pages should be accessible
   - No upgrade prompts should appear

## 🔍 Feature Testing Details

### **Basic Plan Features**
- **Dashboard**: Overview with basic stats
- **Calendar**: View and manage events
- **Estimates**: Create and manage estimates
- **Invoices**: Create and manage invoices
- **Settings**: Account configuration

### **Pro Plan Features (Basic +)**
- **Projects**: Project management and tracking
- **AI Assistant**: AI-powered cost analysis (limited usage)

### **Business Plan Features (All)**
- **Clients**: Full client management
- **Materials**: Material inventory and pricing
- **Time Clock**: Employee time tracking
- **Agents**: Agent management system
- **Tools**: Advanced business tools

## 🎨 Visual Indicators

### **Sidebar Plan Badge**
- **Blue**: Basic Plan
- **Green**: Pro Plan  
- **Purple**: Business Plan

### **Locked Features**
- Grayed out with lock icon
- "Upgrade to Unlock" section
- Clicking shows upgrade prompt

### **Dashboard Plan Info**
- Plan badge in welcome section
- Feature summary for current plan

## 🧪 Testing Scenarios

### **Scenario 1: Basic User Tries Pro Feature**
1. Login as `test@remodra.com`
2. Try to access `/projects`
3. **Expected**: Upgrade prompt with Pro plan details

### **Scenario 2: Pro User Tries Business Feature**
1. Login as `john@abccontracting.com`
2. Try to access `/timeclock`
3. **Expected**: Upgrade prompt with Business plan details

### **Scenario 3: Business User Full Access**
1. Login as `carlos@emial.com`
2. Navigate through all features
3. **Expected**: No restrictions, full access

### **Scenario 4: Plan Upgrade Flow**
1. Login as any user
2. Click "Upgrade Now" on locked feature
3. **Expected**: Redirect to `/auth` with plan selection

## 🔧 Database Verification

### **Check Account Plans**
```bash
sqlite3 dev.db "SELECT email, plan, subscription_status FROM contractors;"
```

### **Expected Output**:
```
test@remodra.com|basic|active
john@abccontracting.com|pro|active
carlos@emial.com|business|active
```

### **Check Subscription Plans**
```bash
sqlite3 dev.db "SELECT plan_name, price_monthly, client_limit FROM subscription_plans;"
```

## 🐛 Troubleshooting

### **Common Issues**

1. **Plan Not Showing Correctly**
   - Check database: `SELECT plan FROM contractors WHERE email = 'user@email.com';`
   - Verify user object in React DevTools
   - Check browser console for errors

2. **Features Not Locked/Unlocked**
   - Verify plan hierarchy logic
   - Check `usePlanAccess` hook
   - Ensure sidebar filtering is working

3. **Upgrade Prompts Not Appearing**
   - Check `PlanAccessControl` component
   - Verify routing protection
   - Test direct URL access

### **Debug Commands**
```bash
# Check user authentication
curl http://localhost:3001/api/user

# Check subscription status
curl http://localhost:3001/api/subscription/status

# Check plan limits
curl http://localhost:3001/api/subscription/plans
```

## 📈 Expected User Experience

### **Basic Plan User**
- Sees limited navigation options
- Can access core features (calendar, estimates, invoices)
- Gets upgrade prompts for advanced features
- Clear understanding of plan limitations

### **Pro Plan User**
- Sees expanded feature set
- Can manage projects and use AI assistant
- Still gets upgrade prompts for business features
- Good balance of features vs. cost

### **Business Plan User**
- Full access to all features
- No upgrade prompts
- Professional experience
- Maximum functionality

## 🎯 Success Criteria

✅ **Basic Plan**: Can only access calendar, estimates, invoices
✅ **Pro Plan**: Can access basic + projects, AI assistant
✅ **Business Plan**: Can access all features
✅ **Upgrade Prompts**: Appear for locked features
✅ **Visual Indicators**: Clear plan badges and locked states
✅ **Navigation**: Sidebar filters correctly by plan
✅ **Database**: Plans stored and retrieved correctly

This testing ensures the subscription system works correctly and provides appropriate access control based on user plans. 