# Notion UI Style Guide

This document explains how to work with the Notion-inspired UI implemented in the Parentload application.

## Core Principles

- **Simple & Clean**: Use minimal borders, white space, and subtle visual cues
- **Content-focused**: Prioritize content readability with ample spacing
- **Lightweight**: Avoid heavy visual elements like shadows, gradients, or strong colors
- **Interaction**: Subtle hover states and feedback for interactive elements

## Using Notion Components

### Layout Components

Use `NotionLayout` as the main container for your pages:

```jsx
import NotionLayout from '../layout/NotionLayout';

const MyPage = () => {
  return (
    <NotionLayout title="My Page Title">
      {/* Your content here */}
    </NotionLayout>
  );
};
```

### Card Component

Use `NotionCard` for content sections:

```jsx
import NotionCard from '../common/NotionCard';
import { FileText } from 'lucide-react';

// Basic card
<NotionCard title="Section Title">
  <p>Card content goes here</p>
</NotionCard>

// With icon and actions
<NotionCard 
  title="Tasks" 
  icon={<FileText size={16} />}
  actions={<button>View all</button>}
>
  <p>Content with actions</p>
</NotionCard>

// Style variations
<NotionCard noPadding={true}>
  {/* No padding */}
</NotionCard>

<NotionCard fullWidth={true}>
  {/* Full width */}
</NotionCard>

<NotionCard hover={true}>
  {/* Hover effect */}
</NotionCard>
```

### UI Components

Use the components from `NotionUI.jsx`:

```jsx
import { 
  NotionButton, 
  NotionInput, 
  NotionCheckbox,
  NotionBadge,
  NotionTabs
} from '../common/NotionUI';

// Button variants
<NotionButton>Default Button</NotionButton>
<NotionButton variant="primary">Primary Button</NotionButton>
<NotionButton variant="outline">Outline Button</NotionButton>
<NotionButton variant="subtle">Subtle Button</NotionButton>
<NotionButton variant="link">Link Button</NotionButton>

// Button sizes
<NotionButton size="sm">Small</NotionButton>
<NotionButton size="md">Medium</NotionButton>
<NotionButton size="lg">Large</NotionButton>

// Input
<NotionInput 
  placeholder="Enter text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)} 
/>

// Checkbox
<NotionCheckbox 
  label="Enable feature" 
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>

// Badge
<NotionBadge>Default</NotionBadge>
<NotionBadge color="blue">Blue</NotionBadge>
<NotionBadge color="green">Green</NotionBadge>
<NotionBadge color="red">Red</NotionBadge>

// Tabs
<NotionTabs
  tabs={[
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' }
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
/>
```

### Data Visualization Components

```jsx
import { NotionPill, NotionProgressBar } from '../common/NotionCard';

// Pills for status/metrics
<NotionPill label="Status" value="Active" color="green" />
<NotionPill value="42 Tasks" color="blue" />

// Progress bars
<NotionProgressBar 
  value={75} 
  max={100} 
  color="blue"
  label="Project completion" 
/>
```

## CSS Classes

The `notion.css` file provides global styles and utility classes:

- Add `notion-enabled` class to containers to apply Notion styling
- Use semantic classes like:
  - `notion-button-subtle`
  - `notion-input`
  - `notion-link`
  - `notion-code`
  - `notion-divider`

## Command Palette

The command palette (Cmd+K / Ctrl+K) is automatically available in the `NotionLayout`. 

To add custom commands to it, modify the `getFilteredCommands` function in the `NotionLayout.jsx` file.

## Colors and Variables

Use CSS variables for consistent styling:

```css
:root {
  --notion-bg: #F7F7F7;
  --notion-sidebar-bg: #F5F5F5;
  --notion-text-primary: #2F3437;
  --notion-text-secondary: #6B6E70;
  --notion-border: #E5E7EB;
  --notion-accent: #0F62FE;
  --notion-accent-hover: #0050D9;
}
```

## Spacing Guidelines

- Page gutters: 24-32px
- Block spacing: 16px
- Card padding: 16px
- Form spacing: 16-24px between fields

## Typography

- Body text: Roboto, 16px
- Page titles: Roboto, 32px
- Section headings: Roboto, 20px
- Card titles: Roboto, 16px, medium weight

## Icons

Use Lucide icons with a consistent size:
- Navigation and main UI: 18px
- In text/buttons: 16px
- Small indicators: 14px

## Accessibility Considerations

- Keep color contrast high (AA standard minimum)
- Provide text labels alongside icons
- Ensure keyboard navigation works properly
- Maintain focus styles for keyboard users

## Examples

See these components for implementation examples:
- `NotionDashboard.jsx` - Full page using Notion styling
- `NotionLayout.jsx` - Page layout with sidebar and navigation
- `NotionFloatingCalendarWidget.jsx` - Floating UI component
- `NotionCard.jsx` - Card component with variations