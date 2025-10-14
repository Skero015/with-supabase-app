/**
 * User Role Management Utilities
 * Functions for managing user roles in the database
 */

import type { 
  UserRoleRow, 
  UserRoleInsert, 
  UserRoleUpdate, 
  DatabaseResponse,
  UserRole 
} from './types'
import { createBrowserClient, executeQuery, DatabaseErrorHandler } from './client'

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<DatabaseResponse<UserRoleRow>> {
  const client = createBrowserClient()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return { data, error }
  })
}

/**
 * Create a new user role
 */
export async function createUserRole(
  userRole: UserRoleInsert
): Promise<DatabaseResponse<UserRoleRow>> {
  const client = createBrowserClient()
  
  // Validate input
  if (!userRole.user_id) {
    return DatabaseErrorHandler.createResponse<UserRoleRow>(null, new Error('User ID is required'))
  }
  
  if (!userRole.role || !['manager', 'agent'].includes(userRole.role)) {
    return DatabaseErrorHandler.createResponse<UserRoleRow>(null, new Error('Valid role is required (manager or agent)'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .insert(userRole)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  updates: UserRoleUpdate
): Promise<DatabaseResponse<UserRoleRow>> {
  const client = createBrowserClient()
  
  // Validate input
  if (!userId) {
    return DatabaseErrorHandler.createResponse<UserRoleRow>(null, new Error('User ID is required'))
  }
  
  if (updates.role && !['manager', 'agent'].includes(updates.role)) {
    return DatabaseErrorHandler.createResponse<UserRoleRow>(null, new Error('Valid role is required (manager or agent)'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Delete user role
 */
export async function deleteUserRole(userId: string): Promise<DatabaseResponse<boolean>> {
  const client = createBrowserClient()
  
  if (!userId) {
    return DatabaseErrorHandler.createResponse<boolean>(null, new Error('User ID is required'))
  }
  
  return executeQuery(async () => {
    const { error } = await client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    
    return { data: !error, error }
  })
}

/**
 * Check if user exists and has a specific role
 */
export async function hasUserRole(
  userId: string, 
  role: UserRole
): Promise<DatabaseResponse<boolean>> {
  const client = createBrowserClient()
  
  if (!userId || !role) {
    return DatabaseErrorHandler.createResponse(false, new Error('User ID and role are required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', role)
      .single()
    
    if (error) {
      // If no record found, user doesn't have this role
      if (error.code === 'PGRST116') {
        return { data: false, error: null }
      }
      return { data: false, error }
    }
    
    return { data: !!data, error: null }
  })
}

/**
 * Get all users with a specific role (admin function)
 */
export async function getUsersByRole(role: UserRole): Promise<DatabaseResponse<UserRoleRow[]>> {
  const client = createBrowserClient()
  
  if (!role || !['manager', 'agent'].includes(role)) {
    return DatabaseErrorHandler.createResponse<UserRoleRow[]>(null, new Error('Valid role is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false })
    
    return { data, error }
  })
}

/**
 * Bulk create user roles (for testing/seeding)
 */
export async function createUserRoles(
  userRoles: UserRoleInsert[]
): Promise<DatabaseResponse<UserRoleRow[]>> {
  const client = createBrowserClient()
  
  // Validate input
  if (!Array.isArray(userRoles) || userRoles.length === 0) {
    return DatabaseErrorHandler.createResponse<UserRoleRow[]>(null, new Error('User roles array is required'))
  }
  
  // Validate each role
  for (const userRole of userRoles) {
    if (!userRole.user_id) {
      return DatabaseErrorHandler.createResponse<UserRoleRow[]>(null, new Error('All user roles must have user_id'))
    }
    if (!userRole.role || !['manager', 'agent'].includes(userRole.role)) {
      return DatabaseErrorHandler.createResponse<UserRoleRow[]>(null, new Error('All user roles must have valid role'))
    }
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .insert(userRoles)
      .select()
    
    return { data, error }
  })
}

/**
 * Get user role statistics
 */
export async function getUserRoleStats(): Promise<DatabaseResponse<{
  totalUsers: number
  managers: number
  agents: number
}>> {
  const client = createBrowserClient()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
    
    if (error) {
      return { data: null, error }
    }
    
    const stats = {
      totalUsers: data.length,
      managers: data.filter(r => r.role === 'manager').length,
      agents: data.filter(r => r.role === 'agent').length
    }
    
    return { data: stats, error: null }
  })
}

/**
 * Validate user role data
 */
export function validateUserRoleData(data: Partial<UserRoleInsert>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.user_id) {
    errors.push('User ID is required')
  } else if (typeof data.user_id !== 'string' || data.user_id.trim().length === 0) {
    errors.push('User ID must be a non-empty string')
  }
  
  if (!data.role) {
    errors.push('Role is required')
  } else if (!['manager', 'agent'].includes(data.role)) {
    errors.push('Role must be either "manager" or "agent"')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}