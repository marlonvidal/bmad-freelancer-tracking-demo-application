import React from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface OnboardingTooltipProps {
  children: React.ReactNode;
  position?: TooltipPosition;
  targetElement?: HTMLElement | null;
  className?: string;
}

/**
 * OnboardingTooltip - Tooltip component for onboarding wizard
 * 
 * Displays a tooltip pointing to UI elements during onboarding.
 * Supports positioning and arrow/pointer to target element.
 */
export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  children,
  position = 'bottom',
  targetElement,
  className = ''
}) => {
  // Calculate position relative to target element if provided
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top + scrollY - 10;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + scrollY + 10;
          left = rect.left + scrollX + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.left + scrollX - 10;
          break;
        case 'right':
          top = rect.top + scrollY + rect.height / 2;
          left = rect.right + scrollX + 10;
          break;
      }

      setTooltipStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        transform: position === 'top' || position === 'bottom' 
          ? 'translateX(-50%)' 
          : 'translateY(-50%)'
      });
    }
  }, [targetElement, position]);

  const arrowClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100',
    bottom: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100',
    left: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100',
    right: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100'
  }[position];

  const arrowStyle = {
    top: position === 'bottom' ? '-6px' : undefined,
    bottom: position === 'top' ? '-6px' : undefined,
    left: position === 'right' ? '-6px' : undefined,
    right: position === 'left' ? '-6px' : undefined
  };

  return (
    <div
      style={tooltipStyle}
      className={`bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs z-[60] ${className}`}
      role="tooltip"
      aria-live="polite"
    >
      {children}
      {targetElement && (
        <div
          className={`absolute w-0 h-0 border-8 border-transparent ${arrowClass}`}
          style={arrowStyle}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
