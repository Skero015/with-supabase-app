-- Complete RLS Setup for Service Delivery Platform
-- Run this SQL in your Supabase SQL Editor to fix the signup RLS issues
-- This will enable proper user signup and role assignment

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE fnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE installation_steps DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Managers can CRUD their own FNOs" ON fnos;
DROP POLICY IF EXISTS "Agents can select all active FNOs" ON fnos;
DROP POLICY IF EXISTS "Managers can select all FNOs" ON fnos;
DROP POLICY IF EXISTS "Managers can CRUD steps for their FNOs" ON installation_steps;
DROP POLICY IF EXISTS "Agents can select steps for active FNOs" ON installation_steps;

-- Step 3: Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_steps ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper policies for signup flow

-- User Roles Policies (CRITICAL: These must allow signup)
-- Allow users to insert their own role during signup
CREATE POLICY "Allow users to insert their own role" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own role
CREATE POLICY "Allow users to read their own role" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own role (if needed)
CREATE POLICY "Allow users to update their own role" ON user_roles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FNOs Policies
-- Managers can do everything with their own FNOs
CREATE POLICY "Managers can manage their own FNOs" ON fnos
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Agents can view all active FNOs
CREATE POLICY "Agents can view active FNOs" ON fnos
  FOR SELECT TO authenticated
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'agent'
    )
  );

-- Managers can view all FNOs (including inactive ones they created)
CREATE POLICY "Managers can view all FNOs" ON fnos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- Installation Steps Policies
-- Managers can manage steps for their FNOs
CREATE POLICY "Managers can manage installation steps" ON installation_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fnos 
      WHERE fnos.id = installation_steps.fno_id 
      AND fnos.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'manager'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fnos 
      WHERE fnos.id = installation_steps.fno_id 
      AND fnos.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'manager'
      )
    )
  );

-- Agents can view steps for active FNOs
CREATE POLICY "Agents can view installation steps" ON installation_steps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fnos 
      WHERE fnos.id = installation_steps.fno_id 
      AND fnos.status = 'active'
      AND EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'agent'
      )
    )
  );

-- Step 5: Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('user_roles', 'fnos', 'installation_steps')
ORDER BY tablename, policyname;

-- Step 6: Test the policies
-- You should now be able to sign up users and they should be able to create roles