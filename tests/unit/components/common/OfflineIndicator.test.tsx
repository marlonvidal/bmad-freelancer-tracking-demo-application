import { render, screen } from '@testing-library/react';
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

describe('OfflineIndicator', () => {
  it('does not render when online', () => {
    const { container } = render(<OfflineIndicator isOnline={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when offline', () => {
    render(<OfflineIndicator isOnline={false} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<OfflineIndicator isOnline={false} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveAttribute('aria-label', 'Offline');
  });

  it('displays offline message', () => {
    render(<OfflineIndicator isOnline={false} />);
    expect(
      screen.getByText(/You are currently offline. Some features may be limited./i)
    ).toBeInTheDocument();
  });
});
