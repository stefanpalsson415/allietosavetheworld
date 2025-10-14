# Claude API Integration

## Overview
The Claude API is now integrated directly into the backend server (server-simple.js) instead of using a separate proxy. This provides a cleaner architecture and avoids CORS issues.

## Configuration

1. **Environment Variable**: Add your Claude API key to the `.env` file:
   ```
   REACT_APP_CLAUDE_API_KEY=your_claude_api_key_here
   ```

2. **Backend Server**: The server runs on port 3002 by default

## API Endpoints

### Claude API Proxy
- **POST** `/api/claude` - Forward requests to Claude API
- **GET** `/api/claude/test` - Test endpoint to verify configuration

### Email Processing
The inbound email webhook now uses Claude to analyze emails and automatically:
- Extract email summary
- Categorize emails (medical/school/financial/general)
- Determine urgency level
- Identify specific actions needed
- Create tasks in the kanban board

## Usage

### Starting the Server
```bash
cd server
./start-backend.sh
# or
node server-simple.js
```

### Testing the Integration
```bash
cd server
node test-claude-integration.js
```

### Frontend Usage
The ClaudeService.js automatically uses the backend URL:
```javascript
// Automatically uses http://localhost:3002/api/claude
import ClaudeService from './services/ClaudeService';

const response = await ClaudeService.generateResponse(messages, context, options);
```

## Architecture Changes

1. **Removed**: Separate proxy server (src/simple-proxy.js)
2. **Added**: Claude endpoint in server-simple.js
3. **Updated**: ClaudeService.js to use backend URL
4. **Enhanced**: Email processing with intelligent Claude analysis

## Email Processing Flow

1. Email arrives at SendGrid webhook
2. Email is saved to Firestore
3. Claude analyzes the email content
4. Tasks are automatically created based on analysis
5. Email is marked as processed with analysis results

## Troubleshooting

1. **No API Key Error**: Ensure REACT_APP_CLAUDE_API_KEY is set in .env
2. **Connection Errors**: Check that the backend server is running on port 3002
3. **CORS Issues**: The backend server has CORS enabled for localhost:3000

## Security Notes

- API keys are kept server-side only
- All Claude requests go through the backend
- No direct API calls from the frontend