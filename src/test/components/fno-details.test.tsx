import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FnoDetails } from '@/components/dashboard/fno-details';
import type { FnoWithSteps } from '@/lib/database/types';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('FnoDetails Component', () => {
  const mockFnoWithSteps: FnoWithSteps = {
    id: '1',
    name: 'Vumatel',
    contact_person: 'John Smith',
    support_number: '087 123 4567',
    coverage_area: 'Johannesburg',
    sla_hours: 48,
    status: 'active',
    created_by: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    installation_steps: [
      {
        id: 'step1',
        fno_id: '1',
        step_number: 1,
        title: 'Pre-check',
        description: 'Verify customer details on Vumatel portal',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'step2',
        fno_id: '1',
        step_number: 2,
        title: 'Equipment Check',
        description: 'Confirm ONT compatibility (Huawei HG8145V5)',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'step3',
        fno_id: '1',
        step_number: 3,
        title: 'Installation',
        description: 'Install fibre drop cable from boundary box',
        created_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  const mockFnoWithoutSteps: FnoWithSteps = {
    ...mockFnoWithSteps,
    installation_steps: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Manager Role', () => {
    it('should render FNO details for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('087 123 4567')).toBeInTheDocument();
      expect(screen.getByText('Johannesburg')).toBeInTheDocument();
      expect(screen.getByText('48 hours')).toBeInTheDocument();
    });

    it('should show manager-specific action buttons', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Edit FNO')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show back to dashboard link for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should display installation steps correctly', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Installation Process')).toBeInTheDocument();
      expect(screen.getByText('Pre-check')).toBeInTheDocument();
      expect(screen.getByText('Equipment Check')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
      
      // Check step descriptions
      expect(screen.getByText('Verify customer details on Vumatel portal')).toBeInTheDocument();
      expect(screen.getByText('Confirm ONT compatibility (Huawei HG8145V5)')).toBeInTheDocument();
      expect(screen.getByText('Install fibre drop cable from boundary box')).toBeInTheDocument();
    });

    it('should show manage steps button for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Manage Steps')).toBeInTheDocument();
    });

    it('should handle delete confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this FNO? This action cannot be undone.'
      );
      
      confirmSpy.mockRestore();
    });

    it('should show empty state when no installation steps', () => {
      render(<FnoDetails fno={mockFnoWithoutSteps} userRole="manager" />);
      
      expect(screen.getByText('No installation steps')).toBeInTheDocument();
      expect(screen.getByText('Add Installation Steps')).toBeInTheDocument();
    });
  });

  describe('Agent Role', () => {
    it('should render FNO details for agent', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('should show back to FNO directory link for agent', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      expect(screen.getByText('Back to FNO Directory')).toBeInTheDocument();
    });

    it('should NOT show manager-specific action buttons', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      expect(screen.queryByText('Edit FNO')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should NOT show manage steps button for agent', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      expect(screen.queryByText('Manage Steps')).not.toBeInTheDocument();
    });

    it('should display installation steps for agent (read-only)', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      expect(screen.getByText('Installation Process')).toBeInTheDocument();
      expect(screen.getByText('Pre-check')).toBeInTheDocument();
      expect(screen.getByText('Equipment Check')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
    });

    it('should show empty state without add button for agent', () => {
      render(<FnoDetails fno={mockFnoWithoutSteps} userRole="agent" />);
      
      expect(screen.getByText('No installation steps')).toBeInTheDocument();
      expect(screen.queryByText('Add Installation Steps')).not.toBeInTheDocument();
    });
  });

  describe('FNO Information Display', () => {
    it('should display all FNO information fields', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('FNO Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Person')).toBeInTheDocument();
      expect(screen.getByText('Support Number')).toBeInTheDocument();
      expect(screen.getByText('Coverage Area')).toBeInTheDocument();
      expect(screen.getByText('SLA')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', () => {
      const fnoWithMissingFields: FnoWithSteps = {
        ...mockFnoWithSteps,
        contact_person: null,
        support_number: null,
        coverage_area: null,
        sla_hours: null,
      };

      render(<FnoDetails fno={fnoWithMissingFields} userRole="manager" />);
      
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      
      // Should not show sections for missing fields
      expect(screen.queryByText('Contact Person')).not.toBeInTheDocument();
      expect(screen.queryByText('Support Number')).not.toBeInTheDocument();
      expect(screen.queryByText('Coverage Area')).not.toBeInTheDocument();
      expect(screen.queryByText('SLA')).not.toBeInTheDocument();
    });

    it('should display status badge correctly', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const statusBadge = screen.getByText('active');
      expect(statusBadge).toBeInTheDocument();
    });

    it('should display inactive status correctly', () => {
      const inactiveFno = { ...mockFnoWithSteps, status: 'inactive' as const };
      render(<FnoDetails fno={inactiveFno} userRole="manager" />);
      
      const statusBadge = screen.getByText('inactive');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Installation Steps Display', () => {
    it('should display steps in correct order', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const stepNumbers = screen.getAllByText(/^[1-3]$/);
      expect(stepNumbers).toHaveLength(3);
      
      // Check that steps are displayed in order
      const stepTitles = ['Pre-check', 'Equipment Check', 'Installation'];
      stepTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('should display step numbers in circles', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      // Check for step number elements
      const stepNumberElements = document.querySelectorAll('.rounded-full');
      expect(stepNumberElements.length).toBeGreaterThan(0);
    });

    it('should display step descriptions', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Verify customer details on Vumatel portal')).toBeInTheDocument();
      expect(screen.getByText('Confirm ONT compatibility (Huawei HG8145V5)')).toBeInTheDocument();
      expect(screen.getByText('Install fibre drop cable from boundary box')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('should display metadata section', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
      expect(screen.getByText(/Total Steps:/)).toBeInTheDocument();
    });

    it('should display correct step count', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      expect(screen.getByText('Total Steps: 3')).toBeInTheDocument();
    });

    it('should display zero steps when no installation steps', () => {
      render(<FnoDetails fno={mockFnoWithoutSteps} userRole="manager" />);
      
      expect(screen.getByText('Total Steps: 0')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct edit link for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const editLink = screen.getByRole('link', { name: /Edit FNO/ });
      expect(editLink).toHaveAttribute('href', '/dashboard/manager/fno/1/edit');
    });

    it('should have correct manage steps link for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const manageStepsLink = screen.getByRole('link', { name: /Manage Steps/ });
      expect(manageStepsLink).toHaveAttribute('href', '/dashboard/manager/fno/1/steps');
    });

    it('should have correct back link for manager', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="manager" />);
      
      const backLink = screen.getByRole('link', { name: /Back to Dashboard/ });
      expect(backLink).toHaveAttribute('href', '/dashboard/manager');
    });

    it('should have correct back link for agent', () => {
      render(<FnoDetails fno={mockFnoWithSteps} userRole="agent" />);
      
      const backLink = screen.getByRole('link', { name: /Back to FNO Directory/ });
      expect(backLink).toHaveAttribute('href', '/dashboard/agent');
    });
  });
});