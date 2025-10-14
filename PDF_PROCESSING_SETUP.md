# PDF Processing Setup

This document explains how PDF processing has been implemented in the document upload feature.

## Overview

The system now supports full PDF processing with the following capabilities:

1. **Text Extraction**: Extracts text from PDF files that contain selectable text
2. **Image Conversion**: Converts PDF pages to images for scanned/image-based PDFs
3. **Vision API Processing**: Sends PDF page images to Claude's vision API for OCR and intelligent analysis
4. **Multi-page Support**: Handles multi-page PDFs (up to 10 pages for image conversion, 5 pages for vision API)

## Implementation Details

### 1. DocumentOCRService.js

The `pdfTextExtraction` method has been updated to:
- Use `pdfjs-dist` library for PDF processing
- Attempt text extraction first
- Convert pages to images if text extraction yields minimal results
- Return both extracted text and page images

```javascript
// Key changes:
- Imports pdfjs-dist/legacy/build/pdf.js for better compatibility
- Sets worker source to CDN for browser compatibility
- Renders PDF pages to canvas and converts to base64 JPEG images
- Returns pageImages array with base64 data for each page
```

### 2. DocumentProcessingService.js

Updated to handle PDF page images:
- `extractTextFromDocument`: Now returns pageImages from OCR service
- `processDocument`: Stores pageImages in document metadata
- `autoProcessWithAI`: Sends page images to Claude's vision API for scanned PDFs

### 3. Vision API Integration

The system now:
- Detects when a PDF has been converted to images
- Sends up to 5 page images to Claude's vision API
- Uses Claude to extract text, dates, people, organizations, and action items
- Automatically creates calendar events and contacts based on extracted data

## Usage

### For End Users

1. Upload a PDF through the document upload interface
2. The system automatically:
   - Extracts text if available
   - Converts to images if it's a scanned PDF
   - Analyzes content with AI
   - Creates calendar events and contacts
   - Tags relevant family members

### For Developers

To test PDF processing:

1. Open `test-pdf-upload.html` in a browser
2. Upload a PDF file
3. Check the console logs for processing details
4. View extracted images and text

## Supported PDF Types

1. **Text-based PDFs**: Documents with selectable text (e.g., digitally created forms)
2. **Scanned PDFs**: Images embedded in PDF format (e.g., scanned paper documents)
3. **Mixed PDFs**: Documents with both text and image content

## Limitations

1. **Page Limit**: Processes up to 10 pages for image conversion
2. **Vision API Limit**: Sends maximum 5 pages to Claude's vision API
3. **File Size**: Standard 20MB file size limit applies
4. **Processing Time**: Larger PDFs may take longer to process

## Error Handling

The system includes robust error handling:
- Falls back to text-only processing if image conversion fails
- Provides clear error messages for unsupported formats
- Continues processing even if AI analysis fails
- Logs detailed error information for debugging

## Configuration

The PDF.js worker is configured in `public/pdf-worker-loader.js` and loaded via `index.html`. This ensures compatibility across different browsers and environments.

## Future Enhancements

1. Support for more pages in vision processing
2. OCR language detection and multi-language support
3. Advanced table and form extraction
4. Batch processing for multiple PDFs
5. Progress indicators for long-running operations