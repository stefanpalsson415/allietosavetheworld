# Web Search Implementation Guide for Family Tree

## Current Status - UPDATED

The "Ask Allie" feature in the Family Tree tab now uses Claude Sonnet 4 (claude-sonnet-4-20250514) which has built-in web search capability! 

## Recent Updates

1. **Model Upgrade**: Updated from Claude 3 Sonnet to Claude Sonnet 4 with web search
2. **Prompt Enhancement**: Restored explicit internet search requests in prompts

## How to Implement Web Search

### Option 1: Use a Search API Service

1. **Choose a Search API**:
   - Google Custom Search API
   - Bing Web Search API
   - SerpAPI
   - Brave Search API

2. **Implementation Steps**:
   ```javascript
   // Example with Google Custom Search
   // In server/search-service.js
   const axios = require('axios');
   
   async function searchWeb(query) {
     const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
     const CX = process.env.GOOGLE_SEARCH_ENGINE_ID;
     
     const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
       params: {
         key: API_KEY,
         cx: CX,
         q: query
       }
     });
     
     return response.data.items;
   }
   ```

3. **Integrate with Claude**:
   - Perform search first
   - Pass search results to Claude as context
   - Let Claude synthesize the information

### Option 2: Use Claude with Tool Use (When Available)

Some newer Claude models support "tool use" which allows them to call external functions. When this becomes available:

1. Define a search tool
2. Let Claude decide when to search
3. Claude will integrate results naturally

### Option 3: Manual Research Helper

The current implementation now provides:
- Historical context based on time period and location
- Specific genealogical resource suggestions
- Search strategies tailored to the person's era and region

## Current Workaround

The prompt has been updated to:
1. Provide rich historical context
2. Suggest specific archives and databases
3. Recommend search strategies
4. Give era-appropriate research tips

## Example Implementation Plan

1. **Phase 1**: Current implementation (DONE)
   - Historical context
   - Research suggestions
   - Search strategies

2. **Phase 2**: Add Search API
   - Set up Google Custom Search or similar
   - Create search endpoint in backend
   - Modify FamilyTreeTab to call search first

3. **Phase 3**: Enhanced Integration
   - Cache search results
   - Let users verify/save findings
   - Build knowledge graph from discoveries

## User Communication

When users ask about internet search:
- Explain that Allie provides historical context and research guidance
- Suggest they use the recommended resources to search manually
- Offer to help interpret any findings they discover

## Future Enhancements

1. **OCR Integration**: Let users upload historical documents
2. **API Partnerships**: Partner with genealogy sites (Ancestry, FamilySearch)
3. **Collaborative Research**: Let family members share findings
4. **AI-Assisted Documentation**: Help users document their discoveries