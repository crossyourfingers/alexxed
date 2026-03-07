# Feature Specification: Unified Minimal UI with Green/Black Theme

**Feature Branch**: `ui-unified-minimal-green-black`  
**Created**: 2026-03-06  
**Status**: Active  
**Input**: User description: "Build out a unified UI across the entire app with a sleek minimal look that uses greens and blacks but isn't offensive to the eyes and still accessible"

## Vision

Create a unified, minimal, and accessible interface using a green and black color palette that provides:
- Visual coherence across all pages and components
- Comfortable, non-fatiguing aesthetics suitable for extended use
- WCAG AAA accessibility compliance (contrast ratio ≥7:1)
- Sleek, modern design language that emphasizes content over chrome

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Visual Experience Across Pages (Priority: P1)

Users navigate between different pages (Community, Stream) and experience a unified visual language with consistent spacing, colors, and typography throughout the application.

**Why this priority**: Visual consistency is foundational to professional UI/UX. Without it, the app feels disjointed and unprofessional, directly impacting user trust and adoption.

**Independent Test**: Navigate from Stream to Community page. All header elements, spacing, buttons, and text should feel like the same application with identical design patterns.

**Acceptance Scenarios**:

1. **Given** a user is on the Stream page, **When** they navigate to the Community page, **Then** header height, spacing, and button styles are identical
2. **Given** a user views any page, **When** they observe spacing between elements, **Then** all gaps use consistent spacing tokens (--space-2, --space-4, etc.)
3. **Given** components use the theme system, **When** rendered on any page, **Then** colors derive from CSS custom properties not hardcoded values
4. **Given** interactive elements exist on any page, **When** user hovers over them, **Then** hover states are consistent and predictable

---

### User Story 2 - Accessible High-Contrast Reading Experience (Priority: P1)

Users with visual impairments or those working in various lighting conditions can read all text comfortably with WCAG AAA compliant contrast ratios (7:1 minimum) between text and backgrounds.

**Why this priority**: Accessibility is non-negotiable and legally required in many contexts. Poor contrast causes eye strain and excludes users with visual impairments.

**Independent Test**: Use browser DevTools or automated accessibility checker to verify all text elements meet WCAG AAA contrast requirements (7:1 ratio).

**Acceptance Scenarios**:

1. **Given** primary text is displayed on dark background, **When** measured with contrast checker, **Then** ratio is ≥7:1 (e.g., #f5f5f5 on #0a0a0a)
2. **Given** secondary text appears (timestamps, metadata), **When** contrast is measured, **Then** ratio is ≥4.5:1 minimum for AA compliance
3. **Given** system messages are muted for visual hierarchy, **When** contrast is measured, **Then** they still meet AA compliance (4.5:1) for legibility
4. **Given** buttons display primary green color, **When** text contrast is measured, **Then** on-primary text has ≥7:1 ratio

---

### User Story 3 - Clear Visual Hierarchy and Scanability (Priority: P2)

Users can quickly scan the interface and understand information hierarchy through consistent use of typography scale, font weights, and spacing without visual clutter.

**Why this priority**: Clear hierarchy improves task completion speed and reduces cognitive load. Users should never wonder "what should I look at first?"

**Independent Test**: Ask 5 users to identify the most important action on each page within 3 seconds. 80%+ should correctly identify primary CTAs.

**Acceptance Scenarios**:

1. **Given** a page with multiple text sizes, **When** user scans the content, **Then** headings (--text-xl, --text-2xl) are clearly larger than body text (--text-base)
2. **Given** a message feed with mixed message types, **When** viewing the feed, **Then** user messages are prominent while system messages are visually de-emphasized but readable
3. **Given** interactive elements (buttons, links), **When** comparing them to static text, **Then** primary actions use primary color while secondary actions use muted colors
4. **Given** form inputs exist, **When** focused, **Then** clear focus indicator (--color-border-focus) appears with no ambiguity

---

### User Story 4 - Comfortable Extended Use Without Eye Fatigue (Priority: P2)

Users engage with the application for extended periods (2+ hours) without experiencing eye strain or fatigue from the color palette, with smooth transitions and comfortable brightness levels.

**Why this priority**: Chat/community applications see extended use sessions. Uncomfortable UI causes user abandonment and negative perception.

**Independent Test**: User feedback after 1-hour session: subjective report of comfort level and any eye strain symptoms.

**Acceptance Scenarios**:

1. **Given** dark mode is active (default), **When** user views for extended periods, **Then** black backgrounds are pure black (#0a0a0a) not gray to reduce light emission
2. **Given** green accent colors are used, **When** viewing them, **Then** saturation is moderate (HSL saturation ~60-70%) not neon-bright to prevent fatigue
3. **Given** state transitions occur (hover, focus), **When** animations play, **Then** duration is 150-300ms (subtle, not jarring)
4. **Given** text is displayed, **When** user reads for 30+ minutes, **Then** font smoothing (-webkit-font-smoothing: antialiased) improves clarity

---

### User Story 5 - System Messages Visually Distinguished (Priority: P3)

System-generated messages (user joined, user left) are clearly distinguishable from user messages but don't interrupt the reading flow with appropriate muted styling.

**Why this priority**: Prevents confusion about who said what, maintains context, but should be subtle to avoid distraction from actual conversations.

**Independent Test**: Show mixed feed of user and system messages to 5 new users. All should correctly identify which are system vs user messages within 5 seconds.

**Acceptance Scenarios**:

1. **Given** system message appears in feed, **When** user views it, **Then** it uses muted text color (--color-text-muted) and centered alignment
2. **Given** system message has timestamp, **When** rendered, **Then** timestamp format matches user messages but with smaller font (--text-xs)
3. **Given** consecutive system messages appear, **When** displayed, **Then** they're visually grouped with minimal spacing between them
4. **Given** user scrolls through feed, **When** system messages pass, **Then** they're quickly scanable without disrupting reading flow

---

### Edge Cases

- **High Contrast Mode**: When OS-level high contrast mode is enabled, does the theme system respect user preferences via prefers-contrast media query?
- **Reduced Motion**: When user has prefers-reduced-motion enabled, are all animations disabled or reduced to instant transitions?
- **Color Blindness**: Can users with deuteranopia (red-green color blindness) still differentiate UI states using brightness/saturation differences?
- **Very Long Content**: When messages contain 1000+ characters or code blocks, does spacing remain consistent?
- **Small Screens**: On 320px wide screens (iPhone SE), do spacing tokens scale appropriately or cause layout breaks?
- **Light Mode Toggle**: If light mode is added later, do all components respect the data-mode attribute without hardcoded colors?

## Requirements *(mandatory)*

### Functional Requirements

**Design System Foundation**

- **FR-001**: System MUST define all colors via CSS custom properties in theme.css with no hardcoded hex values in components
- **FR-002**: System MUST provide spacing tokens (--space-1 through --space-12) with consistent 0.25rem increments
- **FR-003**: System MUST define typography scale (--text-xs through --text-3xl) with clear hierarchy
- **FR-004**: System MUST provide semantic color tokens (--color-text-primary, --color-bg-base) not primitive colors

**Theme Management**

- **FR-005**: System MUST support data-theme="green" attribute on html element for green/black theme
- **FR-006**: System MUST support data-mode="dark" (default) and data-mode="light" for future light mode
- **FR-007**: System MUST cascade theme tokens from :root with proper CSS specificity
- **FR-008**: System MUST provide fallback values for browsers without full CSS custom property support

**Color Palette**

- **FR-009**: Primary green MUST be #22c55e (emerald-500) with hover state #16a34a (emerald-600)
- **FR-010**: Background base MUST be #0a0a0a (near-black) for OLED-friendly pure blacks
- **FR-011**: Text primary MUST be #f5f5f5 (neutral-100) for maximum readability on dark backgrounds
- **FR-012**: System MUST provide gradations of neutral colors for surfaces (#111111, #171717, #1f1f1f)

**Accessibility**

- **FR-013**: All body text (--text-base) on backgrounds MUST achieve ≥7:1 contrast ratio (WCAG AAA)
- **FR-014**: Secondary text MUST achieve ≥4.5:1 contrast ratio (WCAG AA minimum)
- **FR-015**: Focus indicators MUST be visible with ≥3:1 contrast against adjacent colors
- **FR-016**: Interactive elements MUST have minimum 44x44px touch targets on mobile

**Spacing Consistency**

- **FR-017**: All component padding MUST use spacing tokens (var(--space-N)) not arbitrary pixel values
- **FR-018**: Vertical rhythm MUST be consistent with --space-4 (1rem) as baseline unit
- **FR-019**: Component gaps (flexbox/grid) MUST use spacing tokens for uniformity
- **FR-020**: Page-level padding MUST be --space-4 on mobile, --space-6 on desktop

**Typography**

- **FR-021**: Body text MUST use --text-base (1rem/16px) with 1.5 line-height for readability
- **FR-022**: Headings MUST use font-weight-semibold (600) to establish hierarchy
- **FR-023**: Code/monospace text MUST use --font-mono family with syntax appropriate sizing
- **FR-024**: Font smoothing MUST be enabled (-webkit-font-smoothing: antialiased)

**Interactive States**

- **FR-025**: Buttons MUST have hover state with --color-primary-hover background
- **FR-026**: Buttons MUST have active state with translateY(1px) subtle press effect
- **FR-027**: Links MUST have hover color transition within 150-200ms duration
- **FR-028**: Focus-visible MUST show 2px solid outline with 2px offset

**Component Styling**

- **FR-029**: Headers MUST use consistent height and z-index (--z-header: 200) across pages
- **FR-030**: Buttons MUST use border-radius (--radius-md: 0.375rem) for subtle rounding
- **FR-031**: Cards/surfaces MUST use --color-bg-surface with optional shadow-sm elevation
- **FR-032**: System messages MUST use centered text-align with --color-text-muted color

### Key Entities *(design tokens as entities)*

- **Spacing Scale**: 12-step scale from --space-1 (0.25rem) to --space-12 (3rem)
- **Typography Scale**: 7 sizes from --text-xs to --text-3xl with consistent line-heights
- **Color System**: Semantic tokens (text-*, bg-*, border-*) mapping to theme-specific values
- **Animation Tokens**: Transition durations (fast: 150ms, base: 200ms, slow: 300ms)
- **Elevation System**: 4-level shadow scale for surface depth indication

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Accessibility Compliance**

- **SC-001**: 100% of text elements pass WCAG AAA contrast checker (7:1 for large text, 4.5:1 for small)
- **SC-002**: Application scores 100/100 on Lighthouse Accessibility audit
- **SC-003**: All interactive elements have minimum 44x44px touch targets (mobile)
- **SC-004**: Keyboard navigation reaches all interactive elements with visible focus indicators

**Visual Consistency**

- **SC-005**: Zero hardcoded hex colors in component files (grep audit passes)
- **SC-006**: All spacing uses tokens (no arbitrary px/rem values except in theme.css)
- **SC-007**: 95%+ of users identify the application as having "consistent design" in feedback survey
- **SC-008**: Visual regression tests pass with <5px tolerance across page transitions

**Performance**

- **SC-009**: Theme token CSS loads in <50ms (minified and gzipped)
- **SC-010**: CSS paint time for theme application <16ms (60fps threshold)
- **SC-011**: No JavaScript required for theme rendering (pure CSS solution)
- **SC-012**: Hover/focus state transitions complete within 150-300ms window

**User Comfort**

- **SC-013**: 80%+ of users report "comfortable for extended use" in usability testing
- **SC-014**: Eye strain complaints decrease by 50% compared to baseline (if measuring)
- **SC-015**: User session duration increases by 20%+ (indicating improved comfort)
- **SC-016**: Net Promoter Score (NPS) for UI quality increases to 8+/10

**Developer Experience**

- **SC-017**: New components can be styled using theme tokens without touching theme.css
- **SC-018**: Dark/light mode toggle can be added with <10 lines of code change
- **SC-019**: Design system documentation exists with visual examples of all tokens
- **SC-020**: Component style inconsistencies can be identified with automated linting

## Assumptions

- Users primarily use dark mode (default); light mode support deferred to future iteration
- Target browsers support CSS custom properties (95%+ browser coverage)
- Primary use case is desktop/tablet; mobile responsive but not mobile-first
- English language only (font stack optimized for Latin characters)
- Accessibility targets WCAG 2.1 AAA for text contrast, AA for other criteria

## Out of Scope

- Dynamic theme switching UI (picker component) - foundation only
- Animation choreography beyond simple transitions
- Custom focus indicator shapes (using browser default with color override)
- Print stylesheet optimization
- High contrast mode specific overrides (relies on browser defaults)
- RTL (right-to-left) language support
