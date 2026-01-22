# Animation & Micro-interactions

## Motion Principles

**Core Philosophy:**
Animations in FreelanceFlow should enhance usability and provide clear feedback without distracting from productivity. Every animation serves a purpose: confirming actions, guiding attention, or providing context for state changes.

**Design Principles:**
1. **Purposeful Motion:** Every animation must have a clear purpose (feedback, guidance, or context)
2. **Performance First:** Animations must maintain 60fps, even on lower-end devices
3. **Respect User Preferences:** Honor `prefers-reduced-motion` media query for accessibility
4. **Subtle but Clear:** Animations should be noticeable but not distracting
5. **Consistent Timing:** Use consistent durations and easing functions throughout
6. **Spatial Relationships:** Animations should reinforce spatial relationships (e.g., task moving between columns)

**Animation Guidelines:**
- **Duration:** Most animations should be 200-300ms (quick enough to feel responsive, slow enough to be perceived)
- **Easing:** Use ease-out or custom cubic-bezier for natural feel (objects accelerate quickly, decelerate smoothly)
- **Reduced Motion:** Provide instant transitions or very subtle animations when `prefers-reduced-motion` is enabled
- **Performance:** Use CSS transforms and opacity for animations (GPU-accelerated), avoid animating layout properties
- **Feedback:** Provide immediate visual feedback (within 100ms) for all user interactions

## Key Animations

### Task Card Drag-and-Drop

**Animation:** Smooth translation and elevation change when dragging task cards between columns

**Description:** When user initiates drag on task card, card elevates slightly and follows cursor. When dragged over valid drop zone, column highlights. On drop, card animates to final position in target column.

**Duration:** 200-300ms for drop animation
**Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard easing)
**Properties:** Transform (translate), opacity (slight reduction during drag), box-shadow (elevation increase)

**States:**
- **Drag Start:** Scale to 1.05x, increase shadow, reduce opacity to 0.9
- **Dragging:** Follow cursor smoothly, maintain elevation
- **Drop Target Valid:** Column background highlight (subtle color tint)
- **Drop Target Invalid:** Red border flash, shake animation
- **Drop Complete:** Smooth transition to final position, return to normal scale/opacity

**Accessibility:** Respect `prefers-reduced-motion` - use instant position change or very subtle animation

---

### Timer Start/Stop

**Animation:** Visual feedback when timer starts or stops on task card

**Description:** When timer starts, play icon changes to pause icon with smooth transition. Task card border pulses or changes color to indicate active state. When timer stops, reverse animation.

**Duration:** 200ms for icon change, 2s for pulsing animation (looping)
**Easing:** `ease-out` for icon change, `ease-in-out` for pulsing
**Properties:** Icon transform/opacity, border color, background color (subtle tint)

**States:**
- **Start:** Play icon rotates/fades to pause icon, border color changes to accent color (green)
- **Running:** Subtle pulsing border animation (2s loop), optional background tint
- **Stop:** Pause icon changes back to play icon, border returns to normal, pulsing stops

**Accessibility:** Ensure color change is accompanied by icon change (not color-only indication)

---

### Task Creation

**Animation:** New task card appears in column with smooth entrance animation

**Description:** When task is created, card fades in and slides up slightly from its position in the column. Brief highlight animation draws attention to new task.

**Duration:** 300ms for entrance, 1s for highlight pulse
**Easing:** `ease-out` for entrance, `ease-in-out` for highlight
**Properties:** Opacity (0 to 1), transform (translateY -10px to 0), background color (highlight flash)

**States:**
- **Initial:** Invisible (opacity 0), slightly above final position
- **Entrance:** Fade in and slide down to final position
- **Highlight:** Brief background color flash (subtle green tint) to draw attention
- **Final:** Normal card appearance

**Accessibility:** Respect `prefers-reduced-motion` - use instant appearance or very subtle fade

---

### Modal Open/Close

**Animation:** Modal appears and disappears with smooth fade and scale animation

**Description:** When modal opens, backdrop fades in while modal scales up slightly and fades in. Reverse animation on close.

**Duration:** 200ms for modal, 150ms for backdrop
**Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)` for modal, `ease-out` for backdrop
**Properties:** Opacity, transform (scale 0.95 to 1.0), backdrop opacity

**States:**
- **Opening:** Backdrop fades in (opacity 0 to 0.5), modal scales from 0.95 to 1.0 and fades in
- **Closing:** Reverse animation (modal scales down and fades out, backdrop fades out)
- **Open:** Modal at full opacity and scale, backdrop visible

**Accessibility:** Respect `prefers-reduced-motion` - use instant appearance

---

### Toast Notification

**Animation:** Toast slides in from top-right, displays, then slides out

**Description:** Toast notification slides in from off-screen (top-right), displays for 3-5 seconds, then slides out. Multiple toasts stack vertically.

**Duration:** 300ms for slide in, 200ms for slide out
**Easing:** `ease-out` for slide in, `ease-in` for slide out
**Properties:** Transform (translateX from 100% to 0), opacity

**States:**
- **Entering:** Slide in from right (translateX 100% to 0), fade in
- **Visible:** Full opacity, normal position
- **Exiting:** Slide out to right (translateX 0 to 100%), fade out
- **Stacking:** Subsequent toasts push previous toasts up

**Accessibility:** Announce to screen readers, respect `prefers-reduced-motion`

---

### Button Hover/Press

**Animation:** Subtle scale and elevation change on button interaction

**Description:** Button slightly scales up on hover, scales down on press. Shadow increases on hover for elevation feedback.

**Duration:** 150ms for hover, 100ms for press
**Easing:** `ease-out` for hover, `ease-in` for press
**Properties:** Transform (scale), box-shadow

**States:**
- **Default:** Normal scale (1.0), standard shadow
- **Hover:** Scale to 1.02x, increase shadow
- **Active/Press:** Scale to 0.98x, reduce shadow
- **Focus:** Outline ring appears (accessibility)

**Accessibility:** Ensure focus ring is clearly visible, don't rely solely on hover for functionality

---

### Column Drop Zone Highlight

**Animation:** Column background highlights when dragging task over valid drop zone

**Description:** When task is dragged over valid column, column background subtly highlights with accent color tint. Invalid drop zones show red border flash.

**Duration:** 150ms for highlight, 200ms for invalid flash
**Easing:** `ease-out` for highlight, `ease-in-out` for flash
**Properties:** Background color (subtle tint), border color (for invalid)

**States:**
- **Default:** Normal column background
- **Valid Drop Zone:** Subtle green/blue background tint (opacity 0.1)
- **Invalid Drop Zone:** Red border flash, shake animation
- **No Drop Zone:** Return to normal

**Accessibility:** Ensure visual feedback is clear, consider adding text indicator ("Drop here")

---

### Task Card Hover

**Animation:** Subtle elevation increase and scale on task card hover

**Description:** When hovering over task card, card slightly elevates (increased shadow) and scales up minimally. Provides clear feedback that card is interactive.

**Duration:** 200ms
**Easing:** `ease-out`
**Properties:** Transform (scale 1.0 to 1.02x), box-shadow (elevation increase)

**States:**
- **Default:** Normal elevation, scale 1.0
- **Hover:** Increased shadow, scale 1.02x
- **Focus:** Outline ring (keyboard navigation)

**Accessibility:** Ensure focus state is as prominent as hover state, don't rely solely on hover

---

### Loading States

**Animation:** Skeleton screens or loading spinners for async operations

**Description:** When loading data (tasks, clients, etc.), show skeleton screens that match content structure or subtle loading spinner. Prevents layout shift and provides feedback.

**Duration:** Skeleton pulse: 1.5s loop, Spinner: 1s rotation loop
**Easing:** `ease-in-out` for pulse, `linear` for spinner rotation
**Properties:** Opacity (pulse), transform (rotate for spinner)

**States:**
- **Loading:** Skeleton content pulses or spinner rotates
- **Loaded:** Content fades in, skeleton/spinner fades out
- **Error:** Show error state with retry option

**Accessibility:** Announce loading state to screen readers, provide progress indication if possible

## Animation Performance

**Performance Guidelines:**
- Use CSS `transform` and `opacity` properties (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding` (causes layout reflow)
- Use `will-change` property sparingly (only for elements that will animate)
- Test animations on lower-end devices to ensure 60fps
- Provide option to disable animations for users who prefer reduced motion

**Reduced Motion Support:**
- Honor `prefers-reduced-motion` media query
- When enabled: Use instant transitions or very subtle animations (duration < 100ms)
- Ensure all functionality works without animations
- Test with reduced motion enabled to verify usability

**Browser Compatibility:**
- Use CSS animations and transitions (widely supported)
- Provide fallbacks for older browsers (instant transitions)
- Test in major browsers (Chrome, Firefox, Safari, Edge)
