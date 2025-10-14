import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FnoCreateForm } from '@/components/dashboard/fno-create-form';

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

// Mock database functions
vi.mock('@/lib/database/fnos', () => ({
  createFno: vi.fn(),
}));

vi.mock('@/lib/database/installation-steps', () => ({
  createInstallationSteps: vi.fn(),
}));

// Get the mocked functions
import { createFno } from '@/lib/database/fnos';
import { createInstallationSteps } from '@/lib/database/installation-steps';

const mockCreateFno = vi.mocked(createFno);
const mockCreateInstallationSteps = vi.mocked(createInstallationSteps);

describe('FnoCreateForm Component', () => {
  const mockUserId = 'user123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFno.mockResolvedValue({
      data: {
        id: 'fno123',
        name: 'Test FNO',
        contact_person: null,
        support_number: null,
        coverage_area: null,
        sla_hours: null,
        status: 'active' as const,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null,
    });
    mockCreateInstallationSteps.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  describe('Form Rendering', () => {
    it('should render the form with all required fields', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      expect(screen.getByText('FNO Details')).toBeInTheDocument();
      expect(screen.getByLabelText('FNO Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Contact Person')).toBeInTheDocument();
      expect(screen.getByLabelText('Support Number')).toBeInTheDocument();
      expect(screen.getByLabelText('Coverage Area')).toBeInTheDocument();
      expect(screen.getByLabelText('SLA Hours')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('should render installation steps section', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      expect(screen.getByText('Installation Steps')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('should render back to dashboard link', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const backLink = screen.getByRole('link', { name: /Back to Dashboard/ });
      expect(backLink).toHaveAttribute('href', '/dashboard/manager');
    });

    it('should render create and cancel buttons', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      expect(screen.getByText('Create FNO')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when FNO name is empty', async () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const submitButton = screen.getByText('Create FNO');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('FNO name is required')).toBeInTheDocument();
      });
    });

    it('should show error when installation steps are incomplete', async () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Fill FNO name but leave steps empty
      const nameInput = screen.getByLabelText('FNO Name *');
      fireEvent.change(nameInput, { target: { value: 'Test FNO' } });
      
      const submitButton = screen.getByText('Create FNO');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('All installation steps must have a title and description')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should validate minimum 3 installation steps', async () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Fill FNO name
      const nameInput = screen.getByLabelText('FNO Name *');
      fireEvent.change(nameInput, { target: { value: 'Test FNO' } });
      
      // Try to remove steps (should not be possible to go below 3)
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.textContent === ''
      );
      
      // Should not be able to delete when only 3 steps
      expect(deleteButtons).toHaveLength(0);
    });
  });

  describe('Installation Steps Management', () => {
    it('should allow adding new installation steps', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const addButton = screen.getByText('Add Step');
      fireEvent.click(addButton);
      
      expect(screen.getByText('Step 4')).toBeInTheDocument();
    });

    it('should allow removing installation steps when more than 3', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Add a step first
      const addButton = screen.getByText('Add Step');
      fireEvent.click(addButton);
      
      // Now should be able to delete
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg[class*="trash"]')
      );
      
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should update step titles and descriptions', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const titleInput = screen.getByLabelText('Title *', { selector: '#step-title-0' });
      const descriptionInput = screen.getByLabelText('Description *', { selector: '#step-description-0' });
      
      fireEvent.change(titleInput, { target: { value: 'Pre-check' } });
      fireEvent.change(descriptionInput, { target: { value: 'Verify customer details' } });
      
      expect(titleInput).toHaveValue('Pre-check');
      expect(descriptionInput).toHaveValue('Verify customer details');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('FNO Name *'), { 
        target: { value: 'Vumatel' } 
      });
      fireEvent.change(screen.getByLabelText('Contact Person'), { 
        target: { value: 'John Smith' } 
      });
      fireEvent.change(screen.getByLabelText('Support Number'), { 
        target: { value: '087 123 4567' } 
      });
      fireEvent.change(screen.getByLabelText('Coverage Area'), { 
        target: { value: 'Johannesburg' } 
      });
      fireEvent.change(screen.getByLabelText('SLA Hours'), { 
        target: { value: '48' } 
      });
      
      // Fill installation steps
      const titleInputs = screen.getAllByLabelText(/Title \*/);
      const descriptionInputs = screen.getAllByLabelText(/Description \*/);
      
      fireEvent.change(titleInputs[0], { target: { value: 'Pre-check' } });
      fireEvent.change(descriptionInputs[0], { target: { value: 'Verify customer details' } });
      fireEvent.change(titleInputs[1], { target: { value: 'Equipment Check' } });
      fireEvent.change(descriptionInputs[1], { target: { value: 'Check ONT compatibility' } });
      fireEvent.change(titleInputs[2], { target: { value: 'Installation' } });
      fireEvent.change(descriptionInputs[2], { target: { value: 'Install fibre cable' } });
      
      const submitButton = screen.getByText('Create FNO');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateFno).toHaveBeenCalledWith({
          name: 'Vumatel',
          contact_person: 'John Smith',
          support_number: '087 123 4567',
          coverage_area: 'Johannesburg',
          sla_hours: 48,
          status: 'active',
          created_by: mockUserId,
        });
      });
      
      await waitFor(() => {
        expect(mockCreateInstallationSteps).toHaveBeenCalled();
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/manager/fno/fno123');
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockCreateFno.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: {
            id: 'fno123',
            name: 'Test FNO',
            contact_person: null,
            support_number: null,
            coverage_area: null,
            sla_hours: null,
            status: 'active' as const,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null,
        }), 100))
      );
      
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Fill required fields
      fireEvent.change(screen.getByLabelText('FNO Name *'), { 
        target: { value: 'Test FNO' } 
      });
      
      const titleInputs = screen.getAllByLabelText(/Title \*/);
      const descriptionInputs = screen.getAllByLabelText(/Description \*/);
      
      fireEvent.change(titleInputs[0], { target: { value: 'Step 1' } });
      fireEvent.change(descriptionInputs[0], { target: { value: 'Description 1' } });
      fireEvent.change(titleInputs[1], { target: { value: 'Step 2' } });
      fireEvent.change(descriptionInputs[1], { target: { value: 'Description 2' } });
      fireEvent.change(titleInputs[2], { target: { value: 'Step 3' } });
      fireEvent.change(descriptionInputs[2], { target: { value: 'Description 3' } });
      
      const submitButton = screen.getByText('Create FNO');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Creating FNO...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Creating FNO...')).not.toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      mockCreateFno.mockResolvedValue({
        data: null,
        error: { message: 'Failed to create FNO' },
      });
      
      render(<FnoCreateForm userId={mockUserId} />);
      
      // Fill required fields
      fireEvent.change(screen.getByLabelText('FNO Name *'), { 
        target: { value: 'Test FNO' } 
      });
      
      const titleInputs = screen.getAllByLabelText(/Title \*/);
      const descriptionInputs = screen.getAllByLabelText(/Description \*/);
      
      fireEvent.change(titleInputs[0], { target: { value: 'Step 1' } });
      fireEvent.change(descriptionInputs[0], { target: { value: 'Description 1' } });
      fireEvent.change(titleInputs[1], { target: { value: 'Step 2' } });
      fireEvent.change(descriptionInputs[1], { target: { value: 'Description 2' } });
      fireEvent.change(titleInputs[2], { target: { value: 'Step 3' } });
      fireEvent.change(descriptionInputs[2], { target: { value: 'Description 3' } });
      
      const submitButton = screen.getByText('Create FNO');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create FNO')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('should handle all form field changes', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const nameInput = screen.getByLabelText('FNO Name *');
      const contactInput = screen.getByLabelText('Contact Person');
      const supportInput = screen.getByLabelText('Support Number');
      const coverageInput = screen.getByLabelText('Coverage Area');
      const slaInput = screen.getByLabelText('SLA Hours');
      const statusSelect = screen.getByLabelText('Status');
      
      fireEvent.change(nameInput, { target: { value: 'Test FNO' } });
      fireEvent.change(contactInput, { target: { value: 'John Doe' } });
      fireEvent.change(supportInput, { target: { value: '123-456-7890' } });
      fireEvent.change(coverageInput, { target: { value: 'Test Area' } });
      fireEvent.change(slaInput, { target: { value: '24' } });
      fireEvent.change(statusSelect, { target: { value: 'inactive' } });
      
      expect(nameInput).toHaveValue('Test FNO');
      expect(contactInput).toHaveValue('John Doe');
      expect(supportInput).toHaveValue('123-456-7890');
      expect(coverageInput).toHaveValue('Test Area');
      expect(slaInput).toHaveValue(24);
      expect(statusSelect).toHaveValue('inactive');
    });

    it('should handle numeric SLA hours input', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const slaInput = screen.getByLabelText('SLA Hours');
      
      fireEvent.change(slaInput, { target: { value: '48' } });
      expect(slaInput).toHaveValue(48);
    });
  });

  describe('Navigation', () => {
    it('should have correct cancel link', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const cancelLink = screen.getByRole('link', { name: /Cancel/ });
      expect(cancelLink).toHaveAttribute('href', '/dashboard/manager');
    });

    it('should have correct back to dashboard link', () => {
      render(<FnoCreateForm userId={mockUserId} />);
      
      const backLink = screen.getByRole('link', { name: /Back to Dashboard/ });
      expect(backLink).toHaveAttribute('href', '/dashboard/manager');
    });
  });
});