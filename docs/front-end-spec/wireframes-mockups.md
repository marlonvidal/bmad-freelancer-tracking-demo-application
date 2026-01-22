# Wireframes & Mockups

## Primary Design Files

**Design Tool:** TBD (Figma recommended for collaboration and developer handoff)

**Design File Structure:**
- `freelanceflow-design.fig` - Main design file
- Frames organized by screen/feature
- Component library for reusable UI elements
- Design tokens for colors, typography, spacing

**Design Handoff Process:**
- Export assets and specifications from design tool
- Provide CSS/styling values for developers
- Include interaction states and animations
- Document responsive breakpoints and variations

## Key Screen Layouts

### Dashboard/Kanban Board

**Purpose:** Primary interface for task management and time tracking. Serves as the command center where users spend most of their time.

**Key Elements:**

1. **Top Navigation Bar**
   - **Left:** Application logo (clock icon) + "FreelanceFlow" branding - clickable to return to dashboard
   - **Center:** Key metrics display
     - "Total Revenue:" with green dollar icon, value "$412.50" highlighted in green
     - "Billable Hours:" with line graph icon, value "4.0h" in darker font
   - **Right:** Primary actions and utilities
     - "+ Add task" button (black background, white text, prominent)
     - Globe/world icon (language/region settings)
     - Moon icon (dark mode toggle)

2. **Kanban Board Area**
   - **Column Structure:** Three vertical columns representing workflow stages
     - Column 1: "Backlog" (2 tasks)
     - Column 2: "In Progress" (2 tasks)
     - Column 3: "Review" (1 task)
   - **Column Headers:** Each includes
     - Column title and task count
     - "+" icon (add task to this column)
     - "..." icon (column options menu)
   - **Visual Design:**
     - Rounded corners on columns and cards
     - Subtle shadow effects for depth
     - Adequate spacing between columns for drag-and-drop
     - Scrollable columns if content exceeds viewport height

3. **Task Cards** (consistent design across all columns)
   - **Task Title:** Prominent, readable font
   - **Tags/Pills:** Color-coded indicators
     - Client tags: Light green (Acme Corp), Light purple (TechStart)
     - Priority tags: Red (high), Orange (medium), Light grey (low)
   - **Time Tracking Section:**
     - Play/Start button (black triangular icon) with "Start" label
     - Time spent display (e.g., "2h 30m", "1h 0m", "30m")
     - Clock icon with estimated time (e.g., "8h 0m", "4h 0m", "1h 0m")
   - **Revenue Indicator:** 
     - Green dollar sign with amount (e.g., "$275", "$95", "$43")
     - Light green pill-shaped background
     - "$0" shown for tasks without billable time
   - **Additional Metadata:**
     - Calendar icon with date (e.g., "Jan 24", "Jan 27", "Tomorrow")
     - "Non-billable" badge (light grey pill) when applicable
   - **Card States:**
     - Default: White background, subtle border
     - Hover: Slight elevation/shadow increase
     - Active/Dragging: Elevated shadow, slight scale
     - Timer Active: Visual indicator (e.g., pulsing border, accent color)

**Interaction Notes:**
- **Drag-and-Drop:** Smooth animation when moving cards between columns
- **Timer Control:** Click play icon to start/stop timer directly on card
- **Quick Actions:** Hover reveals additional actions (edit, delete, menu)
- **Card Expansion:** Click card to open detail view (modal or side panel)
- **Keyboard Navigation:** Arrow keys to move between cards, Enter to open details

**Design File Reference:** `Dashboard-Kanban-Board` frame in design tool

**Layout Specifications:**
- **Top Navigation Height:** ~60-70px
- **Column Width:** Flexible, minimum 280px, maximum 400px
- **Card Spacing:** 12-16px vertical spacing between cards
- **Column Spacing:** 24-32px horizontal spacing between columns
- **Padding:** 16-24px padding within columns and cards

---

### Task Detail View (Modal/Overlay)

**Purpose:** Expanded view for editing task details, viewing full time logs, and managing subtasks without leaving the board context.

**Key Elements:**

1. **Modal Header**
   - Task title (editable)
   - Close button (X icon)
   - Save/Cancel actions

2. **Task Information Section**
   - Client/Project selector (dropdown)
   - Priority selector (high/medium/low)
   - Due date picker
   - Billable toggle switch
   - Hourly rate input (if billable)

3. **Time Tracking Section**
   - Current timer display (if active)
   - Time spent summary
   - Estimated time input
   - Time log entries (chronological list)
   - Manual time entry form

4. **Description & Notes**
   - Rich text editor for task description
   - Notes/comment section

5. **Subtasks Section**
   - List of subtasks with checkboxes
   - Add subtask functionality

**Interaction Notes:**
- Opens as modal overlay, dimming background board
- Click outside modal or ESC key to close
- Auto-save draft changes
- Real-time validation feedback

**Design File Reference:** `Task-Detail-Modal` frame

---

### Task Creation Form

**Purpose:** Quick task creation interface accessible from multiple entry points.

**Key Elements:**

1. **Form Fields** (progressive disclosure)
   - **Required:** Task title (prominent, auto-focus)
   - **Quick Options:** Client selector, Priority, Column selection
   - **Advanced Options:** Due date, Time estimate, Billable toggle, Description

2. **Smart Defaults**
   - Pre-select current column or "Backlog"
   - Use last-used client if available
   - Default to billable if client has rate set

3. **Actions**
   - "Create Task" primary button
   - "Cancel" secondary button
   - Keyboard shortcuts (Enter to save, ESC to cancel)

**Interaction Notes:**
- Inline form option: Quick-add by typing directly in column (Trello-style)
- Modal form option: Full form with all options
- Form validation with inline error messages
- Success feedback: Task appears in column with brief highlight animation

**Design File Reference:** `Task-Creation-Form` frame

---

### Revenue Dashboard (Future Feature)

**Purpose:** Detailed analytics and reporting for billable hours and revenue tracking.

**Key Elements:**

1. **Summary Cards**
   - Total Revenue (period selector: Today/Week/Month)
   - Billable Hours
   - Average Hourly Rate
   - Tasks Completed

2. **Charts & Visualizations**
   - Revenue trend over time (line chart)
   - Revenue by client (bar chart or pie chart)
   - Time distribution (donut chart)
   - Billable vs Non-billable hours comparison

3. **Detailed Tables**
   - Time entries by task
   - Revenue by client
   - Export options (CSV, JSON)

**Interaction Notes:**
- Period selector (Today, This Week, This Month, Custom Range)
- Interactive charts with hover tooltips
- Export functionality for reports
- Filter by client, project, date range

**Design File Reference:** `Revenue-Dashboard` frame (future)

---

### Client Management Screen

**Purpose:** Create, edit, and manage client information and default rates.

**Key Elements:**

1. **Client List**
   - Search/filter clients
   - Client cards showing: Name, Default Rate, Total Revenue, Active Tasks

2. **Client Detail/Edit Form**
   - Client name
   - Default hourly rate
   - Contact information (optional)
   - Notes

3. **Client Actions**
   - Add new client
   - Edit existing client
   - Delete client (with confirmation)
   - View client's tasks

**Interaction Notes:**
- Quick-add client from task creation form
- Inline editing option for quick updates
- Validation: Require name, validate rate format

**Design File Reference:** `Client-Management` frame

---

### Settings Screen

**Purpose:** Application configuration and preferences.

**Key Elements:**

1. **General Settings**
   - Theme selection (Light/Dark/System)
   - Language/Region
   - Date/Time format

2. **Board Configuration**
   - Default columns setup
   - Column customization
   - Board preferences

3. **Keyboard Shortcuts**
   - List of available shortcuts
   - Customization options

4. **Data Management**
   - Export data (CSV, JSON)
   - Backup/Restore
   - Clear data (with warning)

**Interaction Notes:**
- Settings persist immediately
- Confirmation dialogs for destructive actions
- Help tooltips for each setting

**Design File Reference:** `Settings` frame
