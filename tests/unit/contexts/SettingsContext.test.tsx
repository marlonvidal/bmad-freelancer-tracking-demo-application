import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SettingsProvider, useSettingsContext } from '@/contexts/SettingsContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';

// Test component that uses the context
const TestComponent: React.FC<{ onContextValue?: (value: any) => void }> = ({ onContextValue }) => {
  const context = useSettingsContext();
  
  React.useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);

  return (
    <div>
      {context.loading && <div data-testid="loading">Loading...</div>}
      {context.error && <div data-testid="error">{context.error.message}</div>}
      {context.settings && (
        <div>
          <div data-testid="default-billable-status">
            {context.getDefaultBillableStatus() ? 'true' : 'false'}
          </div>
          <div data-testid="dark-mode">{context.settings.darkMode ? 'true' : 'false'}</div>
          <div data-testid="is-dark-mode">{context.isDarkMode() ? 'true' : 'false'}</div>
        </div>
      )}
    </div>
  );
};

describe('SettingsContext', () => {
  beforeEach(async () => {
    // Ensure database is open and schema is up to date
    await db.open();
    await db.settings.clear();
  });

  describe('SettingsProvider', () => {
    it('provides context value to children', () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('throws error when useSettingsContext is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSettingsContext must be used within a SettingsProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('initialization', () => {
    it('loads settings from IndexedDB on mount', async () => {
      // Settings should be created automatically if they don't exist
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('default-billable-status')).toBeInTheDocument();
    });

    it('creates default settings if they do not exist', async () => {
      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const defaultBillableStatus = screen.getByTestId('default-billable-status');
      expect(defaultBillableStatus).toHaveTextContent('false');
    });
  });

  describe('getDefaultBillableStatus', () => {
    it('returns default billable status from settings', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({ defaultBillableStatus: true });

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const defaultBillableStatus = screen.getByTestId('default-billable-status');
      expect(defaultBillableStatus).toHaveTextContent('true');
    });

    it('returns false when settings are not loaded', () => {
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <SettingsProvider>
          <TestComponent onContextValue={onContextValue} />
        </SettingsProvider>
      );

      // Before settings load, should return false
      expect(contextValue.getDefaultBillableStatus()).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('updates settings successfully', async () => {
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <SettingsProvider>
          <TestComponent onContextValue={onContextValue} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(contextValue.settings).not.toBeNull();
      });

      await act(async () => {
        await contextValue.updateSettings({ defaultBillableStatus: true });
      });

      await waitFor(() => {
        expect(contextValue.settings?.defaultBillableStatus).toBe(true);
      });

      // Verify persistence
      const repository = new SettingsRepository();
      const settings = await repository.getSettings();
      expect(settings.defaultBillableStatus).toBe(true);
    });

    it('uses optimistic update', async () => {
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <SettingsProvider>
          <TestComponent onContextValue={onContextValue} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(contextValue?.settings).not.toBeNull();
      });

      const originalDarkMode = contextValue.settings.darkMode;

      // Start update (don't await yet)
      const updatePromise = contextValue.updateSettings({ darkMode: !originalDarkMode });

      // Check optimistic update immediately (before promise resolves)
      await waitFor(() => {
        expect(contextValue.settings?.darkMode).toBe(!originalDarkMode);
      }, { timeout: 1000 });

      // Wait for update to complete
      await act(async () => {
        await updatePromise;
      });

      // Verify final state
      expect(contextValue.settings?.darkMode).toBe(!originalDarkMode);
    });

    it('reverts on error', async () => {
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <SettingsProvider>
          <TestComponent onContextValue={onContextValue} />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(contextValue?.settings).not.toBeNull();
      });

      const originalDarkMode = contextValue.settings.darkMode;

      // Mock SettingsRepository.prototype.updateSettings to throw error
      const originalUpdate = SettingsRepository.prototype.updateSettings;
      jest.spyOn(SettingsRepository.prototype, 'updateSettings').mockRejectedValueOnce(new Error('Update failed'));

      try {
        await act(async () => {
          await contextValue.updateSettings({ darkMode: !originalDarkMode });
        });
      } catch (error) {
        // Expected to throw
      }

      // Should revert to original value after error
      await waitFor(() => {
        expect(contextValue.settings?.darkMode).toBe(originalDarkMode);
      }, { timeout: 2000 });

      // Restore original method
      jest.restoreAllMocks();
    });
  });

  describe('error handling', () => {
    it('handles loading errors', async () => {
      // Mock SettingsRepository.prototype.getSettings to throw error
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockRejectedValueOnce(new Error('Load failed'));

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByText('Load failed')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Restore original method
      jest.restoreAllMocks();
    });
  });

  describe('settings state', () => {
    it('provides loading state', () => {
      // Mock getSettings to delay resolution so we can catch loading state
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: 'default',
          darkMode: false,
          defaultBillableStatus: false,
          defaultHourlyRate: null,
          keyboardShortcuts: {},
          onboardingCompleted: false,
          updatedAt: new Date()
        }), 100))
      );

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      // Should show loading state initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Restore original method
      jest.restoreAllMocks();
    });

    it('provides error state', async () => {
      // Mock SettingsRepository.prototype.getSettings to throw error
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockRejectedValueOnce(new Error('Test error'));

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Restore original method
      jest.restoreAllMocks();
    });
  });

  describe('dark mode methods', () => {
    describe('isDarkMode', () => {
      it('returns false when dark mode is disabled', async () => {
        const repository = new SettingsRepository();
        await repository.updateSettings({ darkMode: false });

        render(
          <SettingsProvider>
            <TestComponent />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('is-dark-mode')).toHaveTextContent('false');
      });

      it('returns true when dark mode is enabled', async () => {
        const repository = new SettingsRepository();
        await repository.updateSettings({ darkMode: true });

        render(
          <SettingsProvider>
            <TestComponent />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('is-dark-mode')).toHaveTextContent('true');
      });

      it('returns false when settings are not loaded', () => {
        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        // Before settings load, should return false
        expect(contextValue.isDarkMode()).toBe(false);
      });

      it('reflects changes after settings update', async () => {
        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        // Initially false
        expect(contextValue.isDarkMode()).toBe(false);

        // Update to true
        await act(async () => {
          await contextValue.updateSettings({ darkMode: true });
        });

        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(true);
        });

        // Update back to false
        await act(async () => {
          await contextValue.updateSettings({ darkMode: false });
        });

        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(false);
        });
      });
    });

    describe('toggleDarkMode', () => {
      it('toggles dark mode from false to true', async () => {
        const repository = new SettingsRepository();
        await repository.updateSettings({ darkMode: false });

        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        expect(contextValue.isDarkMode()).toBe(false);

        await act(async () => {
          await contextValue.toggleDarkMode();
        });

        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(true);
        });

        // Verify persistence
        const settings = await repository.getSettings();
        expect(settings.darkMode).toBe(true);
      });

      it('toggles dark mode from true to false', async () => {
        const repository = new SettingsRepository();
        await repository.updateSettings({ darkMode: true });

        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        expect(contextValue.isDarkMode()).toBe(true);

        await act(async () => {
          await contextValue.toggleDarkMode();
        });

        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(false);
        });

        // Verify persistence
        const settings = await repository.getSettings();
        expect(settings.darkMode).toBe(false);
      });

      it('persists toggle across component remounts', async () => {
        const repository = new SettingsRepository();
        await repository.updateSettings({ darkMode: false });

        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        const { unmount } = render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        // Toggle to true
        await act(async () => {
          await contextValue.toggleDarkMode();
        });

        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(true);
        });

        // Unmount and remount
        unmount();

        let newContextValue: any;
        const onNewContextValue = (value: any) => {
          newContextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onNewContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(newContextValue?.settings).not.toBeNull();
        });

        // Should still be true after remount
        expect(newContextValue.isDarkMode()).toBe(true);
      });

      it('throws error when settings are not loaded', async () => {
        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        // Before settings load
        await expect(async () => {
          await act(async () => {
            await contextValue.toggleDarkMode();
          });
        }).rejects.toThrow('Settings not loaded');
      });

      it('uses optimistic update', async () => {
        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        const originalDarkMode = contextValue.isDarkMode();

        // Start toggle (don't await yet)
        const togglePromise = contextValue.toggleDarkMode();

        // Check optimistic update immediately (before promise resolves)
        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(!originalDarkMode);
        }, { timeout: 1000 });

        // Wait for toggle to complete
        await act(async () => {
          await togglePromise;
        });

        // Verify final state
        expect(contextValue.isDarkMode()).toBe(!originalDarkMode);
      });

      it('reverts on error', async () => {
        let contextValue: any;
        const onContextValue = (value: any) => {
          contextValue = value;
        };

        render(
          <SettingsProvider>
            <TestComponent onContextValue={onContextValue} />
          </SettingsProvider>
        );

        await waitFor(() => {
          expect(contextValue?.settings).not.toBeNull();
        });

        const originalDarkMode = contextValue.isDarkMode();

        // Mock SettingsRepository.prototype.updateSettings to throw error
        jest.spyOn(SettingsRepository.prototype, 'updateSettings').mockRejectedValueOnce(
          new Error('Toggle failed')
        );

        try {
          await act(async () => {
            await contextValue.toggleDarkMode();
          });
        } catch (error) {
          // Expected to throw
        }

        // Should revert to original value after error
        await waitFor(() => {
          expect(contextValue.isDarkMode()).toBe(originalDarkMode);
        }, { timeout: 2000 });

        // Restore original method
        jest.restoreAllMocks();
      });
    });
  });
});
