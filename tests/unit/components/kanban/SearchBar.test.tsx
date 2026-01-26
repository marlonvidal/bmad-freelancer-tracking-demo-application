import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SearchBar } from '@/components/kanban/SearchBar';
import { FilterProvider, useFilterContext } from '@/contexts/FilterContext';

// Mock useKeyboardShortcut to avoid issues with event listeners in tests
jest.mock('@/hooks/useKeyboardShortcut', () => ({
  useKeyboardShortcut: jest.fn()
}));

// Mock useDebounce to return value immediately for testing
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value) => value)
}));

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <FilterProvider>
        {component}
      </FilterProvider>
    );
  };

  describe('rendering', () => {
    it('renders search input with placeholder', () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      expect(input).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      const container = input.closest('div');
      expect(container?.querySelector('svg')).toBeInTheDocument();
    });

    it('does not show clear button when query is empty', () => {
      renderWithProvider(<SearchBar />);
      
      const clearButton = screen.queryByLabelText(/Clear search/i);
      expect(clearButton).not.toBeInTheDocument();
    });

    it('shows clear button when query exists', async () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const clearButton = screen.getByLabelText(/Clear search/i);
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('shows keyboard shortcut help text', () => {
      renderWithProvider(<SearchBar />);
      
      expect(screen.getByText(/Press/i)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+F/i)).toBeInTheDocument();
      expect(screen.getByText(/Cmd\+F/i)).toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('updates FilterContext when user types', async () => {
      let contextValue: any;
      const TestComponent = () => {
         
        const context = useFilterContext();
        React.useEffect(() => {
          contextValue = context;
        }, [context]);
        return <SearchBar />;
      };

      renderWithProvider(<TestComponent />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'test query' } });
      });

      // Wait for debounce (300ms) + state update
      await waitFor(() => {
        expect(contextValue.filters.searchQuery).toBe('test query');
      }, { timeout: 1000 });
    });

    it('has proper ARIA labels', () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByLabelText(/Search tasks by title, description, or tags/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-describedby', 'search-help-text');
    });

    it('has proper role attribute', () => {
      renderWithProvider(<SearchBar />);
      
      const searchRegion = screen.getByRole('search');
      expect(searchRegion).toBeInTheDocument();
    });
  });

  describe('clear button', () => {
    it('clears search when clicked', async () => {
      let contextValue: any;
      const TestComponent = () => {
         
        const context = useFilterContext();
        React.useEffect(() => {
          contextValue = context;
        }, [context]);
        return <SearchBar />;
      };

      renderWithProvider(<TestComponent />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'test' } });
      });

      await waitFor(() => {
        expect(contextValue.filters.searchQuery).toBe('test');
      }, { timeout: 1000 });

      const clearButton = screen.getByLabelText(/Clear search/i);
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(contextValue.filters.searchQuery).toBe('');
        expect(input).toHaveValue('');
      });
    });

    it('focuses input after clearing', async () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i) as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 'test' } });
      });

      const clearButton = screen.getByLabelText(/Clear search/i);
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe('debouncing', () => {
    it('debounces search input updates', async () => {
      const { useDebounce } = require('@/hooks/useDebounce');
      
      let contextValue: any;
      const TestComponent = () => {
         
        const context = useFilterContext();
        React.useEffect(() => {
          contextValue = context;
        }, [context]);
        return <SearchBar />;
      };

      renderWithProvider(<TestComponent />);
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(input, { target: { value: 't' } });
        fireEvent.change(input, { target: { value: 'te' } });
        fireEvent.change(input, { target: { value: 'tes' } });
        fireEvent.change(input, { target: { value: 'test' } });
      });

      // Wait for debounce to complete
      await waitFor(() => {
        expect(contextValue.filters.searchQuery).toBe('test');
      }, { timeout: 1000 });

      // Verify debounce hook was called (mocked to return immediately)
      expect(useDebounce).toHaveBeenCalled();
    });
  });

  describe('keyboard shortcut', () => {
    it('registers keyboard shortcut handler', () => {
      const { useKeyboardShortcut } = require('@/hooks/useKeyboardShortcut');
      
      renderWithProvider(<SearchBar />);
      
      expect(useKeyboardShortcut).toHaveBeenCalledWith(
        'f',
        expect.any(Function),
        expect.objectContaining({
          ctrlKey: true,
          metaKey: true,
          preventDefault: true
        })
      );
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithProvider(<SearchBar />);
      
      const input = screen.getByLabelText(/Search tasks by title, description, or tags/i);
      expect(input).toBeInTheDocument();
      
      const searchRegion = screen.getByRole('search', { name: /Search tasks/i });
      expect(searchRegion).toBeInTheDocument();
    });

    it('has help text with proper ID', () => {
      renderWithProvider(<SearchBar />);
      
      const helpText = screen.getByText(/Press/i).closest('p');
      expect(helpText).toHaveAttribute('id', 'search-help-text');
      
      const input = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      expect(input).toHaveAttribute('aria-describedby', 'search-help-text');
    });
  });
});
