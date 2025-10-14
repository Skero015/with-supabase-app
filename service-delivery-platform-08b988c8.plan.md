<!-- 08b988c8-5257-44a3-84c5-3fbf29d58a60 176187d2-bbe3-446e-94cc-d24be0fdfd5f -->
# Service Delivery Platform - Test-Driven with Vitest

## Feature 0: Vitest Testing Setup

**Goal**: Configure Vitest testing framework for automated unit and integration testing

**Implementation**:

- Install Vitest and testing dependencies
- Configure Vitest for Next.js App Router
- Set up React Testing Library
- Configure jsdom test environment
- Create test utilities and Supabase mocks
- Add test scripts to package.json
- Write example tests to verify setup

**Dependencies**:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom @testing-library/user-event
```

**Files to create**:

- `vitest.config.ts` - Vitest configuration with path aliases
- `__tests__/setup.ts` - Global test setup and mocks
- `__tests__/mocks/supabase.ts` - Mock Supabase client
- `__tests__/utils/test-helpers.tsx` - Test utilities and render helpers
- Update `package.json` - Add scripts: `test`, `test:watch`, `test:coverage`

**Verification test**:

- `__tests__/example.test.tsx` - Simple component test to verify setup

---

## Feature 1: Foundation - Database Types & RLS Policies

**Goal**: Database types, utilities, and RLS policies with unit tests

**Implementation**:

- TypeScript interfaces for all tables (FNO, InstallationStep, UserRole)
- Database query utilities with error handling
- Role checking utilities
- Implement RLS policies in Supabase (documented for manual verification)

**Files to create**:

- `lib/types/database.ts` - All database interfaces
- `lib/utils/role-check.ts` - Role checking functions (isManager, isAgent)
- `lib/queries/fnos.ts` - FNO query utilities
- `lib/queries/installation-steps.ts` - Installation steps queries
- `supabase/policies.sql` - All RLS policies SQL
- `supabase/rls-verification.md` - Manual RLS testing guide

**Test files**:

- `__tests__/lib/utils/role-check.test.ts` - Test role utilities
- `__tests__/lib/queries/fnos.test.ts` - Test FNO queries with mocked Supabase
- `__tests__/lib/queries/installation-steps.test.ts` - Test step queries

**Tests to write**:

- `isManager()` returns true for manager role
- `isAgent()` returns true for agent role
- Query functions handle success and error cases
- Query functions return correct TypeScript types

---

## Feature 2: Authentication with Role Selection & Layouts

**Goal**: Auth with role selection UI, base layouts for Manager/Agent dashboards

**UI Components**:

- Professional sign-up form with role radio buttons
- Polished login form
- Manager layout with sidebar navigation
- Agent layout with header navigation
- Loading spinner component

**Implementation**:

- Extend sign-up form with role selection (Manager/Agent with descriptions)
- Server action to insert role into `user_roles` table
- Utility to fetch user role
- Manager dashboard layout (sidebar, empty state for now)
- Agent dashboard layout (clean nav, empty state)
- Role-based routing after login

**Files to create/modify**:

- `components/sign-up-form.tsx` - Add role selection with icons
- `components/login-form.tsx` - Polish UI
- `app/actions/auth.ts` - Server actions for role management
- `lib/utils/get-user-role.ts` - Fetch user role utility
- `app/manager/layout.tsx` - Manager layout with sidebar
- `app/manager/page.tsx` - Empty state placeholder
- `app/agent/layout.tsx` - Agent layout
- `app/agent/page.tsx` - Empty state placeholder
- `components/manager-nav.tsx` - Manager navigation
- `components/agent-nav.tsx` - Agent navigation
- `components/ui/loading-spinner.tsx` - Loading component
- `app/protected/layout.tsx` - Role redirect logic

**Test files**:

- `__tests__/components/sign-up-form.test.tsx` - Test form and role selection
- `__tests__/components/login-form.test.tsx` - Test login validation
- `__tests__/app/actions/auth.test.ts` - Test server actions
- `__tests__/lib/utils/get-user-role.test.ts` - Test role fetching
- `__tests__/components/manager-nav.test.tsx` - Test navigation rendering
- `__tests__/components/agent-nav.test.tsx` - Test navigation rendering

**Tests to write**:

- Role radio buttons render and can be selected
- Form validates email and password match
- Server action inserts role into database
- getUserRole fetches correct role
- Manager layout renders sidebar
- Agent layout renders navigation
- Loading spinner displays

---

## Feature 3: Shared UI Components with Tests

**Goal**: Reusable UI components library with comprehensive tests

**UI Components**:

- Empty state with icon and message
- Confirmation dialog (using shadcn)
- Search bar with debouncing
- Page header with breadcrumbs
- Status badge (active/inactive with colors)
- Loading skeleton
- Error message component
- Success message component

**Files to create**:

- `components/ui/empty-state.tsx`
- `components/ui/confirm-dialog.tsx`
- `components/ui/search-bar.tsx`
- `components/ui/page-header.tsx`
- `components/ui/status-badge.tsx`
- `components/ui/loading-skeleton.tsx`
- `components/ui/error-message.tsx`
- `components/ui/success-message.tsx`

**Test files**:

- `__tests__/components/ui/empty-state.test.tsx`
- `__tests__/components/ui/confirm-dialog.test.tsx`
- `__tests__/components/ui/search-bar.test.tsx`
- `__tests__/components/ui/page-header.test.tsx`
- `__tests__/components/ui/status-badge.test.tsx`
- `__tests__/components/ui/loading-skeleton.test.tsx`
- `__tests__/components/ui/error-message.test.tsx`
- `__tests__/components/ui/success-message.test.tsx`

**Tests to write**:

- Components render with correct props
- Confirm dialog opens/closes correctly
- Search debounces input (test with fake timers)
- Status badge shows correct color for status
- Empty state displays icon and message

---

## Feature 4: Manager FNO CRUD with UI & Tests

**Goal**: Complete FNO management with professional UI and comprehensive tests

**UI & Implementation**:

- FNO list page (grid layout with cards)
- Create FNO form with validation
- Edit FNO form (pre-populated)
- Delete with confirmation
- Search/filter functionality
- Server actions for CRUD
- Client and server validation

**Files to create**:

- `app/manager/page.tsx` - FNO list with search
- `app/manager/fnos/new/page.tsx` - Create FNO
- `app/manager/fnos/[id]/edit/page.tsx` - Edit FNO
- `components/fno-form.tsx` - Reusable form with validation
- `components/fno-card.tsx` - FNO card component
- `components/fno-list.tsx` - List with search
- `app/actions/fnos.ts` - CRUD server actions
- `lib/utils/validation.ts` - Validation helpers

**Test files**:

- `__tests__/components/fno-form.test.tsx` - Form validation tests
- `__tests__/components/fno-card.test.tsx` - Card rendering tests
- `__tests__/components/fno-list.test.tsx` - List and search tests
- `__tests__/app/actions/fnos.test.ts` - Server action tests
- `__tests__/lib/utils/validation.test.ts` - Validation function tests

**Tests to write**:

- Form validates required fields (name)
- Form validates SLA is positive number
- Create action inserts FNO into database
- Edit action updates existing FNO
- Delete action removes FNO
- List filters by search term
- Form shows validation errors
- Success/error messages display

---

## Feature 5: Manager Installation Steps with UI & Tests

**Goal**: Installation steps CRUD with intuitive UI and comprehensive tests

**UI & Implementation**:

- FNO detail page with steps management
- Add step form (modal or inline)
- Edit step form
- Delete with confirmation
- Reorder steps (up/down buttons)
- Minimum 3 steps validation
- Server actions for step CRUD

**Files to create**:

- `app/manager/fnos/[id]/page.tsx` - FNO detail with steps
- `components/installation-step-form.tsx` - Add/edit form
- `components/installation-step-list.tsx` - Step list with actions
- `components/installation-step-card.tsx` - Individual step
- `app/actions/installation-steps.ts` - Step CRUD actions

**Test files**:

- `__tests__/components/installation-step-form.test.tsx` - Form tests
- `__tests__/components/installation-step-list.test.tsx` - List tests
- `__tests__/components/installation-step-card.test.tsx` - Card tests
- `__tests__/app/actions/installation-steps.test.ts` - Server action tests

**Tests to write**:

- Step form validates required fields (title, description)
- Create step inserts with correct FNO ID
- Edit step updates existing step
- Delete step removes from database
- Reorder updates step_number correctly
- Validation warns if less than 3 steps
- Authorization check (only owner can edit)

---

## Feature 6: Agent FNO Viewing with UI & Tests

**Goal**: Agent read-only view with clean UI and comprehensive tests

**UI & Implementation**:

- FNO list (all active FNOs)
- Search and filter
- FNO detail page (read-only)
- Installation steps display (numbered)
- No edit/delete buttons
- Print-friendly styling

**Files to create**:

- `app/agent/page.tsx` - All FNOs list
- `app/agent/fnos/[id]/page.tsx` - FNO detail (read-only)
- `components/agent-fno-card.tsx` - Agent view card
- `components/fno-detail-card.tsx` - Read-only info display
- `components/installation-steps-display.tsx` - Read-only steps

**Test files**:

- `__tests__/components/agent-fno-card.test.tsx` - Card tests
- `__tests__/components/fno-detail-card.test.tsx` - Detail tests
- `__tests__/components/installation-steps-display.test.tsx` - Steps display tests
- `__tests__/app/agent/page.test.tsx` - Agent list page tests

**Tests to write**:

- Agent can view all active FNOs
- Search filters FNOs correctly
- Detail page displays all FNO information
- Steps display in correct order
- No edit/delete buttons present
- Inactive FNOs not shown (or marked)

---

## Feature 7: Role-Based Routing & Access Control with Tests

**Goal**: Secure routes with role-based access control and comprehensive tests

**Implementation**:

- Enhanced middleware for auth and role checks
- Protected route redirects based on role
- Prevent cross-role access (manager → agent routes blocked)
- Handle edge cases (no role, invalid role)
- Unauthorized error page

**Files to modify/create**:

- `middleware.ts` - Role-based route protection
- `app/protected/layout.tsx` - Role check and redirect
- `app/unauthorized/page.tsx` - Error page
- `lib/utils/check-role-access.ts` - Access checking utility

**Test files**:

- `__tests__/lib/utils/check-role-access.test.ts` - Access control tests
- `__tests__/middleware.test.ts` - Middleware redirect tests

**Tests to write**:

- Manager redirects to `/manager` after login
- Agent redirects to `/agent` after login
- Manager cannot access `/agent` routes
- Agent cannot access `/manager` routes
- Unauthenticated users redirect to login
- Users without role handled gracefully

---

## Feature 8: Comprehensive Validation & Error Handling

**Goal**: Thorough validation and error handling with tests

**Implementation**:

- Client-side validation for all forms
- Server-side validation in all actions
- User-friendly error messages
- Field-level and form-level errors
- Network error handling
- Database error handling
- Loading states

**Files to modify/create**:

- All form components - Add validation
- All server actions - Add validation and error handling
- `lib/utils/validation.ts` - Validation functions
- `lib/utils/error-messages.ts` - Error message helpers

**Test files**:

- Update all existing test files with validation tests
- `__tests__/lib/utils/validation.test.ts` - Validation function tests
- `__tests__/lib/utils/error-messages.test.ts` - Error message tests

**Tests to write**:

- All form validations work (required, types, ranges)
- Server actions validate input
- Error messages display correctly
- Network errors handled gracefully
- Database errors handled gracefully
- Forms disabled during submission

---

## Feature 9: Documentation & Demo Setup

**Goal**: Complete documentation, test accounts, and demo data

**Implementation**:

- Update README with setup instructions
- Create `.env.example`
- Create test accounts (manager + agent)
- Add sample FNO data
- Document test coverage
- Document known limitations

**Files to create/modify**:

- `README.md` - Complete setup guide with test credentials
- `.env.example` - Environment variables
- `TESTING.md` - How to run tests, coverage reports
- `supabase/seed-data.sql` - Sample data for testing

**Commands to document**:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### To-dos

- [ ] Extend authentication with role selection (Manager/Agent) during signup and create utilities to fetch user role
- [ ] Implement RLS policies in Supabase for user_roles, fnos, and installation_steps tables
- [ ] Create TypeScript types and database query utilities for type-safe operations
- [ ] Build Manager dashboard with FNO CRUD functionality (create, read, update, delete)
- [ ] Add installation steps management for FNOs in Manager dashboard
- [ ] Create Agent dashboard with read-only view of all active FNOs and installation steps
- [ ] Implement role-based routing and navigation to redirect users to appropriate dashboards
- [ ] Add loading states, form validation, error handling, and responsive design
- [ ] Update documentation, create test accounts, and add setup instructions