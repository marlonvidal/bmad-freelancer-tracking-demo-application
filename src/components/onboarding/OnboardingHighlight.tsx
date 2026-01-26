import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface OnboardingHighlightProps {
  targetElement?: HTMLElement | null;
  children?: React.ReactNode;
  className?: string;
}

/**
 * OnboardingHighlight - Highlight overlay component for onboarding wizard
 * 
 * Dims background and highlights target element with a spotlight effect.
 * Creates a visual focus on the element being explained.
 */
export const OnboardingHighlight: React.FC<OnboardingHighlightProps> = ({
  targetElement,
  children,
  className = ''
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  // Update element rect when targetElement changes
  useEffect(() => {
    if (!targetElement) {
      setElementRect(null);
      return;
    }

    const updateRect = () => {
      const rect = targetElement.getBoundingClientRect();
      setElementRect(rect);
    };

    // Initial measurement
    updateRect();

    // Update on scroll/resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetElement]);

  // Memoize overlay style (only changes when elementRect changes)
  const overlayStyle = useMemo<React.CSSProperties>(() => ({
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 55
  }), []);

  // Memoize highlight style (only recalculates when elementRect changes)
  const highlightStyle = useMemo<React.CSSProperties>(() => {
    if (!elementRect) {
      return {};
    }

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    return {
      position: 'absolute',
      top: `${elementRect.top + scrollY}px`,
      left: `${elementRect.left + scrollX}px`,
      width: `${elementRect.width}px`,
      height: `${elementRect.height}px`,
      borderRadius: '8px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.8)',
      pointerEvents: 'none',
      zIndex: 56
    };
  }, [elementRect]);

  if (!targetElement) {
    return null;
  }

  const overlay = (
    <div
      className={`fixed inset-0 bg-black/50 dark:bg-black/70 ${className}`}
      style={overlayStyle}
      aria-hidden="true"
    >
      <div
        style={highlightStyle}
        className="transition-all duration-300"
        aria-hidden="true"
      />
      {children && (
        <div className="relative z-[57]">
          {children}
        </div>
      )}
    </div>
  );

  // Render in portal to ensure it's above other content
  return createPortal(overlay, document.body);
};
