// Mock workbox-window before importing the module
jest.mock('workbox-window', () => {
  const mockWorkbox = {
    register: jest.fn().mockResolvedValue({}),
    addEventListener: jest.fn(),
    messageSkipWaiting: jest.fn(),
    update: jest.fn(),
  };

  return {
    Workbox: jest.fn().mockImplementation(() => mockWorkbox),
  };
});

import { registerServiceWorker, unregisterServiceWorker, getServiceWorkerRegistration } from '@/utils/serviceWorker';

describe('serviceWorker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: jest.fn(),
        getRegistration: jest.fn(),
      },
    });

    // Mock window.isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  describe('registerServiceWorker', () => {
    it('returns null if Service Worker is not supported', async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();

      // Restore
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: originalSW,
      });
    });

    it('returns null if not in secure context', async () => {
      const originalSecure = window.isSecureContext;
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: false,
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();

      // Restore
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: originalSecure,
      });
    });

    it('registers Service Worker when supported', async () => {
      // Ensure serviceWorker is available
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          register: jest.fn(),
          getRegistration: jest.fn(),
        },
      });
      Object.defineProperty(window, 'isSecureContext', {
        writable: true,
        configurable: true,
        value: true,
      });

      const result = await registerServiceWorker();
      expect(result).not.toBeNull();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('returns false if Service Worker is not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });

    it('unregisters Service Worker when registration exists', async () => {
      const mockUnregister = jest.fn().mockResolvedValue(true);
      (navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue({
        unregister: mockUnregister,
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(true);
      expect(mockUnregister).toHaveBeenCalled();
    });

    it('returns false when no registration exists', async () => {
      (navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue(null);

      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });
  });

  describe('getServiceWorkerRegistration', () => {
    it('returns null if Service Worker is not supported', async () => {
      const originalSW = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const result = await getServiceWorkerRegistration();
      expect(result).toBeNull();

      // Restore
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: originalSW,
      });
    });

    it('returns registration when available', async () => {
      const mockRegistration = { active: {} };
      (navigator.serviceWorker.getRegistration as jest.Mock).mockResolvedValue(mockRegistration);

      const result = await getServiceWorkerRegistration();
      expect(result).toBe(mockRegistration);
    });
  });
});
