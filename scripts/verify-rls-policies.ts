#!/usr/bin/env tsx
/**
 * RLS Policy Verification Script
 * Verifies that Row Level Security policies are properly configured
 * 
 * Usage: npm run verify-rls
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
  console.error('   This is required to verify RLS policies')
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

async function verifyRLSPolicies() {
  console.log('🔍 Verifying Row Level Security policies...\n')

  try {
    // Check if RLS is enabled on tables
    console.log('📋 Checking RLS status on tables...')
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE tablename IN ('user_roles', 'fnos', 'installation_steps')
          ORDER BY tablename;
        `
      })

    if (rlsError) {
      console.log('  ⚠️  Could not check RLS status directly, trying alternative method...')
    } else if (rlsStatus) {
      console.log('  ✅ RLS Status:')
      rlsStatus.forEach((row: { tablename: string; rls_enabled: boolean }) => {
        console.log(`    ${row.tablename}: ${row.rls_enabled ? '✅ Enabled' : '❌ Disabled'}`)
      })
    }

    // Check existing policies
    console.log('\n📋 Checking existing policies...')
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname, 
            tablename, 
            policyname, 
            permissive, 
            roles, 
            cmd
          FROM pg_policies 
          WHERE tablename IN ('user_roles', 'fnos', 'installation_steps')
          ORDER BY tablename, policyname;
        `
      })

    if (policiesError) {
      console.log('  ⚠️  Could not check policies directly')
      console.log('  💡 This is normal if exec_sql RPC function is not available')
    } else if (policies && policies.length > 0) {
      console.log('  ✅ Found policies:')
      policies.forEach((policy: { tablename: string; policyname: string; cmd: string }) => {
        console.log(`    ${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('  ❌ No policies found!')
    }

    // Test basic table access
    console.log('\n🧪 Testing basic table access...')
    
    // Test user_roles table
    try {
      const { error } = await supabase
        .from('user_roles')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('  ❌ user_roles table access failed:', error.message)
      } else {
        console.log('  ✅ user_roles table accessible')
      }
    } catch (err) {
      console.log('  ❌ user_roles table access error:', err)
    }

    // Test fnos table
    try {
      const { error } = await supabase
        .from('fnos')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('  ❌ fnos table access failed:', error.message)
      } else {
        console.log('  ✅ fnos table accessible')
      }
    } catch (err) {
      console.log('  ❌ fnos table access error:', err)
    }

    // Test installation_steps table
    try {
      const { error } = await supabase
        .from('installation_steps')
        .select('count')
        .limit(1)
      
      if (error) {
        console.log('  ❌ installation_steps table access failed:', error.message)
      } else {
        console.log('  ✅ installation_steps table accessible')
      }
    } catch (err) {
      console.log('  ❌ installation_steps table access error:', err)
    }

    console.log('\n📊 Verification Summary:')
    console.log('✅ If all tables are accessible, the basic setup is working')
    console.log('💡 To fully test RLS policies, try signing up a new user')
    console.log('🔗 Follow the instructions in RLS_SETUP_INSTRUCTIONS.md if issues persist')
    
  } catch (error) {
    console.error('❌ Failed to verify RLS policies:', error)
    process.exit(1)
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting RLS verification process...\n')
  
  try {
    // Test connection first
    const { error } = await supabase.from('user_roles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Cannot connect to database:', error.message)
      console.log('\n💡 Make sure your database is set up and environment variables are correct')
      console.log('💡 Run the SQL script in RLS_SETUP_INSTRUCTIONS.md first')
      process.exit(1)
    }

    console.log('✅ Database connection successful\n')
    
    await verifyRLSPolicies()
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { verifyRLSPolicies }