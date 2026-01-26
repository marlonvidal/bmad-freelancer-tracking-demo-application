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
      expect(contextValue.filters.searchQuery).toBe('');
      expect(contextValue.filters.billableStatus).toBeNull();
      expect(contextValue.filters.priority).toBeNull();
      expect(contextValue.filters.dueDateRange.start).toBeNull();
      expect(contextValue.filters.dueDateRange.end).toBeNull();
      expect(contextValue.filters.tags).toEqual([]);
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
        contextValue.setSearchQuery('test query');
        contextValue.setBillableFilter(true);
        contextValue.setPriorityFilter('high');
        contextValue.setTagFilters(['tag1']);
      });

      act(() => {
        contextValue.clearFilters();
      });

      expect(contextValue.filters.clientId).toBeNull();
      expect(contextValue.filters.projectId).toBeNull();
      expect(contextValue.filters.searchQuery).toBe('');
      expect(contextValue.filters.billableStatus).toBeNull();
      expect(contextValue.filters.priority).toBeNull();
      expect(contextValue.filters.tags).toEqual([]);
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
      expect(filters.clientId).toBe('client-1');
      expect(filters.projectId).toBe('project-1');
      expect(filters.searchQuery).toBe('');
      expect(filters.billableStatus).toBeNull();
      expect(filters.priority).toBeNull();
      expect(filters.dueDateRange.start).toBeNull();
      expect(filters.dueDateRange.end).toBeNull();
      expect(filters.tags).toEqual([]);
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

  describe('setSearchQuery', () => {
    it('updates search query', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setSearchQuery('test query');
      });

      expect(contextValue.filters.searchQuery).toBe('test query');
    });

    it('can set search query to empty string', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setSearchQuery('test');
        contextValue.setSearchQuery('');
      });

      expect(contextValue.filters.searchQuery).toBe('');
    });
  });

  describe('setBillableFilter', () => {
    it('updates billable status filter', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setBillableFilter(true);
      });

      expect(contextValue.filters.billableStatus).toBe(true);
    });

    it('can set billable filter to null', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setBillableFilter(true);
        contextValue.setBillableFilter(null);
      });

      expect(contextValue.filters.billableStatus).toBeNull();
    });
  });

  describe('setPriorityFilter', () => {
    it('updates priority filter', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setPriorityFilter('high');
      });

      expect(contextValue.filters.priority).toBe('high');
    });

    it('can set priority filter to null', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setPriorityFilter('high');
        contextValue.setPriorityFilter(null);
      });

      expect(contextValue.filters.priority).toBeNull();
    });
  });

  describe('setDueDateRange', () => {
    it('updates due date range filter', () => {
      let contextValue: any;
      const startDate = new Date('2026-01-15');
      const endDate = new Date('2026-01-20');

      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setDueDateRange(startDate, endDate);
      });

      expect(contextValue.filters.dueDateRange.start).toEqual(startDate);
      expect(contextValue.filters.dueDateRange.end).toEqual(endDate);
    });

    it('can set dates to null', () => {
      let contextValue: any;
      const startDate = new Date('2026-01-15');

      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setDueDateRange(startDate, null);
      });

      expect(contextValue.filters.dueDateRange.start).toEqual(startDate);
      expect(contextValue.filters.dueDateRange.end).toBeNull();
    });
  });

  describe('setTagFilters', () => {
    it('replaces all tag filters', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setTagFilters(['tag1', 'tag2']);
      });

      expect(contextValue.filters.tags).toEqual(['tag1', 'tag2']);
    });

    it('can set tags to empty array', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setTagFilters(['tag1']);
        contextValue.setTagFilters([]);
      });

      expect(contextValue.filters.tags).toEqual([]);
    });
  });

  describe('addTagFilter', () => {
    it('adds a tag to filters', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.addTagFilter('tag1');
      });

      expect(contextValue.filters.tags).toContain('tag1');
    });

    it('does not add duplicate tags', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.addTagFilter('tag1');
        contextValue.addTagFilter('tag1');
      });

      expect(contextValue.filters.tags).toEqual(['tag1']);
    });
  });

  describe('removeTagFilter', () => {
    it('removes a tag from filters', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setTagFilters(['tag1', 'tag2']);
        contextValue.removeTagFilter('tag1');
      });

      expect(contextValue.filters.tags).not.toContain('tag1');
      expect(contextValue.filters.tags).toContain('tag2');
    });
  });

  describe('setClientFilter preserves other filters', () => {
    it('preserves search query and other filters when client changes', () => {
      let contextValue: any;
      render(
        <FilterProvider>
          <TestComponent onContextValue={(value) => { contextValue = value; }} />
        </FilterProvider>
      );

      act(() => {
        contextValue.setSearchQuery('test');
        contextValue.setBillableFilter(true);
        contextValue.setPriorityFilter('high');
        contextValue.setTagFilters(['tag1']);
        contextValue.setClientFilter('client-1');
      });

      expect(contextValue.filters.clientId).toBe('client-1');
      expect(contextValue.filters.projectId).toBeNull(); // Should reset
      expect(contextValue.filters.searchQuery).toBe('test'); // Should preserve
      expect(contextValue.filters.billableStatus).toBe(true); // Should preserve
      expect(contextValue.filters.priority).toBe('high'); // Should preserve
      expect(contextValue.filters.tags).toEqual(['tag1']); // Should preserve
    });
  });
});
