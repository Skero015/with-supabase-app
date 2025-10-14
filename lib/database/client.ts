/**
 * Database Client and Connection Helpers
 * Provides typed Supabase client and error handling utilities
 */

import { createClient } from '@/lib/supabase/client'
import type { DatabaseError, DatabaseResponse } from './types'

// Browser client (for client-side operations)
export function createBrowserClient() {
  return createClient()
}

// Typed client for database operations
export type TypedSupabaseClient = ReturnType<typeof createBrowserClient>

/**
 * Error handling utilities
 */
export class DatabaseErrorHandler {
  static handleError(error: unknown): DatabaseError {
    if (!error) {
      return {
        message: 'Unknown database error occurred',
        code: 'UNKNOWN_ERROR'
      }
    }

    // Supabase error format
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const supabaseError = error as {
        message: string
        details?: string
        hint?: string
        code?: string
      }
      
      return {
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint,
        code: supabaseError.code
      }
    }

    // Generic error
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'GENERIC_ERROR'
      }
    }

    return {
      message: String(error),
      code: 'GENERIC_ERROR'
    }
  }

  static createResponse<T>(data: T | null, error: unknown = null): DatabaseResponse<T> {
    if (error) {
      return {
        data: null,
        error: this.handleError(error)
      }
    }

    return {
      data,
      error: null
    }
  }

  static isAuthError(error: DatabaseError): boolean {
    return error.code === 'PGRST301' || 
           error.code === 'PGRST302' || 
           error.message.toLowerCase().includes('auth')
  }

  static isPermissionError(error: DatabaseError): boolean {
    return error.code === 'PGRST301' || 
           error.message.toLowerCase().includes('permission') ||
           error.message.toLowerCase().includes('policy')
  }

  static isValidationError(error: DatabaseError): boolean {
    return error.code === '23505' || // unique violation
           error.code === '23503' || // foreign key violation
           error.code === '23514' || // check violation
           error.message.toLowerCase().includes('validation')
  }
}

/**
 * Database operation wrapper with error handling
 */
export async function executeQuery<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>
): Promise<DatabaseResponse<T>> {
  try {
    const { data, error } = await operation()
    return DatabaseErrorHandler.createResponse(data, error)
  } catch (error) {
    return DatabaseErrorHandler.createResponse<T>(null, error)
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(client: TypedSupabaseClient) {
  const { data: { user }, error } = await client.auth.getUser()
  
  if (error) {
    return DatabaseErrorHandler.createResponse(null, error)
  }

  return DatabaseErrorHandler.createResponse(user)
}

/**
 * Check if user has specific role
 */
export async function checkUserRole(
  client: TypedSupabaseClient, 
  userId: string, 
  requiredRole: 'manager' | 'agent'
): Promise<DatabaseResponse<boolean>> {
  const { data, error } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error) {
    return DatabaseErrorHandler.createResponse(false, error)
  }

  return DatabaseErrorHandler.createResponse(data?.role === requiredRole)
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize input for database operations
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}