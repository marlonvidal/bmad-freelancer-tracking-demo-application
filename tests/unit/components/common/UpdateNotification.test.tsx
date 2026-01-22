import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateNotification } from '@/components/common/UpdateNotification';

describe('UpdateNotification', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when no update is available', () => {
    const { container } = render(
      <UpdateNotification updateAvailable={false} onUpdate={mockOnUpdate} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when update is available', () => {
    render(<UpdateNotification updateAvailable={true} onUpdate={mockOnUpdate} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Update Available/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<UpdateNotification updateAvailable={true} onUpdate={mockOnUpdate} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-label', 'Update available');
  });

  it('calls onUpdate when Update Now button is clicked', () => {
    render(<UpdateNotification updateAvailable={true} onUpdate={mockOnUpdate} />);
    const updateButton = screen.getByText('Update Now');
    fireEvent.click(updateButton);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });

  it('displays update message', () => {
    render(<UpdateNotification updateAvailable={true} onUpdate={mockOnUpdate} />);
    expect(
      screen.getByText(/A new version of the application is available/i)
    ).toBeInTheDocument();
  });

  it('calls onDismiss when Later button is clicked', () => {
    const mockOnDismiss = jest.fn();
    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={mockOnUpdate}
        onDismiss={mockOnDismiss}
      />
    );
    const laterButton = screen.getByText('Later');
    fireEvent.click(laterButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when close button is clicked', () => {
    const mockOnDismiss = jest.fn();
    render(
      <UpdateNotification
        updateAvailable={true}
        onUpdate={mockOnUpdate}
        onDismiss={mockOnDismiss}
      />
    );
    const closeButton = screen.getByLabelText('Close update notification');
    fireEvent.click(closeButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onDismiss is not provided', () => {
    render(<UpdateNotification updateAvailable={true} onUpdate={mockOnUpdate} />);
    const laterButton = screen.getByText('Later');
    expect(() => fireEvent.click(laterButton)).not.toThrow();
  });
});
