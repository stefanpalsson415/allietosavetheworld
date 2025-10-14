# Add Login Background Image

## Steps to Add the Background Image

1. **Save the image to the public folder**:
   - Save your artwork image as `login-background.png` in the `/public` folder of your project
   - The full path should be: `/Users/stefanpalsson/parentload copy/parentload-clean/public/login-background.png`

2. **The code is already updated** to use this image as the background

## What Was Changed

### NotionFamilySelectionScreen.jsx

The login form now has:
- **Full-screen background image** with the artwork
- **Semi-transparent overlay** (20% black) for better text readability
- **White modal with 95% opacity** and backdrop blur for the login form
- **White text with drop shadows** for the header
- **Glassmorphism effect** on the login modal

### Styling Details

```css
- Background: Full cover, centered
- Overlay: 20% black for contrast
- Modal: 95% white with backdrop blur
- Shadow: Enhanced shadow for depth
- Text: White headers with drop shadows
```

## To Test

1. Copy your image to: `public/login-background.png`
2. Refresh the login page
3. You should see the vibrant artwork as the full-screen background
4. The login form should appear as a semi-transparent white modal on top

## Alternative: Use Base64

If you prefer, you can convert the image to base64 and embed it directly in the code. This would eliminate the need to copy the file.