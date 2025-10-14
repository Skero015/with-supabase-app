#!/usr/bin/env tsx
/**
 * RLS Policy Setup Script
 * Applies Row Level Security policies to Supabase database
 *
 * Usage: npm run setup-rls
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  console.error('   This is required to apply RLS policies')
  console.error('   Please add it to your .env.local file')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function setupRLS() {
  console.log('🔐 Setting up Row Level Security policies...\n')

  try {
    // First, disable RLS temporarily to clean up
    console.log('🧹 Cleaning up existing policies...')
    
    const cleanupPolicies = [
      'DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;',
      'DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;',
      'DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;',
      'DROP POLICY IF EXISTS "Managers can CRUD their own FNOs" ON fnos;',
      'DROP POLICY IF EXISTS "Agents can select all active FNOs" ON fnos;',
      'DROP POLICY IF EXISTS "Managers can select all FNOs" ON fnos;',
      'DROP POLICY IF EXISTS "Managers can CRUD steps for their FNOs" ON installation_steps;',
      'DROP POLICY IF EXISTS "Agents can select steps for active FNOs" ON installation_steps;'
    ]

    for (const policy of cleanupPolicies) {
      const result = await executeSQL(policy)
      if (!result.success && !result.error?.includes('does not exist')) {
        console.log(`  ⚠️  Warning cleaning policy: ${result.error}`)
      }
    }

    console.log('  ✅ Cleanup completed\n')

    // Apply new policies
    const policies = [
      // Enable RLS
      'ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE fnos ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE installation_steps ENABLE ROW LEVEL SECURITY;',
      
      // User Roles Policies
      `CREATE POLICY "Users can read their own role" ON user_roles
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);`,
        
      `CREATE POLICY "Users can insert their own role" ON user_roles
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);`,
        
      `CREATE POLICY "Users can update their own role" ON user_roles
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);`,
      
      // FNOs Policies
      `CREATE POLICY "Managers can CRUD their own FNOs" ON fnos
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
        );`,
        
      `CREATE POLICY "Agents can select all active FNOs" ON fnos
        FOR SELECT TO authenticated
        USING (
          status = 'active' AND
          EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'agent'
          )
        );`,
        
      `CREATE POLICY "Managers can select all FNOs" ON fnos
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'manager'
          )
        );`,
      
      // Installation Steps Policies
      `CREATE POLICY "Managers can CRUD steps for their FNOs" ON installation_steps
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
        );`,
        
      `CREATE POLICY "Agents can select steps for active FNOs" ON installation_steps
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
        );`
    ]

    let successCount = 0
    let errorCount = 0

    for (const policy of policies) {
      const result = await executeSQL(policy)
      
      if (result.success) {
        console.log('  ✅ Policy applied successfully')
        successCount++
      } else {
        if (result.error?.includes('already exists') ||
            result.error?.includes('duplicate key')) {
          console.log('  ⚠️  Policy already exists, continuing...')
          successCount++
        } else {
          console.error(`  ❌ Error executing policy: ${result.error}`)
          errorCount++
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully applied: ${successCount} policies`)
    console.log(`   ❌ Errors: ${errorCount} policies`)
    
    if (errorCount === 0) {
      console.log('\n🎉 RLS setup completed successfully!')
      console.log('✅ All security policies are now active')
      console.log('✅ Users can now sign up and access role-based features')
    } else {
      console.log('\n⚠️  RLS setup completed with some errors')
      console.log('💡 Check the errors above and fix them manually if needed')
    }
    
  } catch (error) {
    console.error('❌ Failed to setup RLS policies:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting RLS setup process...\n')
  
  try {
    // Test connection first
    const { error } = await supabase.from('user_roles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Cannot connect to database:', error.message)
      console.log('\n💡 Make sure your database is set up and environment variables are correct')
      process.exit(1)
    }

    console.log('✅ Database connection successful\n')
    
    await setupRLS()
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { setupRLS }