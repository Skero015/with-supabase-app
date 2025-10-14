/**
 * FNO Management Utilities
 * Functions for managing Fibre Network Operators in the database
 */

import type { 
  FnoRow, 
  FnoInsert, 
  FnoUpdate, 
  FnoWithSteps,
  DatabaseResponse,
  FnoStatus,
  FnoFilters,
  PaginationOptions,
  PaginatedResponse
} from './types'
import { createBrowserClient, executeQuery, DatabaseErrorHandler, getCurrentUser } from './client'

/**
 * Get FNO by ID
 */
export async function getFnoById(id: string): Promise<DatabaseResponse<FnoRow>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<FnoRow>(null, new Error('FNO ID is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  })
}

/**
 * Get FNO with installation steps
 */
export async function getFnoWithSteps(id: string): Promise<DatabaseResponse<FnoWithSteps>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<FnoWithSteps>(null, new Error('FNO ID is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .select(`
        *,
        installation_steps (
          id,
          step_number,
          title,
          description,
          created_at
        )
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  })
}

/**
 * Get all FNOs with optional filtering and pagination
 */
export async function getFnos(
  filters?: FnoFilters,
  pagination?: PaginationOptions
): Promise<DatabaseResponse<FnoRow[]>> {
  const client = createBrowserClient()
  
  return executeQuery(async () => {
    let query = client.from('fnos').select('*')
    
    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }
    if (filters?.coverage_area) {
      query = query.ilike('coverage_area', `%${filters.coverage_area}%`)
    }
    
    // Apply pagination
    if (pagination?.limit) {
      query = query.limit(pagination.limit)
    }
    if (pagination?.offset) {
      query = query.range(pagination.offset, pagination.offset + (pagination.limit || 10) - 1)
    }
    
    // Order by updated_at desc
    query = query.order('updated_at', { ascending: false })
    
    const { data, error } = await query
    
    return { data, error }
  })
}

/**
 * Get paginated FNOs with count
 */
export async function getPaginatedFnos(
  filters?: FnoFilters,
  pagination: PaginationOptions = { page: 1, limit: 10 }
): Promise<DatabaseResponse<PaginatedResponse<FnoRow>>> {
  const client = createBrowserClient()
  
  const page = pagination.page || 1
  const limit = pagination.limit || 10
  const offset = (page - 1) * limit
  
  return executeQuery(async () => {
    let query = client.from('fnos').select('*', { count: 'exact' })
    
    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`)
    }
    if (filters?.coverage_area) {
      query = query.ilike('coverage_area', `%${filters.coverage_area}%`)
    }
    
    // Apply pagination and ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('updated_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      return { data: null, error }
    }
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    const paginatedResponse: PaginatedResponse<FnoRow> = {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages
    }
    
    return { data: paginatedResponse, error: null }
  })
}

/**
 * Create a new FNO
 */
export async function createFno(fno: FnoInsert): Promise<DatabaseResponse<FnoRow>> {
  const client = createBrowserClient()
  
  // Validate input
  const validation = validateFnoData(fno)
  if (!validation.isValid) {
    return DatabaseErrorHandler.createResponse<FnoRow>(
      null, 
      new Error(`Validation failed: ${validation.errors.join(', ')}`)
    )
  }
  
  // Set created_by to current user if not provided
  if (!fno.created_by) {
    const userResponse = await getCurrentUser(client)
    if (userResponse.error || !userResponse.data) {
      return DatabaseErrorHandler.createResponse<FnoRow>(null, new Error('User authentication required'))
    }
    fno.created_by = userResponse.data.id
  }
  
  // Set timestamps
  const now = new Date().toISOString()
  fno.created_at = fno.created_at || now
  fno.updated_at = fno.updated_at || now
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .insert(fno)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Update an existing FNO
 */
export async function updateFno(
  id: string,
  updates: FnoUpdate
): Promise<DatabaseResponse<FnoRow>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<FnoRow>(null, new Error('FNO ID is required'))
  }
  
  // Validate updates
  if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
    return DatabaseErrorHandler.createResponse<FnoRow>(null, new Error('FNO name cannot be empty'))
  }
  
  if (updates.status && !['active', 'inactive'].includes(updates.status)) {
    return DatabaseErrorHandler.createResponse<FnoRow>(null, new Error('Status must be active or inactive'))
  }
  
  // Set updated timestamp
  updates.updated_at = new Date().toISOString()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  })
}

/**
 * Delete an FNO (soft delete by setting status to inactive)
 */
export async function deleteFno(id: string, hardDelete = false): Promise<DatabaseResponse<boolean>> {
  const client = createBrowserClient()
  
  if (!id) {
    return DatabaseErrorHandler.createResponse<boolean>(null, new Error('FNO ID is required'))
  }
  
  return executeQuery(async () => {
    if (hardDelete) {
      // Hard delete - removes record completely
      const { error } = await client
        .from('fnos')
        .delete()
        .eq('id', id)
      
      return { data: !error, error }
    } else {
      // Soft delete - set status to inactive
      const { error } = await client
        .from('fnos')
        .update({ 
          status: 'inactive' as FnoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
      
      return { data: !error, error }
    }
  })
}

/**
 * Get FNOs created by a specific user
 */
export async function getFnosByCreator(creatorId: string): Promise<DatabaseResponse<FnoRow[]>> {
  const client = createBrowserClient()
  
  if (!creatorId) {
    return DatabaseErrorHandler.createResponse<FnoRow[]>(null, new Error('Creator ID is required'))
  }
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .select('*')
      .eq('created_by', creatorId)
      .order('updated_at', { ascending: false })
    
    return { data, error }
  })
}

/**
 * Search FNOs by name or coverage area
 */
export async function searchFnos(searchTerm: string): Promise<DatabaseResponse<FnoRow[]>> {
  const client = createBrowserClient()
  
  if (!searchTerm || searchTerm.trim().length === 0) {
    return DatabaseErrorHandler.createResponse<FnoRow[]>(null, new Error('Search term is required'))
  }
  
  const term = searchTerm.trim()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .select('*')
      .or(`name.ilike.%${term}%,coverage_area.ilike.%${term}%`)
      .eq('status', 'active')
      .order('name', { ascending: true })
    
    return { data, error }
  })
}

/**
 * Get FNO statistics
 */
export async function getFnoStats(): Promise<DatabaseResponse<{
  total: number
  active: number
  inactive: number
  byCreator: Record<string, number>
}>> {
  const client = createBrowserClient()
  
  return executeQuery(async () => {
    const { data, error } = await client
      .from('fnos')
      .select('status, created_by')
    
    if (error) {
      return { data: null, error }
    }
    
    const stats = {
      total: data.length,
      active: data.filter(f => f.status === 'active').length,
      inactive: data.filter(f => f.status === 'inactive').length,
      byCreator: data.reduce((acc, fno) => {
        if (fno.created_by) {
          acc[fno.created_by] = (acc[fno.created_by] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
    }
    
    return { data: stats, error: null }
  })
}

/**
 * Validate FNO data
 */
export function validateFnoData(data: Partial<FnoInsert>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.name) {
    errors.push('FNO name is required')
  } else if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('FNO name must be a non-empty string')
  } else if (data.name.length > 255) {
    errors.push('FNO name must be less than 255 characters')
  }
  
  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('Status must be either "active" or "inactive"')
  }
  
  if (data.sla_hours !== undefined && data.sla_hours !== null) {
    if (typeof data.sla_hours !== 'number' || data.sla_hours < 0) {
      errors.push('SLA hours must be a non-negative number')
    }
  }
  
  if (data.support_number && typeof data.support_number !== 'string') {
    errors.push('Support number must be a string')
  }
  
  if (data.contact_person && typeof data.contact_person !== 'string') {
    errors.push('Contact person must be a string')
  }
  
  if (data.coverage_area && typeof data.coverage_area !== 'string') {
    errors.push('Coverage area must be a string')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}