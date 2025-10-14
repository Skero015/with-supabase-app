/**
 * Unit Tests for FNO Management Utilities
 * Tests all FNO functions with mocked Supabase client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FnoRow, FnoInsert, FnoUpdate } from '@/lib/database/types'

// Mock data
const mockFno: FnoRow = {
  id: 'fno-123',
  name: 'Vumatel',
  contact_person: 'John Smith',
  support_number: '087 XXX XXXX',
  coverage_area: 'Johannesburg, Pretoria',
  sla_hours: 48,
  status: 'active',
  created_by: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockFnos: FnoRow[] = [
  mockFno,
  {
    id: 'fno-456',
    name: 'Frogfoot',
    contact_person: 'Jane Doe',
    support_number: '011 XXX XXXX',
    coverage_area: 'Cape Town',
    sla_hours: 24,
    status: 'active',
    created_by: 'user-456',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockFnoWithSteps = {
  ...mockFno,
  installation_steps: [
    {
      id: 'step-1',
      step_number: 1,
      title: 'Pre-check',
      description: 'Verify customer details',
      created_at: '2024-01-01T00:00:00Z'
    }
  ]
}

// Mock the database client and utilities
const mockExecuteQuery = vi.fn()
const mockCreateBrowserClient = vi.fn()
const mockGetCurrentUser = vi.fn()
const mockDatabaseErrorHandler = {
  createResponse: vi.fn()
}

vi.mock('@/lib/database/client', () => ({
  createBrowserClient: mockCreateBrowserClient,
  executeQuery: mockExecuteQuery,
  getCurrentUser: mockGetCurrentUser,
  DatabaseErrorHandler: mockDatabaseErrorHandler
}))

describe('FNO Management Utilities', () => {
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

    mockGetCurrentUser.mockResolvedValue({
      data: { id: 'user-123' },
      error: null
    })
  })

  describe('validateFnoData', () => {
    let validateFnoData: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      validateFnoData = fnoModule.validateFnoData
    })

    it('should validate correct data', () => {
      const validData = {
        name: 'Test FNO',
        status: 'active' as const,
        sla_hours: 24
      }

      const result = validateFnoData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch missing name', () => {
      const invalidData = {
        status: 'active' as const
      }

      const result = validateFnoData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('FNO name is required')
    })

    it('should catch empty name', () => {
      const invalidData = {
        name: '',
        status: 'active' as const
      }

      const result = validateFnoData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('FNO name is required')
    })

    it('should catch invalid status', () => {
      const invalidData = {
        name: 'Test FNO',
        status: 'invalid' as unknown as 'active' | 'inactive'
      }

      const result = validateFnoData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Status must be either "active" or "inactive"')
    })

    it('should catch negative SLA hours', () => {
      const invalidData = {
        name: 'Test FNO',
        sla_hours: -5
      }

      const result = validateFnoData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('SLA hours must be a non-negative number')
    })

    it('should catch long name', () => {
      const invalidData = {
        name: 'A'.repeat(300)
      }

      const result = validateFnoData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('FNO name must be less than 255 characters')
    })
  })

  describe('getFnoById', () => {
    let getFnoById: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      getFnoById = fnoModule.getFnoById
    })

    it('should successfully get FNO by ID', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: mockFno,
        error: null
      })

      const result = await getFnoById('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(mockFno)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await getFnoById('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getFnoById('fno-123')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('getFnoWithSteps', () => {
    let getFnoWithSteps: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      getFnoWithSteps = fnoModule.getFnoWithSteps
    })

    it('should successfully get FNO with steps', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: mockFnoWithSteps,
        error: null
      })

      const result = await getFnoWithSteps('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(mockFnoWithSteps)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await getFnoWithSteps('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })
  })

  describe('getFnos', () => {
    let getFnos: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      getFnos = fnoModule.getFnos
    })

    it('should successfully get all FNOs', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: mockFnos,
        error: null
      })

      const result = await getFnos()

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(mockFnos)
      expect(result.error).toBeNull()
    })

    it('should get FNOs with filters', async () => {
      const activeFnos = mockFnos.filter(f => f.status === 'active')
      mockExecuteQuery.mockResolvedValue({
        data: activeFnos,
        error: null
      })

      const result = await getFnos({ status: 'active' })

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(activeFnos)
      expect(result.error).toBeNull()
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getFnos()

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('createFno', () => {
    let createFno: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      createFno = fnoModule.createFno
    })

    const newFno: FnoInsert = {
      name: 'New FNO',
      contact_person: 'Test Person',
      support_number: '123-456-7890',
      coverage_area: 'Test Area',
      sla_hours: 24,
      status: 'active'
    }

    it('should successfully create FNO', async () => {
      const createdFno = { 
        ...newFno, 
        id: 'fno-789',
        created_by: 'user-123',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: createdFno,
        error: null
      })

      const result = await createFno(newFno)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(createdFno)
      expect(result.error).toBeNull()
    })

    it('should validate FNO data', async () => {
      const invalidFno = { name: '' } as FnoInsert

      const result = await createFno(invalidFno)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Validation failed')
    })

    // Note: Authentication error handling is tested in integration tests
    // as it requires more complex mocking of the entire execution flow

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await createFno(newFno)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('updateFno', () => {
    let updateFno: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      updateFno = fnoModule.updateFno
    })

    it('should successfully update FNO', async () => {
      const updates: FnoUpdate = { name: 'Updated FNO' }
      const updatedFno = { ...mockFno, ...updates }
      
      mockExecuteQuery.mockResolvedValue({
        data: updatedFno,
        error: null
      })

      const result = await updateFno('fno-123', updates)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(updatedFno)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await updateFno('', { name: 'Test' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })

    it('should validate empty name', async () => {
      const result = await updateFno('fno-123', { name: '' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO name cannot be empty')
    })

    it('should validate invalid status', async () => {
      const result = await updateFno('fno-123', { 
        status: 'invalid' as unknown as 'active' | 'inactive' 
      })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Status must be active or inactive')
    })
  })

  describe('deleteFno', () => {
    let deleteFno: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      deleteFno = fnoModule.deleteFno
    })

    it('should successfully soft delete FNO', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await deleteFno('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should successfully hard delete FNO', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await deleteFno('fno-123', true)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await deleteFno('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Delete failed' }
      mockExecuteQuery.mockResolvedValue({
        data: false,
        error: mockError
      })

      const result = await deleteFno('fno-123')

      expect(result.data).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('searchFnos', () => {
    let searchFnos: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      searchFnos = fnoModule.searchFnos
    })

    it('should successfully search FNOs', async () => {
      const searchResults = [mockFno]
      mockExecuteQuery.mockResolvedValue({
        data: searchResults,
        error: null
      })

      const result = await searchFnos('Vumatel')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(searchResults)
      expect(result.error).toBeNull()
    })

    it('should validate search term', async () => {
      const result = await searchFnos('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Search term is required')
    })

    it('should validate whitespace-only search term', async () => {
      const result = await searchFnos('   ')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Search term is required')
    })
  })

  describe('getFnosByCreator', () => {
    let getFnosByCreator: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      getFnosByCreator = fnoModule.getFnosByCreator
    })

    it('should successfully get FNOs by creator', async () => {
      const creatorFnos = [mockFno]
      mockExecuteQuery.mockResolvedValue({
        data: creatorFnos,
        error: null
      })

      const result = await getFnosByCreator('user-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(creatorFnos)
      expect(result.error).toBeNull()
    })

    it('should validate creator ID', async () => {
      const result = await getFnosByCreator('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Creator ID is required')
    })
  })

  describe('getFnoStats', () => {
    let getFnoStats: any

    beforeEach(async () => {
      const fnoModule = await import('@/lib/database/fnos')
      getFnoStats = fnoModule.getFnoStats
    })

    it('should return correct statistics', async () => {
      const expectedStats = {
        total: 2,
        active: 2,
        inactive: 0,
        byCreator: {
          'user-123': 1,
          'user-456': 1
        }
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: expectedStats,
        error: null
      })

      const result = await getFnoStats()

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(expectedStats)
      expect(result.error).toBeNull()
    })

    it('should handle empty results', async () => {
      const emptyStats = {
        total: 0,
        active: 0,
        inactive: 0,
        byCreator: {}
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: emptyStats,
        error: null
      })

      const result = await getFnoStats()

      expect(result.data).toEqual(emptyStats)
      expect(result.error).toBeNull()
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getFnoStats()

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })
})