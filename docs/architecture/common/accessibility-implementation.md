# Accessibility Implementation

## Accessibility Standards (WCAG 2.1 AA Compliance)

**Semantic HTML Usage:**
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- Use proper heading hierarchy (`<h1>` through `<h6>`)
- Use `<label>` elements for form inputs
- Use `<fieldset>` and `<legend>` for grouped form controls

**ARIA Implementation Guidelines:**

1. **ARIA Labels:**
   ```typescript
   // For icon-only buttons
   <button aria-label="Start timer for task">
     <PlayIcon />
   </button>
   
   // For interactive elements without visible text
   <div role="button" aria-label="Close panel" tabIndex={0}>
     <CloseIcon />
   </div>
   ```

2. **ARIA Roles:**
   ```typescript
   // Kanban board
   <div role="region" aria-label="Kanban board">
     {columns.map(column => (
       <div role="group" aria-label={`${column.name} column`}>
         {/* Tasks */}
       </div>
     ))}
   </div>
   
   // Task card
   <div role="article" aria-labelledby={`task-${task.id}-title`}>
     <h3 id={`task-${task.id}-title`}>{task.title}</h3>
   </div>
   ```

3. **ARIA States:**
   ```typescript
   // Timer button state
   <button
     aria-pressed={isTimerActive}
     aria-label={isTimerActive ? "Stop timer" : "Start timer"}
   >
     {isTimerActive ? <StopIcon /> : <PlayIcon />}
   </button>
   
   // Task completion
   <div aria-checked={task.completed} role="checkbox">
     {/* Subtask */}
   </div>
   ```

4. **ARIA Live Regions:**
   ```typescript
   // For dynamic content updates
   <div role="status" aria-live="polite" aria-atomic="true">
     {notificationMessage}
   </div>
   
   // For timer updates
   <div role="timer" aria-live="off">
     {formatTime(elapsedTime)}
   </div>
   ```

**Keyboard Navigation Requirements:**

1. **Focus Management:**
   ```typescript
   // Focus trap for modals
   const Modal = ({ isOpen, onClose, children }) => {
     const modalRef = useRef<HTMLDivElement>(null);
     
     useEffect(() => {
       if (isOpen && modalRef.current) {
         const firstFocusable = modalRef.current.querySelector(
           'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
         ) as HTMLElement;
         firstFocusable?.focus();
       }
     }, [isOpen]);
     
     // Trap focus within modal
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Tab' && modalRef.current) {
         // Focus trap logic
       }
       if (e.key === 'Escape') {
         onClose();
       }
     };
   };
   
   // Restore focus after modal closes
   useEffect(() => {
     const previousActiveElement = document.activeElement as HTMLElement;
     return () => {
       previousActiveElement?.focus();
     };
   }, []);
   ```

2. **Keyboard Shortcuts:**
   - Document all keyboard shortcuts in settings
   - Provide visual indicators for available shortcuts
   - Allow users to customize shortcuts
   - Common shortcuts:
     - `Space`: Start/stop timer
     - `N`: Create new task
     - `Escape`: Close modals/panels
     - `Arrow keys`: Navigate between tasks
     - `Enter`: Activate focused element

3. **Focus Indicators:**
   ```css
   /* Visible focus indicators */
   *:focus-visible {
     outline: 2px solid theme('colors.blue.500');
     outline-offset: 2px;
   }
   
   /* Skip to main content link */
   .skip-link {
     position: absolute;
     left: -9999px;
     &:focus {
       left: 0;
       z-index: 9999;
     }
   }
   ```

**Screen Reader Compatibility:**

1. **Descriptive Text:**
   ```typescript
   // Provide context for screen readers
   <div>
     <span className="sr-only">Task: {task.title}</span>
     <span aria-hidden="true">{task.title}</span>
   </div>
   
   // Hide decorative icons from screen readers
   <div aria-hidden="true">
     <Icon />
   </div>
   ```

2. **Form Labels:**
   ```typescript
   // Always associate labels with inputs
   <label htmlFor="task-title">Task Title</label>
   <input id="task-title" type="text" />
   
   // Or use aria-labelledby
   <div id="task-title-label">Task Title</div>
   <input aria-labelledby="task-title-label" type="text" />
   ```

3. **Error Messages:**
   ```typescript
   <input
     aria-invalid={hasError}
     aria-describedby={hasError ? "error-message" : undefined}
   />
   {hasError && (
     <div id="error-message" role="alert">
       {errorMessage}
     </div>
   )}
   ```

**Color Contrast:**
- Ensure all text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information
- Use icons, text labels, or patterns in addition to color
- Test with color blindness simulators

**Drag-and-Drop Accessibility:**
- Provide keyboard alternative for drag-and-drop
- Use `aria-grabbed` and `aria-dropeffect` attributes
- Allow task movement via keyboard (arrow keys + Enter to move)

## Accessibility Testing

**Automated Testing Tools:**

1. **axe-core Integration:**
   ```typescript
   // Install: npm install --save-dev @axe-core/react
   import axe from '@axe-core/react';
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   
   if (process.env.NODE_ENV !== 'production') {
     axe(React, ReactDOM, 1000);
   }
   ```

2. **Jest Accessibility Testing:**
   ```typescript
   import { render } from '@testing-library/react';
   import { axe, toHaveNoViolations } from 'jest-axe';
   
   expect.extend(toHaveNoViolations);
   
   it('should not have accessibility violations', async () => {
     const { container } = render(<TaskCard task={mockTask} />);
     const results = await axe(container);
     expect(results).toHaveNoViolations();
   });
   ```

3. **Playwright Accessibility Testing:**
   ```typescript
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';
   
   test('should not have accessibility violations', async ({ page }) => {
     await page.goto('http://localhost:5173');
     const accessibilityScanResults = await new AxeBuilder({ page })
       .analyze();
     expect(accessibilityScanResults.violations).toEqual([]);
   });
   ```

**Manual Testing Procedures:**

1. **Keyboard Navigation Checklist:**
   - [ ] All interactive elements accessible via Tab key
   - [ ] Focus order is logical and intuitive
   - [ ] Focus indicators are clearly visible
   - [ ] All functionality available via keyboard
   - [ ] No keyboard traps
   - [ ] Escape key closes modals/panels
   - [ ] Enter/Space activates buttons and links

2. **Screen Reader Testing (NVDA/JAWS/VoiceOver):**
   - [ ] All content is announced correctly
   - [ ] Form labels are announced
   - [ ] Button purposes are clear
   - [ ] Dynamic content updates are announced
   - [ ] Error messages are announced
   - [ ] Navigation landmarks are identified

3. **Visual Testing:**
   - [ ] Test with browser zoom at 200%
   - [ ] Test with high contrast mode
   - [ ] Test with color blindness simulators
   - [ ] Verify text is readable at all sizes
   - [ ] Check focus indicators are visible

4. **Testing Checklist Integration:**
   - Add accessibility checks to CI/CD pipeline
   - Run automated tests on every PR
   - Perform manual testing before releases
   - Document any known issues and workarounds

**Compliance Targets:**
- **WCAG 2.1 Level AA** compliance required
- All critical user paths must be accessible
- Automated testing catches 80%+ of issues
- Manual testing validates remaining 20%
