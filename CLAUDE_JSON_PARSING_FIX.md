# Claude JSON Parsing Fix ✅

## Issue
Claude was returning JSON responses wrapped in markdown code blocks:
```
```json
[{"id": "example", "text": "Example"}]
```
```

This caused JSON.parse() to fail with: `Unexpected token '`'`

## Fix Applied

### 1. Clean Response Before Parsing
Added logic to remove markdown code blocks from Claude's response:
```javascript
// Clean the response - remove markdown code blocks if present
let cleanedResponse = response;
if (response.includes('```json')) {
  cleanedResponse = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
} else if (response.includes('```')) {
  cleanedResponse = response
    .replace(/```\s*/g, '')
    .trim();
}

const suggestions = JSON.parse(cleanedResponse);
```

### 2. Updated Prompt
Made the prompt more explicit to prevent markdown formatting:
```javascript
prompt += `\n\nReturn ONLY a JSON array with format: 
[{"id": "unique-id", "text": "Display text", "value": "Value to use"}]
Make each suggestion specific to this family, not generic.
IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks, no extra text.`;
```

## Result
- Personalized suggestions will now parse correctly
- Fallback to default suggestions if parsing still fails
- Better error logging to debug any remaining issues

## Testing
The habit setup flow should now show personalized suggestions at each step instead of falling back to defaults.