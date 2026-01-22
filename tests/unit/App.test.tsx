import { render, screen } from '@testing-library/react';
import { App } from '@/App';

describe('App', () => {
  it('displays application is running message', () => {
    render(<App />);
    expect(screen.getByText('Application is running')).toBeInTheDocument();
  });
});
