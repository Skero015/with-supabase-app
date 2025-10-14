/**
 * Unit Tests for Installation Steps Management Utilities
 * Tests all installation step functions with mocked Supabase client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { InstallationStepRow, InstallationStepInsert, InstallationStepUpdate, DatabaseResponse, InstallationStepFilters } from '@/lib/database/types'

// Mock data
const mockInstallationStep: InstallationStepRow = {
  id: 'step-123',
  fno_id: 'fno-123',
  step_number: 1,
  title: 'Pre-check',
  description: 'Verify customer details on portal',
  created_at: '2024-01-01T00:00:00Z'
}

const mockInstallationSteps: InstallationStepRow[] = [
  mockInstallationStep,
  {
    id: 'step-456',
    fno_id: 'fno-123',
    step_number: 2,
    title: 'Equipment Check',
    description: 'Confirm ONT compatibility',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'step-789',
    fno_id: 'fno-456',
    step_number: 1,
    title: 'Site Survey',
    description: 'Complete pre-installation checklist',
    created_at: '2024-01-02T00:00:00Z'
  }
]

const mockStepWithFno = {
  ...mockInstallationStep,
  fno: {
    name: 'Vumatel',
    status: 'active'
  }
}

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

describe('Installation Steps Management Utilities', () => {
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

  describe('validateInstallationStepData', () => {
    let validateInstallationStepData: (data: Partial<InstallationStepInsert>) => { isValid: boolean; errors: string[] }

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      validateInstallationStepData = stepModule.validateInstallationStepData
    })

    it('should validate correct data', () => {
      const validData = {
        fno_id: 'fno-123',
        step_number: 1,
        title: 'Test Step',
        description: 'Test description'
      }

      const result = validateInstallationStepData(validData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch missing fno_id', () => {
      const invalidData = {
        step_number: 1,
        title: 'Test Step',
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('FNO ID is required')
    })

    it('should catch missing step_number', () => {
      const invalidData = {
        fno_id: 'fno-123',
        title: 'Test Step',
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step number is required')
    })

    it('should catch invalid step_number', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 0,
        title: 'Test Step',
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step number must be a positive integer')
    })

    it('should catch missing title', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 1,
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step title is required')
    })

    it('should catch empty title', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 1,
        title: '',
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step title is required')
    })

    it('should catch missing description', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 1,
        title: 'Test Step'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step description is required')
    })

    it('should catch long title', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 1,
        title: 'A'.repeat(300),
        description: 'Test description'
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step title must be less than 255 characters')
    })

    it('should catch long description', () => {
      const invalidData = {
        fno_id: 'fno-123',
        step_number: 1,
        title: 'Test Step',
        description: 'A'.repeat(2100)
      }

      const result = validateInstallationStepData(invalidData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Step description must be less than 2000 characters')
    })
  })

  describe('getInstallationStepById', () => {
    let getInstallationStepById: (id: string) => Promise<DatabaseResponse<InstallationStepRow>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      getInstallationStepById = stepModule.getInstallationStepById
    })

    it('should successfully get installation step by ID', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: mockInstallationStep,
        error: null
      })

      const result = await getInstallationStepById('step-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(mockInstallationStep)
      expect(result.error).toBeNull()
    })

    it('should validate step ID', async () => {
      const result = await getInstallationStepById('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Installation step ID is required')
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error', code: 'DB_ERROR' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getInstallationStepById('step-123')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('getInstallationSteps', () => {
    let getInstallationSteps: (fnoId: string, filters?: InstallationStepFilters) => Promise<DatabaseResponse<InstallationStepRow[]>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      getInstallationSteps = stepModule.getInstallationSteps
    })

    it('should successfully get installation steps for FNO', async () => {
      const fnoSteps = mockInstallationSteps.filter(s => s.fno_id === 'fno-123')
      mockExecuteQuery.mockResolvedValue({
        data: fnoSteps,
        error: null
      })

      const result = await getInstallationSteps('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(fnoSteps)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await getInstallationSteps('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })

    it('should get steps with filters', async () => {
      const filteredSteps = [mockInstallationStep]
      mockExecuteQuery.mockResolvedValue({
        data: filteredSteps,
        error: null
      })

      const result = await getInstallationSteps('fno-123', { step_number: 1 })

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(filteredSteps)
      expect(result.error).toBeNull()
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getInstallationSteps('fno-123')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('getInstallationStepsWithFno', () => {
    let getInstallationStepsWithFno: (fnoId: string) => Promise<DatabaseResponse<(InstallationStepRow & { fno: { name: string; status: string } })[]>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      getInstallationStepsWithFno = stepModule.getInstallationStepsWithFno
    })

    it('should successfully get steps with FNO info', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: [mockStepWithFno],
        error: null
      })

      const result = await getInstallationStepsWithFno('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual([mockStepWithFno])
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await getInstallationStepsWithFno('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })
  })

  describe('createInstallationStep', () => {
    let createInstallationStep: (step: InstallationStepInsert) => Promise<DatabaseResponse<InstallationStepRow>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      createInstallationStep = stepModule.createInstallationStep
    })

    const newStep: InstallationStepInsert = {
      fno_id: 'fno-123',
      step_number: 3,
      title: 'New Step',
      description: 'New step description'
    }

    it('should successfully create installation step', async () => {
      const createdStep = { 
        ...newStep, 
        id: 'step-new',
        created_at: '2024-01-03T00:00:00Z'
      }
      
      // Mock the duplicate check to return no existing step
      mockExecuteQuery
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // No duplicate
        .mockResolvedValueOnce({ data: createdStep, error: null }) // Create success

      const result = await createInstallationStep(newStep)

      expect(mockExecuteQuery).toHaveBeenCalledTimes(2)
      expect(result.data).toEqual(createdStep)
      expect(result.error).toBeNull()
    })

    it('should validate step data', async () => {
      const invalidStep = { fno_id: '', step_number: 1 } as InstallationStepInsert

      const result = await createInstallationStep(invalidStep)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Validation failed')
    })

    it('should prevent duplicate step numbers', async () => {
      // Mock existing step found
      mockExecuteQuery.mockResolvedValue({
        data: { id: 'existing-step' },
        error: null
      })

      const result = await createInstallationStep(newStep)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Step number 3 already exists')
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await createInstallationStep(newStep)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('updateInstallationStep', () => {
    let updateInstallationStep: (id: string, updates: InstallationStepUpdate) => Promise<DatabaseResponse<InstallationStepRow>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      updateInstallationStep = stepModule.updateInstallationStep
    })

    it('should successfully update installation step', async () => {
      const updates: InstallationStepUpdate = { title: 'Updated Step' }
      const updatedStep = { ...mockInstallationStep, ...updates }
      
      mockExecuteQuery.mockResolvedValue({
        data: updatedStep,
        error: null
      })

      const result = await updateInstallationStep('step-123', updates)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(updatedStep)
      expect(result.error).toBeNull()
    })

    it('should validate step ID', async () => {
      const result = await updateInstallationStep('', { title: 'Test' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Installation step ID is required')
    })

    it('should validate empty title', async () => {
      const result = await updateInstallationStep('step-123', { title: '' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Step title cannot be empty')
    })

    it('should validate empty description', async () => {
      const result = await updateInstallationStep('step-123', { description: '' })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Step description cannot be empty')
    })

    it('should validate step number conflicts', async () => {
      // Mock getting current step
      mockExecuteQuery
        .mockResolvedValueOnce({ data: mockInstallationStep, error: null }) // Current step
        .mockResolvedValueOnce({ data: { id: 'other-step' }, error: null }) // Conflicting step

      const result = await updateInstallationStep('step-123', { step_number: 2 })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Step number 2 already exists')
    })
  })

  describe('deleteInstallationStep', () => {
    let deleteInstallationStep: (id: string) => Promise<DatabaseResponse<boolean>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      deleteInstallationStep = stepModule.deleteInstallationStep
    })

    it('should successfully delete installation step', async () => {
      mockExecuteQuery.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await deleteInstallationStep('step-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should validate step ID', async () => {
      const result = await deleteInstallationStep('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Installation step ID is required')
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Delete failed' }
      mockExecuteQuery.mockResolvedValue({
        data: false,
        error: mockError
      })

      const result = await deleteInstallationStep('step-123')

      expect(result.data).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('createInstallationSteps', () => {
    let createInstallationSteps: (steps: InstallationStepInsert[]) => Promise<DatabaseResponse<InstallationStepRow[]>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      createInstallationSteps = stepModule.createInstallationSteps
    })

    const bulkSteps: InstallationStepInsert[] = [
      {
        fno_id: 'fno-123',
        step_number: 1,
        title: 'Step 1',
        description: 'First step'
      },
      {
        fno_id: 'fno-123',
        step_number: 2,
        title: 'Step 2',
        description: 'Second step'
      }
    ]

    it('should successfully create multiple steps', async () => {
      const createdSteps = bulkSteps.map((s, i) => ({ 
        ...s, 
        id: `step-${i + 1}`,
        created_at: '2024-01-01T00:00:00Z'
      }))
      
      mockExecuteQuery.mockResolvedValue({
        data: createdSteps,
        error: null
      })

      const result = await createInstallationSteps(bulkSteps)

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(createdSteps)
      expect(result.error).toBeNull()
    })

    it('should validate array input', async () => {
      const result = await createInstallationSteps([])

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Installation steps array is required')
    })

    it('should validate each step in array', async () => {
      const invalidSteps = [
        { fno_id: '', step_number: 1, title: 'Test', description: 'Test' }
      ]

      const result = await createInstallationSteps(invalidSteps)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Validation failed')
    })

    it('should detect duplicate step numbers', async () => {
      const duplicateSteps = [
        { fno_id: 'fno-123', step_number: 1, title: 'Step 1', description: 'First' },
        { fno_id: 'fno-123', step_number: 1, title: 'Step 1 Dup', description: 'Duplicate' }
      ]

      const result = await createInstallationSteps(duplicateSteps)

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('Duplicate step numbers found')
    })
  })

  describe('getInstallationStepStats', () => {
    let getInstallationStepStats: (fnoId: string) => Promise<DatabaseResponse<{ totalSteps: number; averageDescriptionLength: number; stepNumbers: number[] }>>

    beforeEach(async () => {
      const stepModule = await import('@/lib/database/installation-steps')
      getInstallationStepStats = stepModule.getInstallationStepStats
    })

    it('should return correct statistics', async () => {
      const expectedStats = {
        totalSteps: 2,
        averageDescriptionLength: 25,
        stepNumbers: [1, 2]
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: expectedStats,
        error: null
      })

      const result = await getInstallationStepStats('fno-123')

      expect(mockExecuteQuery).toHaveBeenCalled()
      expect(result.data).toEqual(expectedStats)
      expect(result.error).toBeNull()
    })

    it('should validate FNO ID', async () => {
      const result = await getInstallationStepStats('')

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('FNO ID is required')
    })

    it('should handle empty results', async () => {
      const emptyStats = {
        totalSteps: 0,
        averageDescriptionLength: 0,
        stepNumbers: []
      }
      
      mockExecuteQuery.mockResolvedValue({
        data: emptyStats,
        error: null
      })

      const result = await getInstallationStepStats('fno-123')

      expect(result.data).toEqual(emptyStats)
      expect(result.error).toBeNull()
    })

    it('should handle database error', async () => {
      const mockError = { message: 'Database error' }
      mockExecuteQuery.mockResolvedValue({
        data: null,
        error: mockError
      })

      const result = await getInstallationStepStats('fno-123')

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })
})