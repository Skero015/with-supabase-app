/**
 * Database Types for Service Delivery Platform
 * Generated from Supabase schema
 */

// Base types for database operations
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User role enum
export type UserRole = 'manager' | 'agent'

// FNO status enum
export type FnoStatus = 'active' | 'inactive'

// Database table types
export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: UserRoleRow
        Insert: UserRoleInsert
        Update: UserRoleUpdate
      }
      fnos: {
        Row: FnoRow
        Insert: FnoInsert
        Update: FnoUpdate
      }
      installation_steps: {
        Row: InstallationStepRow
        Insert: InstallationStepInsert
        Update: InstallationStepUpdate
      }
    }
  }
}

// User Roles Table Types
export interface UserRoleRow {
  user_id: string
  role: UserRole
  created_at: string
}

export interface UserRoleInsert {
  user_id: string
  role: UserRole
  created_at?: string
}

export interface UserRoleUpdate {
  role?: UserRole
}

// FNOs Table Types
export interface FnoRow {
  id: string
  name: string
  contact_person: string | null
  support_number: string | null
  coverage_area: string | null
  sla_hours: number | null
  status: FnoStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FnoInsert {
  id?: string
  name: string
  contact_person?: string | null
  support_number?: string | null
  coverage_area?: string | null
  sla_hours?: number | null
  status?: FnoStatus
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface FnoUpdate {
  name?: string
  contact_person?: string | null
  support_number?: string | null
  coverage_area?: string | null
  sla_hours?: number | null
  status?: FnoStatus
  updated_at?: string
}

// Installation Steps Table Types
export interface InstallationStepRow {
  id: string
  fno_id: string
  step_number: number
  title: string
  description: string
  created_at: string
}

export interface InstallationStepInsert {
  id?: string
  fno_id: string
  step_number: number
  title: string
  description: string
  created_at?: string
}

export interface InstallationStepUpdate {
  step_number?: number
  title?: string
  description?: string
}

// Utility types for API responses
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export interface DatabaseResponse<T> {
  data: T | null
  error: DatabaseError | null
}

// Extended types with relationships
export interface FnoWithSteps extends FnoRow {
  installation_steps: InstallationStepRow[]
}

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
}

// Query filter types
export interface FnoFilters {
  status?: FnoStatus
  created_by?: string
  name?: string
  coverage_area?: string
}

export interface InstallationStepFilters {
  fno_id?: string
  step_number?: number
}

// Pagination types
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}