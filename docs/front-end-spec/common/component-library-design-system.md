# Component Library / Design System

## Design System Approach

**Strategy:** Build a custom design system optimized for FreelanceFlow's specific needs, drawing inspiration from established patterns (Material Design, Tailwind UI) but tailored for desktop-first kanban workflows.

**Rationale:** 
- Custom system allows precise control over freelancer-specific components (task cards, timers, revenue indicators)
- Desktop-first optimization requires different spacing, sizing, and interaction patterns than mobile-first systems
- Local-first architecture means we can optimize for performance without external design system dependencies

**Design Tokens Structure:**
- Colors (semantic naming: primary, success, warning, error, neutral)
- Typography (font families, sizes, weights, line heights)
- Spacing (consistent scale: 4px base unit)
- Shadows (elevation system)
- Border radius (consistent rounding)
- Animation durations and easing functions

**Component Categories:**
1. **Foundation:** Colors, typography, spacing, shadows
2. **Layout:** Container, grid, column, card
3. **Navigation:** Top bar, breadcrumbs, menu
4. **Forms:** Input, select, checkbox, toggle, button
5. **Data Display:** Task card, tag/pill, metric display, time display
6. **Feedback:** Toast notifications, loading states, empty states
7. **Overlay:** Modal, dropdown, tooltip

## Core Components

### Task Card

**Purpose:** Primary data display component showing task information, time tracking, and quick actions in a compact, scannable format.

**Variants:**
- **Default:** Standard task card with all information visible
- **Compact:** Reduced padding/spacing for dense views
- **Expanded:** Shows additional details (description preview, subtasks count)
- **Active Timer:** Visual distinction when timer is running (accent border, pulsing indicator)

**States:**
- **Default:** White background, subtle border, standard elevation
- **Hover:** Increased shadow, slight scale (1.02x), cursor pointer
- **Selected:** Accent border, background tint
- **Dragging:** Elevated shadow, reduced opacity (0.8), cursor grabbing
- **Timer Active:** Accent color border (green/blue), pulsing animation
- **Disabled:** Reduced opacity (0.5), no interactions

**Usage Guidelines:**
- Use consistent card height for visual rhythm (minimum height: ~120px)
- Maintain consistent spacing between cards (12-16px)
- Ensure all interactive elements have adequate touch targets (minimum 44x44px)
- Support keyboard navigation (focusable, arrow key movement)
- Provide clear visual feedback for all state changes

**Key Elements:**
- Task title (truncate with ellipsis if too long)
- Client/project tag (color-coded pill)
- Priority tag (color-coded pill: red=high, orange=medium, grey=low)
- Timer control (play/pause button with time display)
- Revenue indicator (green $ pill with amount)
- Due date (calendar icon + date)
- Billable indicator (green $ or "Non-billable" badge)

---

### Tag/Pill Component

**Purpose:** Compact, color-coded labels for categorizing tasks (client, priority, status).

**Variants:**
- **Client Tag:** Light background with colored text (e.g., light green for Acme Corp, light purple for TechStart)
- **Priority Tag:** Color-coded by priority level
  - High: Red background, white text
  - Medium: Orange background, white text
  - Low: Light grey background, dark text
- **Status Tag:** Indicates task status (e.g., "Non-billable" grey pill)
- **Revenue Tag:** Green background with dollar amount

**States:**
- **Default:** Standard appearance
- **Hover:** Slight scale (1.05x), show tooltip if truncated
- **Clickable:** Cursor pointer, show active state
- **Selected:** Accent border or background tint

**Usage Guidelines:**
- Use consistent height (24-28px) for visual alignment
- Limit text length (truncate with ellipsis if needed)
- Maintain sufficient color contrast (WCAG AA minimum)
- Use semantic colors (red=danger/high priority, green=success/revenue, grey=neutral)
- Group related tags together (client + priority)

**Color Specifications:**
- **Client Tags:** Light backgrounds (lightness 90-95%), colored text (saturation 60-80%)
- **Priority High:** Red (#EF4444 or similar), white text
- **Priority Medium:** Orange (#F97316 or similar), white text
- **Priority Low:** Grey (#9CA3AF or similar), dark text
- **Revenue:** Green (#10B981 or similar), white text

---

### Timer Control

**Purpose:** Interactive component for starting, stopping, and displaying time tracking on task cards.

**Variants:**
- **Start State:** Play icon (triangle) + "Start" label + time display
- **Running State:** Pause/stop icon + elapsed time (updating) + visual indicator
- **Paused State:** Play icon + accumulated time (static) + "Resume" label
- **Compact:** Icon only (for space-constrained views)

**States:**
- **Default:** Black icon, standard text
- **Hover:** Slight scale (1.1x), accent color
- **Active/Running:** Accent color (green/blue), pulsing animation
- **Disabled:** Grey, no interaction

**Usage Guidelines:**
- Always show current time state (0h 0m if not started)
- Display both elapsed time and estimated time when available
- Provide clear visual feedback when timer starts/stops
- Support keyboard activation (Space bar to start/pause)
- Show tooltip on hover with full time details

**Visual Specifications:**
- Icon size: 16-20px
- Time display: Monospace font for consistent width
- Active indicator: Pulsing border or background animation (2s duration)
- Color: Green (#10B981) when active, black/grey when inactive

---

### Button Component

**Purpose:** Primary and secondary action triggers throughout the application.

**Variants:**
- **Primary:** High emphasis (e.g., "+ Add task" button - black background, white text)
- **Secondary:** Medium emphasis (e.g., "Cancel", "Save" - outlined or grey background)
- **Tertiary:** Low emphasis (text-only buttons, icon buttons)
- **Icon Button:** Icon-only with tooltip (e.g., column "+", menu "...")

**States:**
- **Default:** Standard appearance
- **Hover:** Increased elevation/shadow, slight scale (1.02x)
- **Active/Pressed:** Reduced elevation, slight scale (0.98x)
- **Focus:** Outline ring (accessibility requirement)
- **Disabled:** Reduced opacity (0.5), no interaction
- **Loading:** Spinner icon, disabled state

**Usage Guidelines:**
- Primary buttons: Use sparingly (1-2 per screen maximum)
- Maintain consistent sizing (height: 40-44px for primary actions)
- Ensure adequate spacing between buttons (16px minimum)
- Support keyboard activation (Enter/Space)
- Provide clear loading states for async actions

**Size Specifications:**
- **Large:** Height 44px, padding 16px 24px (primary actions)
- **Medium:** Height 36px, padding 12px 20px (secondary actions)
- **Small:** Height 32px, padding 8px 16px (tertiary actions)
- **Icon Only:** 40x40px square (touch target minimum)

---

### Input Component

**Purpose:** Text input fields for forms and inline editing.

**Variants:**
- **Text Input:** Standard single-line text input
- **Textarea:** Multi-line text input (task description)
- **Number Input:** Numeric input with validation (hourly rate, time estimates)
- **Date Picker:** Date selection input (due dates)
- **Select/Dropdown:** Single selection from options (client, priority, column)

**States:**
- **Default:** Standard border, white background
- **Focus:** Accent border color, subtle shadow
- **Error:** Red border, error message below
- **Disabled:** Grey background, reduced opacity
- **Read-only:** Grey background, no border

**Usage Guidelines:**
- Provide clear labels (above or as placeholder)
- Show validation errors inline below input
- Support keyboard navigation (Tab, Enter, Escape)
- Auto-focus first input in forms
- Format inputs appropriately (currency, time, date)

**Visual Specifications:**
- Height: 40px for standard inputs
- Border: 1-2px solid, border-radius 6-8px
- Padding: 12px horizontal, 10px vertical
- Focus ring: 2-3px accent color outline, 2px offset

---

### Metric Display Component

**Purpose:** Display key metrics in top navigation (Total Revenue, Billable Hours).

**Variants:**
- **Revenue Metric:** Green dollar icon + label + value (highlighted in green)
- **Time Metric:** Line graph icon + label + value (standard text color)
- **Compact:** Icon + value only (no label)

**States:**
- **Default:** Standard appearance
- **Hover:** Show tooltip with detailed breakdown
- **Clickable:** Opens detailed view (Revenue Dashboard, Time Analytics)

**Usage Guidelines:**
- Use consistent icon sizing (20-24px)
- Highlight important metrics (revenue in green)
- Format numbers appropriately (currency, time duration)
- Update in real-time as data changes
- Provide tooltip with additional context on hover

**Visual Specifications:**
- Icon + Label + Value layout (horizontal)
- Value font size: 18-20px, bold
- Label font size: 12-14px, regular weight
- Spacing: 8px between icon and label, 4px between label and value

---

### Column Component

**Purpose:** Container for organizing tasks in workflow stages (Backlog, In Progress, Review).

**Variants:**
- **Default:** Standard column with header and task list
- **Empty:** Column with no tasks (show empty state message)
- **Drop Target:** Visual feedback when dragging task over column

**States:**
- **Default:** Standard appearance, scrollable content
- **Hover:** Subtle background tint
- **Drop Target Valid:** Accent border, background highlight
- **Drop Target Invalid:** Red border, "Cannot drop here" indicator

**Usage Guidelines:**
- Maintain consistent column width (280-400px range)
- Support vertical scrolling for long task lists
- Show task count in header
- Provide column actions (add task, column options)
- Support column reordering (future feature)

**Visual Specifications:**
- Border-radius: 8-12px on column container
- Shadow: Subtle elevation (2-4px blur)
- Padding: 16px within column
- Header height: 48-56px
- Column spacing: 24-32px horizontal

---

### Modal Component

**Purpose:** Overlay dialogs for task details, forms, and confirmations.

**Variants:**
- **Task Detail Modal:** Large modal (80% width, 90% height) for task editing
- **Form Modal:** Medium modal (600px width) for task creation, client management
- **Confirmation Dialog:** Small modal (400px width) for confirmations
- **Full Screen:** Optional full-screen mode for complex forms

**States:**
- **Default:** Centered, elevated above background
- **Opening:** Fade in + scale up animation (200ms)
- **Closing:** Fade out + scale down animation (200ms)
- **Backdrop:** Dimmed background (opacity 0.5, blur optional)

**Usage Guidelines:**
- Center modal on screen
- Provide close button (X icon) and ESC key support
- Trap focus within modal (keyboard navigation)
- Prevent background scrolling when modal open
- Auto-focus first input in forms

**Visual Specifications:**
- Border-radius: 12-16px
- Shadow: High elevation (8-12px blur, multiple layers)
- Backdrop: Dark overlay (rgba(0,0,0,0.5))
- Max width: 90vw, max height: 90vh
- Padding: 24-32px within modal

---

### Toast Notification Component

**Purpose:** Temporary feedback messages for user actions (success, error, info).

**Variants:**
- **Success:** Green background, checkmark icon (e.g., "Task created successfully")
- **Error:** Red background, error icon (e.g., "Failed to save task")
- **Info:** Blue background, info icon (e.g., "Timer stopped automatically")
- **Warning:** Orange background, warning icon

**States:**
- **Appearing:** Slide in from top/bottom (300ms)
- **Visible:** Display for 3-5 seconds
- **Dismissing:** Fade out (200ms)
- **Dismissible:** X button to close manually

**Usage Guidelines:**
- Position: Top-right or top-center
- Stack multiple notifications vertically
- Auto-dismiss after 5 seconds (configurable)
- Support manual dismissal
- Don't block user interaction

**Visual Specifications:**
- Width: 320-400px
- Padding: 16px
- Border-radius: 8px
- Shadow: Medium elevation (4-6px blur)
- Icon size: 20px
