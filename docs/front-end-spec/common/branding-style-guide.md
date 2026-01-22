# Branding & Style Guide

## Visual Identity

**Brand Guidelines:** FreelanceFlow emphasizes professionalism, efficiency, and clarity. The brand identity should reflect a tool built specifically for freelancers—serious about productivity but approachable and user-friendly.

**Brand Personality:**
- **Professional:** Clean, modern design that freelancers can trust with their business data
- **Efficient:** Streamlined interface that doesn't waste time or cognitive resources
- **Empowering:** Helps freelancers maximize revenue and productivity
- **Approachable:** Friendly but not casual—respects the professional nature of freelance work

**Logo:** Clock icon + "FreelanceFlow" wordmark (as seen in top navigation). The clock icon represents time tracking, while the wordmark uses clean, modern typography.

## Color Palette

| Color Type | Hex Code | Usage |
|------------|----------|-------|
| Primary | #000000 (Black) | Primary buttons, text, icons - represents professionalism and clarity |
| Secondary | #FFFFFF (White) | Backgrounds, card backgrounds, text on dark backgrounds |
| Accent | #10B981 (Green) | Revenue indicators, success states, active timers, positive feedback |
| Success | #10B981 (Green) | Success messages, completed states, revenue displays |
| Warning | #F97316 (Orange) | Medium priority tags, warning messages, caution states |
| Error | #EF4444 (Red) | High priority tags, error messages, destructive actions |
| Neutral - Text Primary | #111827 (Dark Grey) | Primary text, headings |
| Neutral - Text Secondary | #6B7280 (Medium Grey) | Secondary text, labels, placeholders |
| Neutral - Border | #E5E7EB (Light Grey) | Borders, dividers, subtle separators |
| Neutral - Background | #F9FAFB (Very Light Grey) | Page backgrounds, subtle backgrounds |
| Client Tag - Acme | #D1FAE5 (Light Green) | Client tag backgrounds (example: Acme Corp) |
| Client Tag - TechStart | #E9D5FF (Light Purple) | Client tag backgrounds (example: TechStart) |

**Color Usage Guidelines:**
- **Green (#10B981):** Use for all revenue-related elements, success states, and positive actions. This is the primary accent color that reinforces the financial value proposition.
- **Red (#EF4444):** Reserve for high-priority items and errors. Use sparingly to maintain visual hierarchy.
- **Orange (#F97316):** Use for medium-priority items and warnings. Provides visual distinction without the urgency of red.
- **Grey Scale:** Use neutral greys for text hierarchy, borders, and backgrounds. Maintain sufficient contrast (WCAG AA minimum 4.5:1 for text).
- **Client Tags:** Use light, pastel backgrounds with darker text for client identification. Ensure sufficient contrast for readability.

**Accessibility Considerations:**
- All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Don't rely solely on color to convey information (use icons, labels, patterns)
- Test color combinations for colorblind users (use tools like Color Oracle)
- Provide alternative indicators for status (icons, text labels in addition to color)

## Typography

### Font Families

- **Primary:** System font stack (San Francisco on macOS, Segoe UI on Windows, Roboto on Linux) or Inter/System Sans
  - Rationale: System fonts ensure fast loading, native feel, and excellent readability
  - Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Secondary:** Same as primary (no secondary font needed for MVP)
- **Monospace:** System monospace (SF Mono, Consolas, Monaco) for time displays and code
  - Fallback: `"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace`

**Font Selection Rationale:**
- System fonts provide native feel and performance
- No external font loading reduces initial load time
- Monospace for time displays ensures consistent width and alignment
- Consider Inter or custom font in future if brand identity requires it

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 | 32px (2rem) | 700 (Bold) | 1.2 | Page titles, major headings |
| H2 | 24px (1.5rem) | 600 (Semi-bold) | 1.3 | Section headings, column headers |
| H3 | 20px (1.25rem) | 600 (Semi-bold) | 1.4 | Subsection headings, card titles |
| H4 | 18px (1.125rem) | 600 (Semi-bold) | 1.4 | Minor headings |
| Body | 16px (1rem) | 400 (Regular) | 1.5 | Body text, task descriptions |
| Small | 14px (0.875rem) | 400 (Regular) | 1.5 | Secondary text, labels, metadata |
| X-Small | 12px (0.75rem) | 400 (Regular) | 1.4 | Timestamps, fine print |

**Typography Usage Guidelines:**
- **Headings:** Use H1-H4 for clear information hierarchy. Don't skip heading levels.
- **Body Text:** Use 16px as base size for optimal readability on desktop screens
- **Line Height:** Maintain 1.5 for body text, tighter (1.2-1.3) for headings
- **Weight:** Use bold (700) sparingly for emphasis. Semi-bold (600) for headings provides hierarchy without heaviness
- **Task Cards:** Use H3 (20px, semi-bold) for task titles, body (16px) for descriptions, small (14px) for metadata

## Iconography

**Icon Library:** TBD (recommendations: Heroicons, Lucide, or custom SVG set)

**Icon Style:**
- **Style:** Outline/minimalist icons for consistency and clarity
- **Weight:** 1.5-2px stroke width
- **Size:** Standard sizes: 16px (small), 20px (standard), 24px (large), 32px (extra large)
- **Color:** Inherit text color or use semantic colors (green for revenue, red for errors)

**Key Icons Needed:**
- **Time Tracking:** Play/pause triangle, clock, timer
- **Revenue:** Dollar sign, currency symbols
- **Navigation:** Plus (add), ellipsis (menu), close (X), arrow directions
- **Status:** Checkmark (complete), exclamation (warning), error (X circle)
- **Actions:** Edit, delete, settings, export
- **Client/Project:** Briefcase, folder, user/people

**Usage Guidelines:**
- Use icons consistently—same icon for same action throughout app
- Provide text labels for icon-only buttons (or tooltips)
- Ensure icons are recognizable and unambiguous
- Maintain consistent stroke width and style
- Use semantic colors (green for success/revenue, red for errors)

## Spacing & Layout

**Grid System:**
- **Base Unit:** 4px (all spacing multiples of 4)
- **Layout:** Flexible grid system (no fixed columns, use CSS Grid or Flexbox)
- **Container Max Width:** 1400-1600px for main content area (centered on larger screens)
- **Column Gaps:** 24-32px between kanban columns

**Spacing Scale:**
- **4px:** Tight spacing (icon to text, small gaps)
- **8px:** Small spacing (between related elements)
- **12px:** Medium-small spacing (between form fields)
- **16px:** Standard spacing (card padding, between sections)
- **24px:** Medium spacing (between columns, larger sections)
- **32px:** Large spacing (between major sections, top/bottom padding)
- **48px:** Extra large spacing (page margins, major section separation)

**Spacing Usage Guidelines:**
- Use consistent spacing scale throughout application
- Group related elements with smaller spacing (8-12px)
- Separate unrelated sections with larger spacing (24-32px)
- Maintain visual rhythm with consistent padding/margins
- Task cards: 12-16px vertical spacing between cards, 16px internal padding

**Layout Principles:**
- **Desktop-First:** Optimize for 1280px+ width screens
- **Flexible Width:** Columns and containers adapt to available space
- **Whitespace:** Use generous whitespace for clarity and focus
- **Alignment:** Align elements to grid for visual consistency
- **Responsive:** Adapt layout for smaller desktop windows (minimum 1024px width)
