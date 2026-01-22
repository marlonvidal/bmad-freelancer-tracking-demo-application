import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from '@/hooks/usePageVisibility';

describe('usePageVisibility', () => {
  let originalHidden: boolean;
  let originalVisibilityState: DocumentVisibilityState;

  beforeEach(() => {
    // Store original values
    originalHidden = document.hidden;
    originalVisibilityState = document.visibilityState;

    // Mock document.hidden and visibilityState
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });

    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: originalHidden,
    });

    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: originalVisibilityState,
    });
  });

  it('returns visible status initially when document is not hidden', () => {
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current.isVisible).toBe(true);
    expect(result.current.visibilityState).toBe('visible');
  });

  it('returns hidden status initially when document is hidden', () => {
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: true,
    });

    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'hidden',
    });

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.visibilityState).toBe('hidden');
  });

  it('updates when visibility changes to hidden', () => {
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current.isVisible).toBe(true);

    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'hidden',
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.visibilityState).toBe('hidden');
  });

  it('updates when visibility changes to visible', () => {
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current.isVisible).toBe(false);

    act(() => {
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: false,
      });

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        configurable: true,
        value: 'visible',
      });

      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.visibilityState).toBe('visible');
  });

  it('handles prerender state', () => {
    Object.defineProperty(document, 'hidden', {
      writable: true,
      configurable: true,
      value: true,
    });

    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      configurable: true,
      value: 'prerender',
    });

    const { result } = renderHook(() => usePageVisibility());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.visibilityState).toBe('prerender');
  });

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => usePageVisibility());

    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('handles browsers without Page Visibility API support', () => {
    // Remove visibilityState property
    const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    if (originalVisibilityState) {
      delete (document as any).visibilityState;
    }

    const { result } = renderHook(() => usePageVisibility());

    // Should default to visible when API not supported
    expect(result.current.isVisible).toBe(true);
    expect(result.current.visibilityState).toBe('visible');

    // Restore if it existed
    if (originalVisibilityState) {
      Object.defineProperty(document, 'visibilityState', originalVisibilityState);
    }
  });
});
