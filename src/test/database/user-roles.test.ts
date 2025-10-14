/**
 * Unit Tests for User Role Management Utilities
 * Tests all user role functions with mocked Supabase client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserRoleRow, UserRoleInsert } from '@/lib/database/types'

// Mock data
const mockUserRole: UserRoleRow = {
  user_id: 'user-123',
  role: 'manager',
  created_at: '2024-01-01T00:00:00Z'
}

const mockUserRoles: UserRoleRow[] = [
  mockUserRole,
  {
    user_id: 'user-456',
    role: 'agent',
    created_at: '2024-01-02T00:00:00Z'
  }
]

// Mock the database client and utilities
const mockExecuteQuery = vi.fn()
const mockCreateBrowserClient = vi.fn()
const mockDatabaseErrorHandler = {
  createResponse: vi.fn()
}

vi.mock('@/lib/database/client', () => ({
  createBrowserClient: mockCreateBrowserClient,
  executeQuery: mockExecuteQuery,
  DatabaseErrorHandler: mockDatabaseErrorHandler
}))

describe('User Role Management Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockExecuteQuery.mockImplementation(async (operation) => {
      const result = await operation()
      return result
    })
    
    mockDatabaseErrorHandler.createResponse.mockImplementation((data, error) => ({
      data,
      error: error ? { message: error.message || String(error) } : null
    }))
  })

  describe('validateUserRoleData', () => {
    // Import the function dynamically to avoid hoisting issues
    let validateUserRoleData: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      validateUserRoleData = module.validateUserRoleData
    })

    it('should validate correct data', () => {
      const validData = {
        user_id: 'user-123',
        role: 'manager' as const
      }

      const result = validateUserRoleData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch missing user_id', () => {
      const invalidData = {
        role: 'manager' as const
      }

      const result = validateUserRoleData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID is required')
    })

    it('should catch invalid role', () => {
      const invalidData = {
        user_id: 'user-123',
        role: 'invalid' as unknown as 'manager' | 'agent'
      }

      const result = validateUserRoleData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Role must be either "manager" or "agent"')
    })

    it('should catch empty user_id', () => {
      const invalidData = {
        user_id: '',
        role: 'manager' as const
      }

      const result = validateUserRoleData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('User ID is required')
    })

    it('should catch multiple validation errors', () => {
      const invalidData = {}

      const result = validateUserRoleData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
      expect(result.errors).toContain('User ID is required')
      expect(result.errors).toContain('Role is required')
    })
  })

  describe('getUserRole', () => {
    let getUserRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      getUserRole = module.getUserRole
    })

    it('should successfully get user role', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: mockUserRole,
        error: null
      })

      const result = await getUserRole('user-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(mockUserRole)
      expect(result.error).toBeNull()
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getUserRole('user-123')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createUserRole', () => {
    let createUserRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      createUserRole = module.createUserRole
    })

    const newUserRole: UserRoleInsert = {
      user_id: 'user-789',
      role: 'agent'
    }

    it('should successfully create user role', async () => {
      const createdRole = { ...newUserRole, created_at: '2024-01-03T00:00:00Z' }
      mockExecuteQuery.mockResolvedValue({
        data: createdRole,
        error: null
      })

      const result = await createUserRole(newUserRole)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(createdRole)
      expect(result.error).toBeNull()
    })

    it('should validate required user_id', async () => {
      const invalidRole = { role: 'manager' } as UserRoleInsert

      const result = await createUserRole(invalidRole)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('User ID is required')
    })

    it('should validate role value', async () => {
      const invalidRole = {
        user_id: 'user-123',
        role: 'invalid-role' as unknown as 'manager' | 'agent'
      }

      const result = await createUserRole(invalidRole)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Valid role is required')
    })
  })

  describe('updateUserRole', () => {
    let updateUserRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      updateUserRole = module.updateUserRole
    })

    it('should successfully update user role', async () => {
      const updatedRole = { ...mockUserRole, role: 'agent' as const }
      mockExecuteQuery.mockResolvedValue({
        data: updatedRole,
        error: null
      })

      const result = await updateUserRole('user-123', { role: 'agent' })

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(updatedRole)
      expect(result.error).toBeNull()
    })

    it('should validate user ID', async () => {
      const result = await updateUserRole('', { role: 'agent' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('User ID is required')
    })

    it('should validate role value', async () => {
      const result = await updateUserRole('user-123', { 
        role: 'invalid' as unknown as 'manager' | 'agent' 
      })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Valid role is required')
    })
  })

  describe('deleteUserRole', () => {
    let deleteUserRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      deleteUserRole = module.deleteUserRole
    })

    it('should successfully delete user role', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await deleteUserRole('user-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should validate user ID', async () => {
      const result = await deleteUserRole('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('User ID is required')
    })
  })

  describe('hasUserRole', () => {
    let hasUserRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      hasUserRole = module.hasUserRole
    })

    it('should return true when user has role', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await hasUserRole('user-123', 'manager')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return false when user does not have role', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: false,
        error: null
      })

      const result = await hasUserRole('user-123', 'agent')

      expect(result.data).toBe(false)
      expect(result.error).toBeNull()
    })

    it('should validate required parameters', async () => {
      const result = await hasUserRole('', 'manager')

      expect(result.data).toBe(false)
      expect(result.error?.message).toContain('User ID and role are required')
    })
  })

  describe('getUsersByRole', () => {
    let getUsersByRole: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      getUsersByRole = module.getUsersByRole
    })

    it('should successfully get users by role', async () => {
      const managerRoles = mockUserRoles.filter(r => r.role === 'manager')
      mockExecuteQuery.mockResolvedValue({
        data: managerRoles,
        error: null
      })

      const result = await getUsersByRole('manager')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(managerRoles)
      expect(result.error).toBeNull()
    })

    it('should validate role parameter', async () => {
      const result = await getUsersByRole('invalid' as unknown as 'manager' | 'agent')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Valid role is required')
    })
  })

  describe('getUserRoleStats', () => {
    let getUserRoleStats: any

    beforeEach(async () => {
      const module = await import('@/lib/database/user-roles')
      getUserRoleStats = module.getUserRoleStats
    })

    it('should return correct statistics', async () => {
      const expectedStats = {
        totalUsers: 2,
        managers: 1,
        agents: 1
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: expectedStats,
        error: null
      })

      const result = await getUserRoleStats()

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(expectedStats)
      expect(result.error).toBeNull()
    })

    it('should handle empty results', async () => {
      const emptyStats = {
        totalUsers: 0,
        managers: 0,
        agents: 0
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: emptyStats,
        error: null
      })

      const result = await getUserRoleStats()

      expect(result.data).toEqual(emptyStats)
      expect(result.error).toBeNull()
    })
  })
})