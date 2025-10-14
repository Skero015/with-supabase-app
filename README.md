# Service Delivery Platform

A comprehensive Service Delivery Platform built with Next.js and Supabase that helps manage Fibre Network Operator (FNO) installation processes. Service delivery managers create and maintain FNO profiles and their installation procedures, while agents access this information in the field.

## 🎯 Business Context

Different Fibre Network Operators (Vumatel, Frogfoot, Openserve, etc.) have unique installation procedures. Service delivery agents need quick access to the correct process for each FNO they're working with.

## 👥 User Roles

### Service Delivery Manager
- Create and manage FNO profiles
- Define installation processes for each FNO
- Edit/update procedures as requirements change
- Delete inactive FNOs

### Service Delivery Agent
- View all FNO profiles
- Access installation processes for any FNO
- Read-only access (cannot modify data)

## 🚀 Features

- **Authentication**: Email/password signup and login with role selection
- **Manager Dashboard**: Create, edit, and manage FNOs with installation steps
- **Agent Dashboard**: View all active FNOs and their installation processes
- **Security**: Row Level Security (RLS) policies for role-based access control
- **Role-based UI**: Different views and permissions for Manager vs Agent
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui components
- **TypeScript**: Full type safety
- **Testing**: Vitest + Testing Library

## 📋 Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. Basic knowledge of Next.js and React

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/Skero015/with-supabase-app.git
cd with-supabase-app
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Supabase client, Tailwind CSS, and testing libraries.

### Step 3: Environment Setup

#### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For RLS setup and testing
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### How to Get These Values:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

**⚠️ Security Note:** Never commit `.env.local` to version control. The `service_role` key has admin privileges.

### Step 4: Database Setup

#### Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User roles table
create table user_roles (
  user_id uuid references auth.users(id) primary key,
  role text not null check (role in ('manager', 'agent')),
  created_at timestamp default now()
);

-- FNOs table
create table fnos (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text,
  support_number text,
  coverage_area text,
  sla_hours integer,
  status text default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Installation process steps
create table installation_steps (
  id uuid primary key default uuid_generate_v4(),
  fno_id uuid references fnos(id) on delete cascade,
  step_number integer not null,
  title text not null,
  description text not null,
  created_at timestamp default now()
);
```

#### Apply RLS Policies

**Important**: This step is critical for security!

```bash
npm run setup-rls
```

This script will:
- Enable Row Level Security on all tables
- Create policies that ensure managers can only access their own FNOs
- Ensure agents can only view (not modify) active FNOs
- Set up proper access controls for installation steps

#### Verify RLS Setup (Optional)

```bash
npm run test-rls
```

This will run comprehensive tests to ensure your RLS policies are working correctly.

### Step 5: Configure Supabase Auth Settings

For development, disable email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Disable **"Confirm email"**
3. Save changes

This allows immediate login after signup during development.

### Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Step 7: Create Test Accounts

Navigate to [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up) and create accounts for testing.

## 🧪 Sample Login Credentials for Testing

After setting up the database, you can create test accounts or use these sample credentials:

### Manager Account
```
Email: manager@test.com
Password: Manager123
Role: Service Delivery Manager
```

**Capabilities:**
- Create new FNOs
- Edit existing FNOs
- Add/modify installation steps
- Delete FNOs
- View all FNOs they created

### Agent Account
```
Email: agent@test.com
Password: Agent123
Role: Service Delivery Agent
```

**Capabilities:**
- View all active FNOs (read-only)
- Access installation procedures
- Cannot create, edit, or delete FNOs

**Note:** You'll need to create these accounts via the sign-up form first. The password requirements are:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 🔐 Security Features

### Row Level Security (RLS)

The application implements comprehensive RLS policies:

- **User Roles**: Users can only access their own role records
- **FNOs**: 
  - Managers can CRUD only FNOs they created
  - Agents can SELECT all active FNOs (read-only)
- **Installation Steps**: Inherit permissions from parent FNO

### Role-Based Routing

The middleware enforces role-based access:
- `/dashboard/manager/*` - Only accessible by managers
- `/dashboard/agent/*` - Only accessible by agents
- Automatic redirection based on user role

## 📚 Usage Guide

### For Managers

1. **Sign up** with a manager account
2. **Create FNOs** with details like contact person, support number, coverage area
3. **Add installation steps** for each FNO (minimum 3 steps required)
4. **Edit/Update** FNOs and steps as needed
5. **Manage status** (active/inactive) of FNOs

### For Agents

1. **Sign up** with an agent account
2. **View all active FNOs** in a clean list format
3. **Click on any FNO** to see detailed installation process
4. **Follow numbered installation steps** in the field

## 🧪 Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests with UI

```bash
npm run test:ui
```

### Test Coverage

```bash
npm run test:coverage
```

### Test RLS Policies

```bash
npm run test-rls
```

## 📁 Project Structure

```
with-supabase-app/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Dashboard layouts and pages
│   │   ├── agent/               # Agent-specific pages
│   │   └── manager/             # Manager-specific pages
│   └── protected/               # Protected route examples
├── components/                   # Reusable UI components
│   ├── dashboard/               # Dashboard-specific components
│   └── ui/                      # shadcn/ui components
├── lib/                         # Utility libraries
│   ├── database/                # Database utilities and types
│   └── supabase/                # Supabase client configuration
├── scripts/                     # Setup and utility scripts
└── src/test/                    # Test files
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run setup-rls` - Apply RLS policies to database
- `npm run test-rls` - Test RLS policies

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
```

## 📊 Sample Data

Here's what an FNO record might look like:

**Vumatel**
- Contact Person: John Smith
- Support Number: 087 XXX XXXX
- Coverage Area: Johannesburg, Pretoria
- SLA: 48 hours

**Installation Steps:**
1. Pre-check - Verify customer details on Vumatel portal
2. Equipment Check - Confirm ONT compatibility (Huawei HG8145V5)
3. Site Survey - Complete pre-installation checklist
4. Installation - Install fibre drop cable from boundary box
5. Configuration - Mount and configure ONT
6. Testing - Test connection speed (min 100Mbps)
7. Documentation - Complete Vumatel installation form
8. Submission - Submit photos to Vumatel portal

## ⚠️ Known Limitations & Trade-offs

### 1. Email Confirmation Disabled
**Limitation:** Email confirmation is disabled for development convenience.  
**Trade-off:** In production, you should enable email confirmation for security.  
**Impact:** Users can immediately log in after signup without verifying their email.

### 2. Password Reset Flow
**Limitation:** Password reset functionality is basic and uses Supabase's default flow.  
**Trade-off:** Custom password reset UI not implemented to focus on core features.  
**Workaround:** Users can use the "Forgot Password" link which sends a Supabase-hosted reset page.

### 3. Role Assignment During Signup
**Limitation:** Users self-select their role during signup (Manager or Agent).  
**Trade-off:** In production, you'd typically want admin approval for manager roles.  
**Impact:** Any user can sign up as a manager. Consider implementing role approval workflow for production.

### 4. Test-Driven Development (TDD) Coverage
**Limitation:** Not all components have comprehensive test coverage.  
**Trade-off:** Focused on working functionality over 100% test coverage to meet delivery timeline.  
**Current Coverage:** Core database functions, authentication flows, and critical components are tested.

### 5. Client-Side Role Checks
**Limitation:** Some role-based UI hiding happens on the client side.  
**Trade-off:** Server-side enforcement is in place, but UI still renders before hiding unauthorized elements.  
**Mitigation:** All routes have server-side protection; client-side checks are for UX only.

### 6. FNO Deletion
**Limitation:** FNOs are hard-deleted from the database (not soft-deleted).  
**Trade-off:** Simpler implementation but no audit trail of deleted FNOs.  
**Impact:** Once deleted, FNO data cannot be recovered.

### 7. Single Supabase Project
**Limitation:** Uses a single Supabase project for all environments.  
**Trade-off:** Separate staging/production projects would be ideal but add complexity.  
**Recommendation:** Use separate Supabase projects for production deployment.

### 8. No Real-Time Updates
**Limitation:** Dashboard doesn't update in real-time when other users make changes.  
**Trade-off:** Implementing Supabase real-time subscriptions would add complexity.  
**Workaround:** Users need to refresh the page to see updates from other users.

### 9. Basic Error Handling
**Limitation:** Some error messages are generic (e.g., "An error occurred").  
**Trade-off:** Focused on core functionality over comprehensive error messaging.  
**Impact:** Users may need to check console logs for detailed error information.

### 10. Mobile Optimization
**Limitation:** While responsive, the UI is optimized for desktop/tablet use.  
**Trade-off:** Field agents typically use tablets; phone optimization was lower priority.  
**Impact:** Usable on phones but not ideal for very small screens.

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid Supabase URL" Error**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly in `.env.local`
   - Ensure the URL starts with `https://` and ends with `.supabase.co`
   - Restart the dev server after changing environment variables

2. **RLS Policies Not Working**
   - Run `npm run setup-rls` to apply policies
   - Check that your `SUPABASE_SERVICE_ROLE_KEY` is set correctly
   - Verify policies in Supabase dashboard under **Authentication** → **Policies**

3. **Authentication Issues / Redirect Loop**
   - Ensure environment variables are set correctly
   - Check that email confirmation is disabled in Supabase Auth settings for development
   - Clear browser cookies and localStorage
   - Check browser console for detailed error messages

4. **Role-Based Routing Issues**
   - Verify user has a role in the `user_roles` table (check Supabase Table Editor)
   - Check middleware logs in terminal for routing decisions
   - Ensure RLS policies are applied correctly

5. **"Cannot read properties of null" Errors**
   - Usually means user is not authenticated
   - Try logging out and logging back in
   - Check that session cookies are being set (browser DevTools → Application → Cookies)

6. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Delete `.next` folder and rebuild: `rm -rf .next && npm run build`
   - Check for TypeScript errors: `npx tsc --noEmit`

### Getting Help

1. Check the browser console for error messages (F12 → Console)
2. Check the terminal for server-side errors
3. Verify your Supabase configuration in the dashboard
4. Run `npm run test-rls` to check security setup
5. Review the documentation files in the repository:
   - `ROLE_BASED_ACCESS_CONTROL.md` - Security implementation
   - `FORM_UX_IMPROVEMENTS.md` - Form validation details
   - `ARCHITECTURAL_ANALYSIS_AND_FIX.md` - Deep dive into auth flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
