# Remodra SaaS - Contractor Management Platform

## Overview

Remodra is a comprehensive SaaS platform designed for contractors to manage their business operations, including client relationships, estimates, invoices, projects, and subscription billing. The application features a complete customer journey from landing page to subscription management, with three tiered pricing plans and Stripe integration.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components built on Radix UI
- **Styling**: Tailwind CSS with custom responsive design system
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Session-based authentication with Passport.js

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints with middleware-based authorization

### Database Design
- **ORM**: Drizzle with PostgreSQL adapter
- **Schema**: Comprehensive multi-tenant schema with contractor isolation
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Customer Journey System
1. **Landing Page** (`/landing`) - Marketing and feature showcase
2. **Pricing Page** (`/plans`) - Three-tier subscription model
3. **Authentication** (`/auth`) - Signup/login with subscription activation
4. **Main Application** (`/dashboard`) - Full contractor management suite
5. **Billing Management** (`/billing`) - Subscription and payment controls

### Subscription Management
- **Three Tiers**: Basic ($29), Pro ($59), Business ($99)
- **Feature Gates**: Client limits, AI usage, time tracking, Stripe integration
- **Stripe Integration**: Automatic billing, plan upgrades/downgrades
- **Usage Tracking**: Real-time monitoring of plan limits

### Core Business Features
- **Client Management**: Complete CRM with contact information and history
- **Project Management**: Job tracking with status updates and timelines
- **Estimation System**: Multi-service estimates with AI cost analysis
- **Invoice Generation**: Professional invoicing with payment tracking
- **Material Management**: Inventory and pricing management
- **Time Tracking**: Employee time clock with location tracking
- **Agent Management**: Field representative coordination

### AI Integration
- **Cost Analysis**: OpenAI-powered job cost estimation
- **Document Analysis**: Anthropic Claude for PDF document review
- **Job Descriptions**: Automated professional description generation
- **Usage Monitoring**: Per-plan AI usage limits and tracking

## Data Flow

### Authentication Flow
1. User registers via `/auth` with subscription plan selection
2. Stripe processes payment and creates customer/subscription
3. Session established with contractor data and plan limits
4. Middleware enforces feature access based on subscription tier

### Resource Access Pattern
1. All resources are isolated by contractor ID (multi-tenant)
2. Authorization middleware verifies resource ownership
3. Subscription middleware enforces plan-based feature limits
4. Audit middleware logs all access attempts for security

### AI Analysis Workflow
1. User initiates analysis request (estimate, project, document)
2. System checks AI usage against subscription limits
3. Request routed to appropriate AI service (OpenAI/Anthropic)
4. Usage logged and counted against monthly limits
5. Results returned and stored for future reference

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment infrastructure
  - Customer management
  - Subscription billing
  - Plan changes and prorations
  - Webhook handling for status updates

### AI Services
- **OpenAI API**: GPT-4o for cost analysis and job descriptions
- **Anthropic API**: Claude-3.5-Sonnet for document analysis
- **Usage Tracking**: Monthly limits enforced per subscription tier

### Database and Hosting
- **Neon PostgreSQL**: Serverless database with connection pooling
- **Replit Deployment**: Autoscale deployment with health monitoring
- **Session Storage**: PostgreSQL-backed session persistence

### Email and Communications
- **SendGrid**: Transactional email service
- **Nodemailer**: SMTP integration for client communications

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite development server with HMR
- **Database**: Shared Neon database with migration scripts
- **Environment Variables**: Local `.env` file management

### Production Deployment
- **Platform**: Replit autoscale deployment
- **Build Process**: Vite build for frontend, esbuild for backend
- **Database**: Production Neon PostgreSQL instance
- **Monitoring**: Health check endpoints and error logging

### Database Management
- **Migrations**: Drizzle Kit push for schema updates
- **Seeding**: Automated seed scripts for development data
- **Backup**: Neon automated backups and point-in-time recovery

## Changelog

- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.