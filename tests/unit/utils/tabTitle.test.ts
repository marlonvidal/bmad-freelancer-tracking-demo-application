describe('tabTitle utilities', () => {
  let originalTitle: string;
  let tabTitleUtils: typeof import('@/utils/tabTitle');

  beforeEach(async () => {
    originalTitle = document.title;
    document.title = 'Original Title';
    
    // Reset module to get fresh state
    jest.resetModules();
    tabTitleUtils = await import('@/utils/tabTitle');
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  describe('initTabTitle', () => {
    it('stores original title', () => {
      document.title = 'Test App';
      tabTitleUtils.initTabTitle();
      
      // Title should be stored (we can't directly test the module variable,
      // but we can test that restoreTabTitle works)
      tabTitleUtils.restoreTabTitle();
      expect(document.title).toBe('Test App');
    });
  });

  describe('updateTabTitle', () => {
    beforeEach(() => {
      document.title = 'Original Title';
      tabTitleUtils.initTabTitle();
    });

    it('updates title when timer is active with task title', () => {
      tabTitleUtils.updateTabTitle(true, 'My Task', 120);

      expect(document.title).toContain('⏱');
      expect(document.title).toContain('My Task');
      expect(document.title).toContain('Kanban Tracker');
    });

    it('updates title when timer is active with elapsed time', () => {
      tabTitleUtils.updateTabTitle(true, undefined, 3660); // 1 hour 1 minute

      expect(document.title).toContain('⏱');
      expect(document.title).toContain('Kanban Tracker');
    });

    it('restores original title when timer is inactive', () => {
      tabTitleUtils.updateTabTitle(true, 'Task', 60);
      expect(document.title).toContain('⏱');

      tabTitleUtils.updateTabTitle(false);
      expect(document.title).toBe('Original Title');
    });

    it('handles badge API when available', () => {
      const setAppBadgeSpy = jest.fn().mockResolvedValue(undefined);
      const clearAppBadgeSpy = jest.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'setAppBadge', {
        writable: true,
        configurable: true,
        value: setAppBadgeSpy,
      });

      Object.defineProperty(navigator, 'clearAppBadge', {
        writable: true,
        configurable: true,
        value: clearAppBadgeSpy,
      });

      tabTitleUtils.updateTabTitle(true, undefined, 120); // 2 minutes

      expect(setAppBadgeSpy).toHaveBeenCalledWith(2);

      tabTitleUtils.updateTabTitle(false);
      expect(clearAppBadgeSpy).toHaveBeenCalled();
    });

    it('handles badge API errors gracefully', () => {
      const setAppBadgeSpy = jest.fn().mockRejectedValue(new Error('Badge failed'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      Object.defineProperty(navigator, 'setAppBadge', {
        writable: true,
        configurable: true,
        value: setAppBadgeSpy,
      });

      tabTitleUtils.updateTabTitle(true, undefined, 60);

      // Should not throw
      expect(setAppBadgeSpy).toHaveBeenCalled();
      
      // Wait for promise rejection
      return new Promise(resolve => {
        setTimeout(() => {
          expect(consoleWarnSpy).toHaveBeenCalled();
          consoleWarnSpy.mockRestore();
          resolve(undefined);
        }, 10);
      });
    });

    it('works without badge API support', () => {
      // Remove badge API
      delete (navigator as any).setAppBadge;
      delete (navigator as any).clearAppBadge;

      // Should not throw
      tabTitleUtils.updateTabTitle(true, 'Task', 60);
      expect(document.title).toContain('⏱');

      tabTitleUtils.updateTabTitle(false);
      expect(document.title).toBe('Original Title');
    });
  });

  describe('restoreTabTitle', () => {
    beforeEach(() => {
      document.title = 'Original Title';
      tabTitleUtils.initTabTitle();
    });

    it('restores original title', () => {
      tabTitleUtils.updateTabTitle(true, 'Task', 60);
      expect(document.title).toContain('⏱');

      tabTitleUtils.restoreTabTitle();
      expect(document.title).toBe('Original Title');
    });

    it('clears badge when available', () => {
      const clearAppBadgeSpy = jest.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'clearAppBadge', {
        writable: true,
        configurable: true,
        value: clearAppBadgeSpy,
      });

      tabTitleUtils.restoreTabTitle();
      expect(clearAppBadgeSpy).toHaveBeenCalled();
    });
  });
});
