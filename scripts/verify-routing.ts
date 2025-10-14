#!/usr/bin/env tsx
/**
 * Routing Verification Script
 * Verifies that all routing is correctly set up for the Service Delivery Platform
 * 
 * Usage: npm run verify-routing
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface RouteCheck {
  path: string
  filePath: string
  description: string
  required: boolean
}

const routes: RouteCheck[] = [
  // Root route
  {
    path: '/',
    filePath: 'app/page.tsx',
    description: 'Home page with role-based redirection',
    required: true
  },

  // Auth routes
  {
    path: '/auth/login',
    filePath: 'app/auth/login/page.tsx',
    description: 'Login page',
    required: true
  },
  {
    path: '/auth/sign-up',
    filePath: 'app/auth/sign-up/page.tsx',
    description: 'Sign up page',
    required: true
  },
  {
    path: '/auth/forgot-password',
    filePath: 'app/auth/forgot-password/page.tsx',
    description: 'Forgot password page',
    required: true
  },
  {
    path: '/auth/update-password',
    filePath: 'app/auth/update-password/page.tsx',
    description: 'Update password page',
    required: true
  },
  {
    path: '/auth/sign-up-success',
    filePath: 'app/auth/sign-up-success/page.tsx',
    description: 'Sign up success page',
    required: true
  },
  {
    path: '/auth/error',
    filePath: 'app/auth/error/page.tsx',
    description: 'Auth error page',
    required: true
  },
  {
    path: '/auth/confirm',
    filePath: 'app/auth/confirm/route.ts',
    description: 'Email confirmation route',
    required: true
  },

  // Dashboard routes
  {
    path: '/dashboard',
    filePath: 'app/dashboard/page.tsx',
    description: 'Dashboard redirect page (redirects based on role)',
    required: true
  },

  // Manager routes
  {
    path: '/dashboard/manager',
    filePath: 'app/dashboard/manager/page.tsx',
    description: 'Manager dashboard',
    required: true
  },
  {
    path: '/dashboard/manager/create',
    filePath: 'app/dashboard/manager/create/page.tsx',
    description: 'Create FNO page',
    required: true
  },
  {
    path: '/dashboard/manager/fno/[id]',
    filePath: 'app/dashboard/manager/fno/[id]/page.tsx',
    description: 'Manager FNO details page',
    required: true
  },
  {
    path: '/dashboard/manager/fno/[id]/edit',
    filePath: 'app/dashboard/manager/fno/[id]/edit/page.tsx',
    description: 'Manager FNO edit page',
    required: true
  },

  // Agent routes
  {
    path: '/dashboard/agent',
    filePath: 'app/dashboard/agent/page.tsx',
    description: 'Agent dashboard',
    required: true
  },
  {
    path: '/dashboard/agent/fno/[id]',
    filePath: 'app/dashboard/agent/fno/[id]/page.tsx',
    description: 'Agent FNO view page',
    required: true
  },

  // Protected route (example)
  {
    path: '/protected',
    filePath: 'app/protected/protected_page.tsx',
    description: 'Protected page example',
    required: false
  }
]

interface LayoutCheck {
  path: string
  filePath: string
  description: string
}

const layouts: LayoutCheck[] = [
  {
    path: '/',
    filePath: 'app/layout.tsx',
    description: 'Root layout',
  },
  {
    path: '/dashboard',
    filePath: 'app/dashboard/layout.tsx',
    description: 'Dashboard layout with role-based navigation',
  },
  {
    path: '/protected',
    filePath: 'app/protected/layout.tsx',
    description: 'Protected layout',
  }
]

interface MiddlewareCheck {
  feature: string
  description: string
  checkFunction: () => boolean
}

function checkFileExists(filePath: string): boolean {
  return existsSync(join(process.cwd(), filePath))
}

function checkFileContains(filePath: string, searchText: string): boolean {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8')
    return content.includes(searchText)
  } catch {
    return false
  }
}

function verifyRoutes(): { passed: number; failed: number; warnings: number } {
  console.log('🛣️  Verifying Route Structure...\n')

  let passed = 0
  let failed = 0
  let warnings = 0

  routes.forEach(route => {
    const exists = checkFileExists(route.filePath)
    
    if (exists) {
      console.log(`✅ ${route.path} → ${route.filePath}`)
      console.log(`   ${route.description}`)
      passed++
    } else if (route.required) {
      console.log(`❌ ${route.path} → ${route.filePath} (MISSING)`)
      console.log(`   ${route.description}`)
      failed++
    } else {
      console.log(`⚠️  ${route.path} → ${route.filePath} (OPTIONAL - MISSING)`)
      console.log(`   ${route.description}`)
      warnings++
    }
    console.log('')
  })

  return { passed, failed, warnings }
}

function verifyLayouts(): { passed: number; failed: number } {
  console.log('📐 Verifying Layout Structure...\n')

  let passed = 0
  let failed = 0

  layouts.forEach(layout => {
    const exists = checkFileExists(layout.filePath)
    
    if (exists) {
      console.log(`✅ ${layout.path} → ${layout.filePath}`)
      console.log(`   ${layout.description}`)
      passed++
    } else {
      console.log(`❌ ${layout.path} → ${layout.filePath} (MISSING)`)
      console.log(`   ${layout.description}`)
      failed++
    }
    console.log('')
  })

  return { passed, failed }
}

function verifyMiddleware(): { passed: number; failed: number } {
  console.log('🛡️  Verifying Middleware Configuration...\n')

  const middlewareChecks: MiddlewareCheck[] = [
    {
      feature: 'Middleware File',
      description: 'Main middleware.ts exists',
      checkFunction: () => checkFileExists('middleware.ts')
    },
    {
      feature: 'Supabase Middleware',
      description: 'Supabase middleware helper exists',
      checkFunction: () => checkFileExists('lib/supabase/middleware.ts')
    },
    {
      feature: 'Role-based Routing',
      description: 'Middleware checks user roles',
      checkFunction: () => checkFileContains('lib/supabase/middleware.ts', 'user_roles')
    },
    {
      feature: 'Manager Route Protection',
      description: 'Middleware protects manager routes',
      checkFunction: () => checkFileContains('lib/supabase/middleware.ts', '/dashboard/manager')
    },
    {
      feature: 'Agent Route Protection',
      description: 'Middleware protects agent routes',
      checkFunction: () => checkFileContains('lib/supabase/middleware.ts', '/dashboard/agent')
    },
    {
      feature: 'Auth Redirection',
      description: 'Middleware redirects unauthenticated users',
      checkFunction: () => checkFileContains('lib/supabase/middleware.ts', '/auth/login')
    }
  ]

  let passed = 0
  let failed = 0

  middlewareChecks.forEach(check => {
    if (check.checkFunction()) {
      console.log(`✅ ${check.feature}`)
      console.log(`   ${check.description}`)
      passed++
    } else {
      console.log(`❌ ${check.feature}`)
      console.log(`   ${check.description}`)
      failed++
    }
    console.log('')
  })

  return { passed, failed }
}

function verifyRoleBasedPages(): { passed: number; failed: number } {
  console.log('👥 Verifying Role-based Page Logic...\n')

  const roleChecks = [
    {
      name: 'Manager Dashboard Role Check',
      file: 'app/dashboard/manager/page.tsx',
      check: () => checkFileContains('app/dashboard/manager/page.tsx', 'role !== "manager"')
    },
    {
      name: 'Agent Dashboard Role Check',
      file: 'app/dashboard/agent/page.tsx',
      check: () => checkFileContains('app/dashboard/agent/page.tsx', 'role !== "agent"')
    },
    {
      name: 'Manager FNO Access Check',
      file: 'app/dashboard/manager/fno/[id]/page.tsx',
      check: () => checkFileContains('app/dashboard/manager/fno/[id]/page.tsx', 'created_by !== data.claims.sub')
    },
    {
      name: 'Agent FNO Status Check',
      file: 'app/dashboard/agent/fno/[id]/page.tsx',
      check: () => checkFileContains('app/dashboard/agent/fno/[id]/page.tsx', 'status !== "active"')
    },
    {
      name: 'Dashboard Role Redirection',
      file: 'app/dashboard/page.tsx',
      check: () => checkFileContains('app/dashboard/page.tsx', 'userRole === "manager"')
    }
  ]

  let passed = 0
  let failed = 0

  roleChecks.forEach(check => {
    if (checkFileExists(check.file) && check.check()) {
      console.log(`✅ ${check.name}`)
      passed++
    } else {
      console.log(`❌ ${check.name}`)
      failed++
    }
  })

  console.log('')
  return { passed, failed }
}

function printSummary(results: { [key: string]: { passed: number; failed: number; warnings?: number } }) {
  console.log('📊 Routing Verification Summary')
  console.log('─'.repeat(50))

  let totalPassed = 0
  let totalFailed = 0
  let totalWarnings = 0

  Object.entries(results).forEach(([category, result]) => {
    console.log(`${category}:`)
    console.log(`  ✅ Passed: ${result.passed}`)
    console.log(`  ❌ Failed: ${result.failed}`)
    if (result.warnings !== undefined) {
      console.log(`  ⚠️  Warnings: ${result.warnings}`)
      totalWarnings += result.warnings
    }
    
    totalPassed += result.passed
    totalFailed += result.failed
  })

  console.log('\nOverall:')
  console.log(`  ✅ Total Passed: ${totalPassed}`)
  console.log(`  ❌ Total Failed: ${totalFailed}`)
  console.log(`  ⚠️  Total Warnings: ${totalWarnings}`)

  const successRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
  console.log(`  📈 Success Rate: ${successRate}%`)

  console.log('\n🎯 Routing Status')
  console.log('─'.repeat(50))

  if (totalFailed === 0) {
    console.log('🎉 All routing is correctly configured!')
    console.log('✅ Authentication flow is properly set up')
    console.log('✅ Role-based routing is implemented')
    console.log('✅ Manager and Agent dashboards are accessible')
    console.log('✅ Middleware enforces proper access control')
  } else if (totalFailed <= 2) {
    console.log('⚠️  Routing is mostly correct with minor issues')
    console.log('💡 Review failed checks and fix them')
  } else {
    console.log('❌ Routing needs significant fixes')
    console.log('🔧 Address failed checks before testing')
  }

  console.log('\n🚀 Next Steps')
  console.log('─'.repeat(50))
  console.log('1. Fix any failed route checks')
  console.log('2. Test authentication flow: / → /auth/login → /dashboard → role-specific dashboard')
  console.log('3. Test role-based access: manager cannot access agent routes and vice versa')
  console.log('4. Test middleware redirections work correctly')
  console.log('5. Verify FNO access controls work as expected')
}

async function main() {
  console.log('🔍 Starting Routing Verification...\n')

  const results = {
    'Routes': verifyRoutes(),
    'Layouts': verifyLayouts(),
    'Middleware': verifyMiddleware(),
    'Role-based Logic': verifyRoleBasedPages()
  }

  printSummary(results)
}

// Run the verification
if (require.main === module) {
  main()
}

export { verifyRoutes, verifyLayouts, verifyMiddleware, verifyRoleBasedPages }