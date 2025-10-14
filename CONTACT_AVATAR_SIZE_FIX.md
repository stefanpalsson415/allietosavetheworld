# Contact Avatar Size Fix

## Issue
Profile images in the contact edit modal were too large, taking up excessive space in the "Assigned to Children" section.

## Root Cause
The UserAvatar component was being passed `size="xs"` (string) instead of a numeric pixel value. The UserAvatar component expects a number for the size prop.

## Fix Applied
Changed the UserAvatar size in the contact edit modal from:
```jsx
<UserAvatar user={child} size="xs" />
```

To:
```jsx
<UserAvatar user={child} size={24} />
```

## UserAvatar Size Guidelines
- Extra small (checkboxes, lists): `size={24}`
- Small (contact cards): `size={32}`
- Medium (default): `size={40}`
- Large (profile headers): `size={64}`

## Result
The profile images in the edit modal are now appropriately sized at 24px, making the form more compact and usable.