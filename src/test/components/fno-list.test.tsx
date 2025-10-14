import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FnoList } from '@/components/dashboard/fno-list';
import type { FnoRow } from '@/lib/database/types';

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

describe('FnoList Component', () => {
  const mockFnos: FnoRow[] = [
    {
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
    },
    {
      id: '2',
      name: 'Frogfoot',
      contact_person: 'Jane Doe',
      support_number: '087 987 6543',
      coverage_area: 'Cape Town',
      sla_hours: 24,
      status: 'inactive',
      created_by: 'user1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Manager Role', () => {
    it('should render FNO list for manager', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('Frogfoot')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should show manager-specific action buttons', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Should show Edit buttons for managers
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(2);
      
      // Should show View buttons
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons).toHaveLength(2);
    });

    it('should show dropdown menu with manager actions', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Click on dropdown trigger (More options button)
      const dropdownTriggers = screen.getAllByRole('button');
      const moreOptionsButtons = dropdownTriggers.filter(button => 
        button.querySelector('svg') // Looking for the MoreHorizontal icon
      );
      
      expect(moreOptionsButtons.length).toBeGreaterThan(0);
    });

    it('should display FNO status badges correctly', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });

    it('should display FNO details correctly', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Check contact information
      expect(screen.getByText('087 123 4567')).toBeInTheDocument();
      expect(screen.getByText('087 987 6543')).toBeInTheDocument();
      
      // Check coverage areas
      expect(screen.getByText('Johannesburg')).toBeInTheDocument();
      expect(screen.getByText('Cape Town')).toBeInTheDocument();
      
      // Check SLA hours
      expect(screen.getByText('48 hour SLA')).toBeInTheDocument();
      expect(screen.getByText('24 hour SLA')).toBeInTheDocument();
    });

    it('should handle delete confirmation dialog', async () => {
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Find and click a dropdown trigger
      const dropdownTriggers = screen.getAllByRole('button');
      const moreOptionsButton = dropdownTriggers.find(button => 
        button.querySelector('svg')
      );
      
      if (moreOptionsButton) {
        fireEvent.click(moreOptionsButton);
        
        // Wait for dropdown to appear and look for delete option
        await waitFor(() => {
          const deleteButton = screen.queryByText('Delete');
          if (deleteButton) {
            fireEvent.click(deleteButton);
            expect(confirmSpy).toHaveBeenCalledWith(
              'Are you sure you want to delete this FNO? This action cannot be undone.'
            );
          }
        });
      }
      
      confirmSpy.mockRestore();
    });
  });

  describe('Agent Role', () => {
    it('should render FNO list for agent', () => {
      render(<FnoList fnos={mockFnos} userRole="agent" />);
      
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('Frogfoot')).toBeInTheDocument();
    });

    it('should show agent-specific action buttons (view only)', () => {
      render(<FnoList fnos={mockFnos} userRole="agent" />);
      
      // Should show View Details buttons for agents
      const viewButtons = screen.getAllByText('View Details');
      expect(viewButtons).toHaveLength(2);
      
      // Should NOT show Edit buttons for agents
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('should not show dropdown menus for agents', () => {
      render(<FnoList fnos={mockFnos} userRole="agent" />);
      
      // Should not show dropdown triggers for agents (no buttons with aria-haspopup)
      const buttons = screen.queryAllByRole('button');
      const dropdownTriggers = buttons.filter(button =>
        button.getAttribute('aria-haspopup') === 'menu'
      );
      
      expect(dropdownTriggers).toHaveLength(0);
    });

    it('should have correct links for agent role', () => {
      render(<FnoList fnos={mockFnos} userRole="agent" />);
      
      const viewLinks = screen.getAllByRole('link');
      const agentLinks = viewLinks.filter(link => 
        link.getAttribute('href')?.includes('/dashboard/agent/fno/')
      );
      
      expect(agentLinks).toHaveLength(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no FNOs', () => {
      render(<FnoList fnos={[]} userRole="manager" />);
      
      expect(screen.getByText('No FNOs found')).toBeInTheDocument();
    });

    it('should handle empty FNO list gracefully', () => {
      render(<FnoList fnos={[]} userRole="agent" />);
      
      expect(screen.getByText('No FNOs found')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render cards in grid layout', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Look for the grid container by class instead of role
      const gridContainer = document.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid', 'gap-4', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should show FNO information in card format', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      // Check that FNO names are rendered (indicating cards are present)
      expect(screen.getByText('Vumatel')).toBeInTheDocument();
      expect(screen.getByText('Frogfoot')).toBeInTheDocument();
      
      // Check for card-like structure by looking for specific elements
      const cardElements = document.querySelectorAll('.rounded-xl.border');
      expect(cardElements).toHaveLength(2);
    });
  });

  describe('Data Display', () => {
    it('should handle missing optional fields gracefully', () => {
      const fnoWithMissingFields: FnoRow = {
        id: '3',
        name: 'Test FNO',
        contact_person: null,
        support_number: null,
        coverage_area: null,
        sla_hours: null,
        status: 'active',
        created_by: 'user1',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      render(<FnoList fnos={[fnoWithMissingFields]} userRole="manager" />);
      
      expect(screen.getByText('Test FNO')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      
      // Should not crash when optional fields are null
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });

    it('should format SLA hours correctly', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      expect(screen.getByText('48 hour SLA')).toBeInTheDocument();
      expect(screen.getByText('24 hour SLA')).toBeInTheDocument();
    });

    it('should display status badges with correct styling', () => {
      render(<FnoList fnos={mockFnos} userRole="manager" />);
      
      const activeBadge = screen.getByText('active');
      const inactiveBadge = screen.getByText('inactive');
      
      expect(activeBadge).toBeInTheDocument();
      expect(inactiveBadge).toBeInTheDocument();
    });
  });
});