// src/components/documents/PDFViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Maximize2,
  Minimize2,
  Search
} from 'lucide-react';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFViewer = ({ 
  fileUrl, 
  title = 'PDF Document', 
  onClose, 
  showToolbar = true,
  initialPage = 1,
  onTextExtracted = null 
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(initialPage);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        
        // Extract all text for searching
        if (onTextExtracted) {
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          setExtractedText(fullText);
          onTextExtracted(fullText);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };
    
    if (fileUrl) {
      loadPDF();
    }
  }, [fileUrl, onTextExtracted]);
  
  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Note: Text layer rendering is simplified for now
        // Text extraction still works for search and analysis
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };
    
    renderPage();
  }, [pdfDoc, pageNum, scale]);
  
  // Navigation functions
  const goToPrevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };
  
  const goToNextPage = () => {
    if (pageNum < pageCount) {
      setPageNum(pageNum + 1);
    }
  };
  
  // Zoom functions
  const zoomIn = () => {
    setScale(Math.min(scale + 0.25, 3.0));
  };
  
  const zoomOut = () => {
    setScale(Math.max(scale - 0.25, 0.5));
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Search in PDF
  const handleSearch = () => {
    if (searchText && extractedText) {
      const searchLower = searchText.toLowerCase();
      const textLower = extractedText.toLowerCase();
      
      // Find which page contains the search text
      const lines = textLower.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchLower)) {
          // Approximate page number (this is simplified)
          const approximatePage = Math.min(i + 1, pageCount);
          setPageNum(approximatePage);
          break;
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`bg-gray-100 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Page navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={pageNum <= 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm">
                Page {pageNum} of {pageCount}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={pageNum >= pageCount}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Zoom controls */}
            <div className="flex items-center space-x-2 border-l pl-4">
              <button
                onClick={zoomOut}
                className="p-1 rounded hover:bg-gray-100"
                title="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
              
              <span className="text-sm w-16 text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                className="p-1 rounded hover:bg-gray-100"
                title="Zoom in"
              >
                <ZoomIn size={20} />
              </button>
            </div>
            
            {/* Search */}
            <div className="flex items-center border-l pl-4">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1 rounded hover:bg-gray-100"
                title="Search in document"
              >
                <Search size={20} />
              </button>
              
              {showSearch && (
                <div className="ml-2 flex items-center">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search..."
                    className="px-2 py-1 text-sm border rounded"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Title */}
            <span className="text-sm font-medium mr-4">{title}</span>
            
            {/* Action buttons */}
            <a
              href={fileUrl}
              download={title}
              className="p-1 rounded hover:bg-gray-100"
              title="Download PDF"
            >
              <Download size={20} />
            </a>
            
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded hover:bg-gray-100"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-4">
        <div className="relative inline-block mx-auto">
          <canvas 
            ref={canvasRef}
            className="shadow-lg bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;