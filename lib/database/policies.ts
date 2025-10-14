/**
 * Row Level Security (RLS) Policy Definitions
 * SQL strings and TypeScript constants for database security policies
 */

// RLS Policy SQL strings for Supabase
export const RLS_POLICIES = {
  // User Roles Policies
  USER_ROLES: {
    // Users can only read their own role
    SELECT_OWN_ROLE: `
      CREATE POLICY "Users can read their own role" ON user_roles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    `,
    
    // Users can insert their own role (during signup)
    INSERT_OWN_ROLE: `
      CREATE POLICY "Users can insert their own role" ON user_roles
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
    `,
    
    // Users can update their own role
    UPDATE_OWN_ROLE: `
      CREATE POLICY "Users can update their own role" ON user_roles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    `
  },

  // FNOs Policies
  FNOS: {
    // Managers can CRUD their own FNOs
    MANAGER_CRUD_OWN: `
      CREATE POLICY "Managers can CRUD their own FNOs" ON fnos
        FOR ALL
        TO authenticated
        USING (
          created_by = auth.uid() AND
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'manager'
          )
        )
        WITH CHECK (
          created_by = auth.uid() AND
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'manager'
          )
        );
    `,
    
    // Agents can SELECT all active FNOs
    AGENT_SELECT_ACTIVE: `
      CREATE POLICY "Agents can select all active FNOs" ON fnos
        FOR SELECT
        TO authenticated
        USING (
          status = 'active' AND
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'agent'
          )
        );
    `,
    
    // Managers can SELECT all FNOs (including their inactive ones)
    MANAGER_SELECT_ALL: `
      CREATE POLICY "Managers can select all FNOs" ON fnos
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'manager'
          )
        );
    `
  },

  // Installation Steps Policies
  INSTALLATION_STEPS: {
    // Inherit permissions from parent FNO for managers
    MANAGER_CRUD_STEPS: `
      CREATE POLICY "Managers can CRUD steps for their FNOs" ON installation_steps
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM fnos 
            WHERE fnos.id = installation_steps.fno_id 
            AND fnos.created_by = auth.uid()
            AND EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() AND role = 'manager'
            )
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM fnos 
            WHERE fnos.id = installation_steps.fno_id 
            AND fnos.created_by = auth.uid()
            AND EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() AND role = 'manager'
            )
          )
        );
    `,
    
    // Agents can SELECT steps for active FNOs
    AGENT_SELECT_STEPS: `
      CREATE POLICY "Agents can select steps for active FNOs" ON installation_steps
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM fnos 
            WHERE fnos.id = installation_steps.fno_id 
            AND fnos.status = 'active'
            AND EXISTS (
              SELECT 1 FROM user_roles 
              WHERE user_id = auth.uid() AND role = 'agent'
            )
          )
        );
    `
  }
} as const

// Enable RLS on all tables
export const ENABLE_RLS = {
  USER_ROLES: 'ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;',
  FNOS: 'ALTER TABLE fnos ENABLE ROW LEVEL SECURITY;',
  INSTALLATION_STEPS: 'ALTER TABLE installation_steps ENABLE ROW LEVEL SECURITY;'
} as const

// Complete RLS setup script
export const COMPLETE_RLS_SETUP = `
-- Enable RLS on all tables
${ENABLE_RLS.USER_ROLES}
${ENABLE_RLS.FNOS}
${ENABLE_RLS.INSTALLATION_STEPS}

-- User Roles Policies
${RLS_POLICIES.USER_ROLES.SELECT_OWN_ROLE}
${RLS_POLICIES.USER_ROLES.INSERT_OWN_ROLE}
${RLS_POLICIES.USER_ROLES.UPDATE_OWN_ROLE}

-- FNOs Policies
${RLS_POLICIES.FNOS.MANAGER_CRUD_OWN}
${RLS_POLICIES.FNOS.AGENT_SELECT_ACTIVE}
${RLS_POLICIES.FNOS.MANAGER_SELECT_ALL}

-- Installation Steps Policies
${RLS_POLICIES.INSTALLATION_STEPS.MANAGER_CRUD_STEPS}
${RLS_POLICIES.INSTALLATION_STEPS.AGENT_SELECT_STEPS}
`

// Policy validation helpers
export const POLICY_HELPERS = {
  /**
   * Check if user has manager role
   */
  isManager: (userId: string) => `
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = '${userId}' AND role = 'manager'
    )
  `,

  /**
   * Check if user has agent role
   */
  isAgent: (userId: string) => `
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = '${userId}' AND role = 'agent'
    )
  `,

  /**
   * Check if user owns FNO
   */
  ownsFno: (userId: string, fnoId: string) => `
    EXISTS (
      SELECT 1 FROM fnos 
      WHERE id = '${fnoId}' AND created_by = '${userId}'
    )
  `,

  /**
   * Check if FNO is active
   */
  isFnoActive: (fnoId: string) => `
    EXISTS (
      SELECT 1 FROM fnos 
      WHERE id = '${fnoId}' AND status = 'active'
    )
  `
} as const

// TypeScript types for policy validation
export interface PolicyContext {
  userId: string
  userRole: 'manager' | 'agent'
  resourceId?: string
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
}

export interface PolicyResult {
  allowed: boolean
  reason?: string
}

/**
 * Client-side policy validation (for UI logic)
 * Note: This is NOT a security measure, just for UX
 */
export class PolicyValidator {
  static validateUserRoleAccess(context: PolicyContext): PolicyResult {
    const { userId, resourceId } = context

    // Users can only access their own role records
    if (resourceId && resourceId !== userId) {
      return { allowed: false, reason: 'Can only access own role record' }
    }

    return { allowed: true }
  }

  static validateFnoAccess(context: PolicyContext): PolicyResult {
    const { userRole, action } = context

    if (userRole === 'manager') {
      // Managers can do everything on their own FNOs
      return { allowed: true }
    }

    if (userRole === 'agent') {
      // Agents can only SELECT active FNOs
      if (action === 'SELECT') {
        return { allowed: true }
      }
      return { allowed: false, reason: 'Agents can only view FNOs' }
    }

    return { allowed: false, reason: 'Invalid user role' }
  }

  static validateInstallationStepAccess(context: PolicyContext): PolicyResult {
    const { userRole, action } = context

    if (userRole === 'manager') {
      // Managers can do everything on steps for their FNOs
      return { allowed: true }
    }

    if (userRole === 'agent') {
      // Agents can only SELECT steps for active FNOs
      if (action === 'SELECT') {
        return { allowed: true }
      }
      return { allowed: false, reason: 'Agents can only view installation steps' }
    }

    return { allowed: false, reason: 'Invalid user role' }
  }
}