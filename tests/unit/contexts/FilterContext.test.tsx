import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { FilterProvider, useFilterContext } from '@/contexts/FilterContext';

// Test component that uses the context
const TestComponent: React.FC<{ onContextValue?: (value: any) => void }> = ({ onContextValue }) => {
  const context = useFilterContext();
  
  React.useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);

  return (
    <div>
      <div data-testid="client-filter">{context.filters.clientId || 'null'}</div>
      <div data-testid="project-filter">{context.filters.projectId || 'null'}</div>
    </div>
  );
};

describe('FilterContext', () => {
  describe('initial state', () => {
    it('initializes with null filters', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.filters.clientId).toBeNull();
      expect(contextValue.filters.projectId).toBeNull();
      expect(screen.getByTestId('client-filter')).toHaveTextContent('null');
      expect(screen.getByTestId('project-filter')).toHaveTextContent('null');
    });
  });

  describe('setClientFilter', () => {
    it('updates client filter state', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
      });

      expect(contextValue.filters.clientId).toBe('client-1');
      expect(contextValue.filters.projectId).toBeNull(); // Project filter should be reset
      expect(screen.getByTestId('client-filter')).toHaveTextContent('client-1');
    });

    it('resets project filter when client filter changes', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      // Set both filters
      act(() => {
        contextValue.setClientFilter('client-1');
        contextValue.setProjectFilter('project-1');
      });

      expect(contextValue.filters.clientId).toBe('client-1');
      expect(contextValue.filters.projectId).toBe('project-1');

      // Change client filter - project should reset
      act(() => {
        contextValue.setClientFilter('client-2');
      });

      expect(contextValue.filters.clientId).toBe('client-2');
      expect(contextValue.filters.projectId).toBeNull();
    });

    it('can set client filter to null', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
      });

      expect(contextValue.filters.clientId).toBe('client-1');

      act(() => {
        contextValue.setClientFilter(null);
      });

      expect(contextValue.filters.clientId).toBeNull();
      expect(contextValue.filters.projectId).toBeNull();
    });
  });

  describe('setProjectFilter', () => {
    it('updates project filter state', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
        contextValue.setProjectFilter('project-1');
      });

      expect(contextValue.filters.projectId).toBe('project-1');
      expect(screen.getByTestId('project-filter')).toHaveTextContent('project-1');
    });

    it('can set project filter to null', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
        contextValue.setProjectFilter('project-1');
      });

      expect(contextValue.filters.projectId).toBe('project-1');

      act(() => {
        contextValue.setProjectFilter(null);
      });

      expect(contextValue.filters.projectId).toBeNull();
      expect(contextValue.filters.clientId).toBe('client-1'); // Client filter should remain
    });
  });

  describe('clearFilters', () => {
    it('resets both filters to null', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
        contextValue.setProjectFilter('project-1');
      });

      expect(contextValue.filters.clientId).toBe('client-1');
      expect(contextValue.filters.projectId).toBe('project-1');

      act(() => {
        contextValue.clearFilters();
      });

      expect(contextValue.filters.clientId).toBeNull();
      expect(contextValue.filters.projectId).toBeNull();
      expect(screen.getByTestId('client-filter')).toHaveTextContent('null');
      expect(screen.getByTestId('project-filter')).toHaveTextContent('null');
    });
  });

  describe('getFilters', () => {
    it('returns current filter state', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setClientFilter('client-1');
        contextValue.setProjectFilter('project-1');
      });

      const filters = contextValue.getFilters();
      expect(filters).toEqual({
        clientId: 'client-1',
        projectId: 'project-1'
      });
    });
  });

  describe('filter state does not persist', () => {
    it('resets filters on remount (simulating app reload)', () => {
      let contextValue1: any;
      const { unmount } = render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue1 = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue1.setClientFilter('client-1');
        contextValue1.setProjectFilter('project-1');
      });

      expect(contextValue1.filters.clientId).toBe('client-1');
      expect(contextValue1.filters.projectId).toBe('project-1');

      // Unmount and remount (simulating app reload)
      unmount();

      let contextValue2: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue2 = value; }} />
        </FilterProvider>
      );

      // Filters should be reset to null (not persisted)
      expect(contextValue2.filters.clientId).toBeNull();
      expect(contextValue2.filters.projectId).toBeNull();
    });
  });

  describe('context updates trigger re-renders', () => {
    it('updates component when filter state changes', () => {
      let renderCount = 0;
      const TestRenderComponent: React.FC = () => {
        const context = useFilterContext();
        renderCount++;
        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="render-client-filter">{context.filters.clientId || 'null'}</div>
          </div>
        );
      };

      let contextValue: any;
      render(
        <FilterProvider>
          <TestRenderComponent />
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      const initialRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');

      act(() => {
        contextValue.setClientFilter('client-1');
      });

      // Component should re-render after filter change
      const newRenderCount = parseInt(screen.getByTestId('render-count').textContent || '0');
      expect(newRenderCount).toBeGreaterThan(initialRenderCount);
      expect(screen.getByTestId('render-client-filter')).toHaveTextContent('client-1');
    });
  });

  describe('useFilterContext hook', () => {
    it('throws error when used outside FilterProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFilterContext must be used within a FilterProvider');

      consoleError.mockRestore();
    });
  });
});
