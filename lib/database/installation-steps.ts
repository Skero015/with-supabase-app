/**
 * Installation Steps Management Utilities
 * Functions for managing installation steps in the database
 */

import type { 
  InstallationStepRow, 
  InstallationStepInsert, 
  InstallationStepUpdate, 
  DatabaseResponse,
  InstallationStepFilters
} from './types'
import { createBrowserClient, executeQuery, DatabaseErrorHandler } from './client'

/**
 * Get installation step by ID
 */
export async function getInstallationStepById(id: string): Promise<DatabaseResponse<InstallationStepRow>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Installation step ID is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  })
}

/**
 * Get all installation steps for a specific FNO
 */
export async function getInstallationSteps(
  fnoId: string,
  filters?: InstallationStepFilters
): Promise<DatabaseResponse<InstallationStepRow[]>> {
  const client = createBrowserClient()
  
  if (!fnoId) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(null, new Error('FNO ID is required'))
  }
  
  return executeQuery(async () => {
    let query = client
      .from('installation_steps')
      .select('*')
      .eq('fno_id', fnoId)
    
    // Apply filters
    if (filters?.step_number !== undefined) {
      query = query.eq('step_number', filters.step_number)
    }
    
    // Order by step number
    query = query.order('step_number', { ascending: true })
    
    const { data, error } = await query
    
    return { data, error }
  })
}

/**
 * Get installation steps with FNO information
 */
export async function getInstallationStepsWithFno(
  fnoId: string
): Promise<DatabaseResponse<(InstallationStepRow & { fno: { name: string; status: string } })[]>> {
  const client = createBrowserClient()
  
  if (!fnoId) {
    return DatabaseErrorHandler.createResponse<(InstallationStepRow & { fno: { name: string; status: string } })[]>(
      null, 
      new Error('FNO ID is required')
    )
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .select(`
        *,
        fno:fnos (
          name,
          status
        )
      `)
      .eq('fno_id', fnoId)
      .order('step_number', { ascending: true })
    
    return { data, error }
  })
}

/**
 * Create a new installation step
 */
export async function createInstallationStep(
  step: InstallationStepInsert
): Promise<DatabaseResponse<InstallationStepRow>> {
  const client = createBrowserClient()
  
  // Validate input
  const validation = validateInstallationStepData(step)
  if (!validation.isValid) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(
      null, 
      new Error(`Validation failed: ${validation.errors.join(', ')}`)
    )
  }
  
  // Check if step number already exists for this FNO
  const existingStepResponse = await executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .select('id')
      .eq('fno_id', step.fno_id)
      .eq('step_number', step.step_number)
      .single()
    
    return { data, error }
  })
  
  if (existingStepResponse.data) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(
      null, 
      new Error(`Step number ${step.step_number} already exists for this FNO`)
    )
  }
  
  // Set created_at if not provided
  step.created_at = step.created_at || new Date().toISOString()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .insert(step)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Update an existing installation step
 */
export async function updateInstallationStep(
  id: string,
  updates: InstallationStepUpdate
): Promise<DatabaseResponse<InstallationStepRow>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Installation step ID is required'))
  }
  
  // Validate updates
  if (updates.title !== undefined && (!updates.title || updates.title.trim().length === 0)) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Step title cannot be empty'))
  }
  
  if (updates.description !== undefined && (!updates.description || updates.description.trim().length === 0)) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Step description cannot be empty'))
  }
  
  if (updates.step_number !== undefined) {
    if (typeof updates.step_number !== 'number' || updates.step_number < 1) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Step number must be a positive integer'))
    }
    
    // Check if new step number conflicts with existing steps
    const currentStepResponse = await getInstallationStepById(id)
    if (currentStepResponse.error || !currentStepResponse.data) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow>(null, new Error('Installation step not found'))
    }
    
    const currentStep = currentStepResponse.data
    const existingStepResponse = await executeQuery(async () => {
      const { data, error } = await client
        .from('installation_steps')
        .select('id')
        .eq('fno_id', currentStep.fno_id)
        .eq('step_number', updates.step_number)
        .neq('id', id)
        .single()
      
      return { data, error }
    })
    
    if (existingStepResponse.data) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow>(
        null, 
        new Error(`Step number ${updates.step_number} already exists for this FNO`)
      )
    }
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Delete an installation step
 */
export async function deleteInstallationStep(id: string): Promise<DatabaseResponse<boolean>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<boolean>(null, new Error('Installation step ID is required'))
  }
  
  return executeQuery(async () => {
    const { error } = await client
      .from('installation_steps')
      .delete()
      .eq('id', id)
    
    return { data: !error, error }
  })
}

/**
 * Bulk create installation steps for an FNO
 */
export async function createInstallationSteps(
  steps: InstallationStepInsert[]
): Promise<DatabaseResponse<InstallationStepRow[]>> {
  const client = createBrowserClient()
  
  // Validate input
  if (!Array.isArray(steps) || steps.length === 0) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(null, new Error('Installation steps array is required'))
  }
  
  // Validate each step
  for (const step of steps) {
    const validation = validateInstallationStepData(step)
    if (!validation.isValid) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(
        null, 
        new Error(`Validation failed for step ${step.step_number}: ${validation.errors.join(', ')}`)
      )
    }
  }
  
  // Check for duplicate step numbers within the same FNO
  const stepsByFno = steps.reduce((acc, step) => {
    if (!acc[step.fno_id]) {
      acc[step.fno_id] = []
    }
    acc[step.fno_id].push(step.step_number)
    return acc
  }, {} as Record<string, number[]>)
  
  for (const [fnoId, stepNumbers] of Object.entries(stepsByFno)) {
    const uniqueSteps = new Set(stepNumbers)
    if (uniqueSteps.size !== stepNumbers.length) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(
        null, 
        new Error(`Duplicate step numbers found for FNO ${fnoId}`)
      )
    }
  }
  
  // Set created_at for all steps
  const now = new Date().toISOString()
  steps.forEach(step => {
    step.created_at = step.created_at || now
  })
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .insert(steps)
      .select()
    
    return { data, error }
  })
}

/**
 * Reorder installation steps for an FNO
 */
export async function reorderInstallationSteps(
  fnoId: string,
  stepOrders: { id: string; step_number: number }[]
): Promise<DatabaseResponse<InstallationStepRow[]>> {
  const client = createBrowserClient()
  
  if (!fnoId) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(null, new Error('FNO ID is required'))
  }
  
  if (!Array.isArray(stepOrders) || stepOrders.length === 0) {
    return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(null, new Error('Step orders array is required'))
  }
  
  // Validate step numbers are sequential starting from 1
  const sortedOrders = stepOrders.sort((a, b) => a.step_number - b.step_number)
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i].step_number !== i + 1) {
      return DatabaseErrorHandler.createResponse<InstallationStepRow[]>(
        null, 
        new Error('Step numbers must be sequential starting from 1')
      )
    }
  }
  
  return executeQuery(async () => {
    // Update each step with its new order
    const updatePromises = stepOrders.map(({ id, step_number }) =>
      client
        .from('installation_steps')
        .update({ step_number })
        .eq('id', id)
        .eq('fno_id', fnoId)
    )
    
    await Promise.all(updatePromises)
    
    // Return updated steps
    const { data, error } = await client
      .from('installation_steps')
      .select('*')
      .eq('fno_id', fnoId)
      .order('step_number', { ascending: true })
    
    return { data, error }
  })
}

/**
 * Get installation step statistics for an FNO
 */
export async function getInstallationStepStats(fnoId: string): Promise<DatabaseResponse<{
  totalSteps: number
  averageDescriptionLength: number
  stepNumbers: number[]
}>> {
  const client = createBrowserClient()
  
  if (!fnoId) {
    return DatabaseErrorHandler.createResponse<{
      totalSteps: number
      averageDescriptionLength: number
      stepNumbers: number[]
    }>(null, new Error('FNO ID is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('installation_steps')
      .select('step_number, description')
      .eq('fno_id', fnoId)
    
    if (error) {
      return { data: null, error }
    }
    
    const stats = {
      totalSteps: data.length,
      averageDescriptionLength: data.length > 0 
        ? Math.round(data.reduce((sum, step) => sum + step.description.length, 0) / data.length)
        : 0,
      stepNumbers: data.map(step => step.step_number).sort((a, b) => a - b)
    }
    
    return { data: stats, error: null }
  })
}

/**
 * Validate installation step data
 */
export function validateInstallationStepData(data: Partial<InstallationStepInsert>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.fno_id) {
    errors.push('FNO ID is required')
  } else if (typeof data.fno_id !== 'string' || data.fno_id.trim().length === 0) {
    errors.push('FNO ID must be a non-empty string')
  }
  
  if (data.step_number === undefined || data.step_number === null) {
    errors.push('Step number is required')
  } else if (typeof data.step_number !== 'number' || data.step_number < 1 || !Number.isInteger(data.step_number)) {
    errors.push('Step number must be a positive integer')
  }
  
  if (!data.title) {
    errors.push('Step title is required')
  } else if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Step title must be a non-empty string')
  } else if (data.title.length > 255) {
    errors.push('Step title must be less than 255 characters')
  }
  
  if (!data.description) {
    errors.push('Step description is required')
  } else if (typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Step description must be a non-empty string')
  } else if (data.description.length > 2000) {
    errors.push('Step description must be less than 2000 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}